import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateUserWeeklyDigest } from '@/lib/email-digest';
import { render } from '@react-email/render';
import { WeeklyDigestEmail } from '@/emails/weekly-digest';

interface PreviewRequest {
  userId?: string; // Optional: preview for specific user, otherwise use current user
  useCurrentWeek?: boolean; // For testing: use current week instead of previous week
  format?: 'html' | 'json'; // Response format
}

/**
 * POST /api/digest/preview
 * 
 * Preview a weekly digest email
 * - Generate digest data for user
 * - Return either the rendered HTML or the JSON data
 * 
 * Useful for:
 * - Testing the digest generation
 * - Previewing what the email will look like
 * - Debugging digest data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: PreviewRequest = await request.json();
    const { 
      userId = user.id, 
      useCurrentWeek = false,
      format = 'html'
    } = body;

    // Users can only preview their own digest unless they have admin privileges
    if (userId !== user.id) {
      // Check if user is admin (you might have this in your profiles table)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Cannot preview digest for other users' },
          { status: 403 }
        );
      }
    }

    // Generate digest data
    const digestData = await generateUserWeeklyDigest(userId, useCurrentWeek);
    
    if (!digestData) {
      return NextResponse.json(
        { error: 'Could not generate digest data for user' },
        { status: 400 }
      );
    }

    // Return JSON format if requested
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: digestData,
        meta: {
          weekType: useCurrentWeek ? 'current' : 'previous',
          generatedAt: new Date().toISOString(),
        }
      });
    }

    // Generate email HTML using React Email
    const emailHtml = render(WeeklyDigestEmail({
      displayName: digestData.displayName,
      stats: digestData.stats,
    }));

    // Return HTML with proper content type
    return new Response(emailHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Digest preview endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/digest/preview
 * 
 * Simple GET endpoint for quick preview (uses current user, current week)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';
    const useCurrentWeek = searchParams.get('current') === 'true';

    // Generate digest data for current user
    const digestData = await generateUserWeeklyDigest(user.id, useCurrentWeek);
    
    if (!digestData) {
      return NextResponse.json(
        { error: 'Could not generate digest data for user' },
        { status: 400 }
      );
    }

    // Return JSON format if requested
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: digestData,
        meta: {
          weekType: useCurrentWeek ? 'current' : 'previous',
          generatedAt: new Date().toISOString(),
        }
      });
    }

    // Generate email HTML
    const emailHtml = render(WeeklyDigestEmail({
      displayName: digestData.displayName,
      stats: digestData.stats,
    }));

    // Return HTML
    return new Response(emailHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Digest preview GET endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}