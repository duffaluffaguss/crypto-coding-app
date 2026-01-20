import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/verify/github/callback`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const code = searchParams.get('code');

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect('/settings?error=GitHub OAuth not configured');
  }

  // Step 1: Redirect to GitHub OAuth
  if (!code) {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'read:user');
    authUrl.searchParams.set('state', state || '');
    authUrl.searchParams.set('allow_signup', 'false');

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
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('GitHub token exchange failed:', errorText);
      return NextResponse.redirect('/settings?error=Failed to connect GitHub account');
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData.error_description);
      return NextResponse.redirect('/settings?error=' + encodeURIComponent(tokenData.error_description));
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'CryptoCodingApp',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('GitHub user fetch failed:', errorText);
      return NextResponse.redirect('/settings?error=Failed to get GitHub user info');
    }

    const githubUser = await userResponse.json();

    if (!githubUser?.id || !githubUser?.login) {
      return NextResponse.redirect('/settings?error=Invalid GitHub user data');
    }

    // Check if this GitHub account is already verified by another user
    const { data: existingVerification } = await supabase
      .from('social_verifications')
      .select('user_id')
      .eq('platform', 'github')
      .eq('platform_user_id', githubUser.id.toString())
      .neq('user_id', user.id)
      .single();

    if (existingVerification) {
      return NextResponse.redirect('/settings?error=This GitHub account is already connected to another user');
    }

    // Save verification to database
    const { error: insertError } = await supabase
      .from('social_verifications')
      .upsert({
        user_id: user.id,
        platform: 'github',
        platform_user_id: githubUser.id.toString(),
        username: githubUser.login,
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error saving GitHub verification:', insertError);
      return NextResponse.redirect('/settings?error=Failed to save verification');
    }

    return NextResponse.redirect('/settings?verified=true');

  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect('/settings?error=GitHub verification failed');
  }
}