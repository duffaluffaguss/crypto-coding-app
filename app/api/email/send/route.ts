import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendEmail,
  generateWelcomeEmail,
  generateAchievementEmail,
  generateStreakReminderEmail,
  generateWeeklyDigestEmail,
} from '@/lib/email';

export type EmailType = 'welcome' | 'achievement' | 'streak-reminder' | 'weekly-digest';

interface WelcomePayload {
  displayName: string;
}

interface AchievementPayload {
  displayName: string;
  achievementName: string;
  achievementIcon: string;
  points: number;
  description?: string;
}

interface StreakReminderPayload {
  displayName: string;
  currentStreak: number;
  hoursRemaining: number;
}

interface WeeklyDigestPayload {
  displayName: string;
  stats: {
    lessonsCompleted: number;
    pointsEarned: number;
    currentStreak: number;
    achievementsUnlocked: number;
    rank?: number;
    rankChange?: number;
  };
}

type EmailPayload = WelcomePayload | AchievementPayload | StreakReminderPayload | WeeklyDigestPayload;

interface SendEmailRequest {
  type: EmailType;
  to: string;
  payload: EmailPayload;
}

/**
 * POST /api/email/send
 * 
 * Internal endpoint for sending emails
 * Requires authentication - only authenticated users can send emails to themselves
 * or server-side code can use this endpoint with proper authorization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check for internal API key (for cron jobs, etc.)
    const apiKey = request.headers.get('x-api-key');
    const isInternalCall = apiKey === process.env.INTERNAL_API_KEY;

    // Must be authenticated or have internal API key
    if (!user && !isInternalCall) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendEmailRequest = await request.json();
    const { type, to, payload } = body;

    // Validate required fields
    if (!type || !to || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to, payload' },
        { status: 400 }
      );
    }

    // If authenticated user, they can only send to their own email
    if (user && !isInternalCall && user.email !== to) {
      return NextResponse.json(
        { error: 'Cannot send email to other users' },
        { status: 403 }
      );
    }

    // Check email preferences if user is authenticated
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_preferences')
        .eq('id', user.id)
        .single();

      const prefs = profile?.email_preferences || {};
      
      // Check if this email type is disabled
      const prefKey = type.replace('-', '_');
      if (prefs[prefKey] === false) {
        return NextResponse.json(
          { success: true, skipped: true, reason: 'Email type disabled in preferences' },
          { status: 200 }
        );
      }
    }

    // Generate email content based on type
    let emailContent: { subject: string; html: string; text: string };

    switch (type) {
      case 'welcome': {
        const p = payload as WelcomePayload;
        emailContent = generateWelcomeEmail(p.displayName);
        break;
      }
      case 'achievement': {
        const p = payload as AchievementPayload;
        emailContent = generateAchievementEmail(
          p.displayName,
          p.achievementName,
          p.achievementIcon,
          p.points,
          p.description
        );
        break;
      }
      case 'streak-reminder': {
        const p = payload as StreakReminderPayload;
        emailContent = generateStreakReminderEmail(
          p.displayName,
          p.currentStreak,
          p.hoursRemaining
        );
        break;
      }
      case 'weekly-digest': {
        const p = payload as WeeklyDigestPayload;
        emailContent = generateWeeklyDigestEmail(p.displayName, p.stats);
        break;
      }
      default:
        return NextResponse.json(
          { error: `Invalid email type: ${type}` },
          { status: 400 }
        );
    }

    // Send the email
    const result = await sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      console.error('Email send failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Email send endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
