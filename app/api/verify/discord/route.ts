import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Discord OAuth configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/verify/discord/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const code = searchParams.get('code');

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return NextResponse.redirect('/settings?error=Discord OAuth not configured');
  }

  // Step 1: Redirect to Discord OAuth
  if (!code) {
    const authUrl = new URL('https://discord.com/oauth2/authorize');
    authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'identify');
    authUrl.searchParams.set('state', state || '');

    return NextResponse.redirect(authUrl.toString());
  }

  // Step 2: Handle OAuth callback
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.redirect('/settings?error=Please sign in first');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Discord token exchange failed:', errorText);
      return NextResponse.redirect('/settings?error=Failed to connect Discord account');
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Discord OAuth error:', tokenData.error_description);
      return NextResponse.redirect('/settings?error=' + encodeURIComponent(tokenData.error_description));
    }

    const accessToken = tokenData.access_token;

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Discord user fetch failed:', errorText);
      return NextResponse.redirect('/settings?error=Failed to get Discord user info');
    }

    const discordUser = await userResponse.json();

    if (!discordUser?.id || !discordUser?.username) {
      return NextResponse.redirect('/settings?error=Invalid Discord user data');
    }

    // Check if this Discord account is already verified by another user
    const { data: existingVerification } = await supabase
      .from('social_verifications')
      .select('user_id')
      .eq('platform', 'discord')
      .eq('platform_user_id', discordUser.id)
      .neq('user_id', user.id)
      .single();

    if (existingVerification) {
      return NextResponse.redirect('/settings?error=This Discord account is already connected to another user');
    }

    // Save verification to database
    const { error: insertError } = await supabase
      .from('social_verifications')
      .upsert({
        user_id: user.id,
        platform: 'discord',
        platform_user_id: discordUser.id,
        username: discordUser.username,
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error saving Discord verification:', insertError);
      return NextResponse.redirect('/settings?error=Failed to save verification');
    }

    return NextResponse.redirect('/settings?verified=true');

  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect('/settings?error=Discord verification failed');
  }
}