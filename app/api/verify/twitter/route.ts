import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/verify/twitter/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const code = searchParams.get('code');

  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect('/settings?error=Twitter OAuth not configured');
  }

  // Step 1: Redirect to Twitter OAuth
  if (!code) {
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'tweet.read users.read');
    authUrl.searchParams.set('state', state || '');
    authUrl.searchParams.set('code_challenge', 'challenge');
    authUrl.searchParams.set('code_challenge_method', 'plain');

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
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: 'challenge',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Twitter token exchange failed:', errorText);
      return NextResponse.redirect('/settings?error=Failed to connect Twitter account');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get Twitter user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Twitter user fetch failed:', errorText);
      return NextResponse.redirect('/settings?error=Failed to get Twitter user info');
    }

    const twitterUser = await userResponse.json();
    const { data: twitterUserData } = twitterUser;

    if (!twitterUserData?.id || !twitterUserData?.username) {
      return NextResponse.redirect('/settings?error=Invalid Twitter user data');
    }

    // Check if this Twitter account is already verified by another user
    const { data: existingVerification } = await supabase
      .from('social_verifications')
      .select('user_id')
      .eq('platform', 'twitter')
      .eq('platform_user_id', twitterUserData.id)
      .neq('user_id', user.id)
      .single();

    if (existingVerification) {
      return NextResponse.redirect('/settings?error=This Twitter account is already connected to another user');
    }

    // Save verification to database
    const { error: insertError } = await supabase
      .from('social_verifications')
      .upsert({
        user_id: user.id,
        platform: 'twitter',
        platform_user_id: twitterUserData.id,
        username: twitterUserData.username,
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error saving Twitter verification:', insertError);
      return NextResponse.redirect('/settings?error=Failed to save verification');
    }

    return NextResponse.redirect('/settings?verified=true');

  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return NextResponse.redirect('/settings?error=Twitter verification failed');
  }
}