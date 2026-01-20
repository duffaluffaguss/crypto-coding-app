import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response('User ID required', { status: 400 });
    }

    // Fetch user data (no auth needed for OG image generation)
    const supabase = await createClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response('User not found', { status: 404 });
    }

    // Fetch user stats
    const [
      { count: projectsCount },
      { count: lessonsCount },
      { data: userAchievements },
      { data: challengeCompletions }
    ] = await Promise.all([
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('learning_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId),
      supabase
        .from('challenge_completions')
        .select('points_earned, bonus_points')
        .eq('user_id', userId)
    ]);

    // Calculate achievement points
    const achievementPoints = userAchievements?.reduce((total, ua) => {
      return total + ((ua.achievements as any)?.points || 0);
    }, 0) || 0;

    // Calculate challenge points
    const challengePoints = (challengeCompletions || []).reduce(
      (sum, c) => sum + (c.points_earned || 0) + (c.bonus_points || 0),
      0
    );

    const stats = {
      displayName: profile.display_name || 'Anonymous Developer',
      projectsCreated: projectsCount || 0,
      lessonsCompleted: lessonsCount || 0,
      currentStreak: profile.current_streak || 0,
      achievementPoints,
      challengePoints,
      totalAchievements: userAchievements?.length || 0,
      challengesCompleted: challengeCompletions?.length || 0,
    };

    // Get Inter font
    const fontData = await fetch(
      new URL('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap')
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #db2777 100%)',
            fontFamily: 'Inter',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
              `,
            }}
          />

          {/* Main Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '32px',
              padding: '48px',
              margin: '48px',
              boxShadow: '0 32px 64px rgba(0, 0, 0, 0.3)',
              maxWidth: '800px',
              width: '100%',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  marginRight: '16px',
                }}
              >
                🌟
              </div>
              <h1
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#1f2937',
                  margin: 0,
                }}
              >
                Web3 Learning Journey
              </h1>
            </div>

            {/* User Name */}
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#374151',
                margin: '0 0 40px 0',
                textAlign: 'center',
              }}
            >
              {stats.displayName}
            </h2>

            {/* Stats Grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                justifyContent: 'center',
                width: '100%',
                marginBottom: '32px',
              }}
            >
              {/* Lessons Completed */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  minWidth: '140px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                  {stats.lessonsCompleted}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Lessons</div>
              </div>

              {/* Current Streak */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  minWidth: '140px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔥</div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                  {stats.currentStreak}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Day Streak</div>
              </div>

              {/* Projects */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  minWidth: '140px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚀</div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                  {stats.projectsCreated}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Projects</div>
              </div>

              {/* Achievement Points */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  borderRadius: '16px',
                  padding: '24px',
                  color: 'white',
                  minWidth: '140px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
                <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                  {stats.achievementPoints}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Points</div>
              </div>
            </div>

            {/* Additional Stats */}
            {(stats.totalAchievements > 0 || stats.challengesCompleted > 0) && (
              <div
                style={{
                  display: 'flex',
                  gap: '32px',
                  marginBottom: '24px',
                }}
              >
                {stats.totalAchievements > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#6b7280',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🏅</span>
                    <span style={{ fontSize: '16px' }}>
                      {stats.totalAchievements} Achievements
                    </span>
                  </div>
                )}
                {stats.challengesCompleted > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#6b7280',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🎯</span>
                    <span style={{ fontSize: '16px' }}>
                      {stats.challengesCompleted} Challenges
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '16px',
                color: '#6b7280',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 600 }}>
                Zero to Crypto Dev
              </span>
              <span style={{ fontSize: '14px' }}>•</span>
              <span style={{ fontSize: '14px' }}>Building the future with Web3</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(`Failed to generate OG image: ${e}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}