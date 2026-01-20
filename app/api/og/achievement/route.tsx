import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const achievementId = searchParams.get('achievementId');

    if (!userId || !achievementId) {
      return new Response('User ID and Achievement ID required', { status: 400 });
    }

    // Fetch user and achievement data
    const supabase = await createClient();
    
    const [
      { data: profile },
      { data: achievement }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('achievements').select('*').eq('id', achievementId).single()
    ]);

    if (!profile || !achievement) {
      return new Response('User or achievement not found', { status: 404 });
    }

    const displayName = profile.display_name || 'Anonymous Developer';

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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 25%, #f59e0b 50%, #d97706 75%, #f59e0b 100%)',
            fontFamily: 'Inter',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 60%, rgba(255,255,255,0.1) 0%, transparent 50%)
              `,
            }}
          />

          {/* Confetti particles */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
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
              maxWidth: '900px',
              width: '100%',
              border: '4px solid rgba(245, 158, 11, 0.5)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  marginRight: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                🏆
              </div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  margin: 0,
                }}
              >
                Achievement Unlocked!
              </h1>
            </div>

            {/* Achievement Badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              {/* Large Icon Circle */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  borderRadius: '60px',
                  fontSize: '60px',
                  marginBottom: '20px',
                  boxShadow: '0 16px 32px rgba(245, 158, 11, 0.4)',
                  border: '4px solid rgba(255, 255, 255, 0.9)',
                }}
              >
                {achievement.icon}
              </div>

              {/* Achievement Name */}
              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#1f2937',
                  margin: '0 0 12px 0',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {achievement.name}
              </h2>

              {/* Achievement Description */}
              <p
                style={{
                  fontSize: '18px',
                  color: '#6b7280',
                  margin: '0 0 20px 0',
                  textAlign: 'center',
                  maxWidth: '600px',
                  lineHeight: 1.4,
                }}
              >
                {achievement.description}
              </p>

              {/* Points Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 600,
                  boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)',
                }}
              >
                <span style={{ fontSize: '20px' }}>⭐</span>
                +{achievement.points} Points
              </div>
            </div>

            {/* User Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white',
                }}
              >
                👤
              </div>
              <div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#1f2937',
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                  }}
                >
                  {achievement.category.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
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
    console.log(`Failed to generate achievement OG image: ${e}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}