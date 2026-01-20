import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  generateUserWeeklyDigest, 
  getUsersForWeeklyDigest,
  type WeeklyDigestData 
} from '@/lib/email-digest';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/render';
import WeeklyDigestEmail from '@/emails/WeeklyDigest';

interface SendDigestRequest {
  userId?: string; // Optional: send to specific user, otherwise send to all eligible users
  useCurrentWeek?: boolean; // For testing: use current week instead of previous week
}

interface BatchSendResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
  details: Array<{
    userId: string;
    email: string;
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
  }>;
}

/**
 * POST /api/digest/send
 * 
 * Send weekly digest emails
 * - If userId provided: send to specific user
 * - If no userId: send to all eligible users (batch mode for cron jobs)
 * 
 * Requires internal API key for batch mode or user authentication for individual sends
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for internal API key (for cron jobs)
    const apiKey = request.headers.get('x-api-key');
    const isInternalCall = apiKey === process.env.INTERNAL_API_KEY;

    const body: SendDigestRequest = await request.json();
    const { userId, useCurrentWeek = false } = body;

    // Authentication check
    if (!isInternalCall) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // If user is authenticated but not internal call, they can only send to themselves
      if (userId && userId !== user.id) {
        return NextResponse.json(
          { error: 'Cannot send digest to other users' },
          { status: 403 }
        );
      }
    }

    // Single user mode
    if (userId) {
      const digestData = await generateUserWeeklyDigest(userId, useCurrentWeek);
      
      if (!digestData) {
        return NextResponse.json(
          { error: 'Could not generate digest data for user' },
          { status: 400 }
        );
      }

      if (!digestData.email) {
        return NextResponse.json(
          { error: 'User has no email address' },
          { status: 400 }
        );
      }

      // Generate email HTML using React Email
      const emailHtml = render(WeeklyDigestEmail({
        displayName: digestData.displayName,
        stats: digestData.stats,
      }));

      // Send email
      const result = await sendEmail({
        to: digestData.email,
        subject: '📊 Your Weekly CryptoCode Progress',
        html: emailHtml,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        userId: digestData.userId,
        email: digestData.email,
      });
    }

    // Batch mode - send to all eligible users
    if (!isInternalCall) {
      return NextResponse.json(
        { error: 'Batch mode requires internal API key' },
        { status: 403 }
      );
    }

    const eligibleUserIds = await getUsersForWeeklyDigest();
    console.log(`Starting batch digest send for ${eligibleUserIds.length} users`);

    const batchResult: BatchSendResult = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    // Process users in smaller batches to avoid overwhelming the email service
    const BATCH_SIZE = 10;
    for (let i = 0; i < eligibleUserIds.length; i += BATCH_SIZE) {
      const batchIds = eligibleUserIds.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batchIds.map(async (id) => {
        try {
          const digestData = await generateUserWeeklyDigest(id, useCurrentWeek);
          
          if (!digestData) {
            batchResult.skipped++;
            batchResult.details.push({
              userId: id,
              email: 'unknown',
              status: 'skipped',
              error: 'Could not generate digest data',
            });
            return;
          }

          if (!digestData.email) {
            batchResult.skipped++;
            batchResult.details.push({
              userId: id,
              email: 'none',
              status: 'skipped',
              error: 'No email address',
            });
            return;
          }

          // Skip users with no activity (all stats are 0)
          const { stats } = digestData;
          if (stats.lessonsCompleted === 0 && 
              stats.pointsEarned === 0 && 
              stats.achievementsUnlocked === 0) {
            batchResult.skipped++;
            batchResult.details.push({
              userId: id,
              email: digestData.email,
              status: 'skipped',
              error: 'No activity this week',
            });
            return;
          }

          // Generate email HTML
          const emailHtml = render(WeeklyDigestEmail({
            displayName: digestData.displayName,
            stats: digestData.stats,
          }));

          // Send email
          const result = await sendEmail({
            to: digestData.email,
            subject: '📊 Your Weekly CryptoCode Progress',
            html: emailHtml,
          });

          if (result.success) {
            batchResult.sent++;
            batchResult.details.push({
              userId: id,
              email: digestData.email,
              status: 'sent',
            });
          } else {
            batchResult.failed++;
            batchResult.errors.push(`${digestData.email}: ${result.error}`);
            batchResult.details.push({
              userId: id,
              email: digestData.email,
              status: 'failed',
              error: result.error,
            });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          batchResult.failed++;
          batchResult.errors.push(`${id}: ${errorMsg}`);
          batchResult.details.push({
            userId: id,
            email: 'unknown',
            status: 'failed',
            error: errorMsg,
          });
        }
      }));

      // Small delay between batches
      if (i + BATCH_SIZE < eligibleUserIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Batch digest send completed:`, batchResult);

    return NextResponse.json({
      success: true,
      batch: true,
      total: eligibleUserIds.length,
      ...batchResult,
    });

  } catch (error) {
    console.error('Digest send endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/digest/send
 * 
 * Get information about digest sending (for monitoring)
 * Requires authentication or internal API key
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for internal API key
    const apiKey = request.headers.get('x-api-key');
    const isInternalCall = apiKey === process.env.INTERNAL_API_KEY;

    if (!user && !isInternalCall) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eligibleUserIds = await getUsersForWeeklyDigest();

    return NextResponse.json({
      eligibleUsers: eligibleUserIds.length,
      lastWeekStart: new Date().toISOString(), // You might want to store this info
      nextScheduledSend: 'Every Monday at 9:00 AM UTC', // Configure as needed
    });

  } catch (error) {
    console.error('Digest send info endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}