import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const PROJECT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  nft_marketplace: { bg: '#8B5CF6', text: '#F3E8FF' },
  token: { bg: '#EAB308', text: '#FEF9C3' },
  dao: { bg: '#3B82F6', text: '#DBEAFE' },
  game: { bg: '#22C55E', text: '#DCFCE7' },
  social: { bg: '#EC4899', text: '#FCE7F3' },
  creator: { bg: '#F97316', text: '#FFEDD5' },
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const type = searchParams.get('type') || 'default'; // project | profile | certificate | default
  const title = searchParams.get('title') || 'Zero to Crypto Dev';
  const description = searchParams.get('description') || 'Learn Web3 Development';
  const projectType = searchParams.get('projectType') || '';
  const userName = searchParams.get('userName') || '';
  const stats = searchParams.get('stats') || '';

  const colors = PROJECT_TYPE_COLORS[projectType] || { bg: '#8B5CF6', text: '#F3E8FF' };
  const typeLabel = PROJECT_TYPE_LABELS[projectType] || '';

  // Common styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    height: '100%',
    padding: '48px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: 'white',
    fontFamily: 'system-ui, sans-serif',
  };

  if (type === 'project') {
    return new ImageResponse(
      (
        <div style={containerStyle}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#8B5CF6',
              }}
            >
              Zero to Crypto Dev
            </div>
          </div>

          {/* Project Type Badge */}
          {typeLabel && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                {typeLabel}
              </div>
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              lineHeight: 1.2,
              marginBottom: '24px',
              maxWidth: '80%',
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '24px',
              color: '#94A3B8',
              lineHeight: 1.4,
              maxWidth: '70%',
              marginBottom: 'auto',
            }}
          >
            {description}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '9999px',
                  backgroundColor: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                {userName ? userName[0].toUpperCase() : '?'}
              </div>
              <span style={{ fontSize: '20px', color: '#CBD5E1' }}>
                {userName || 'Anonymous'}
              </span>
            </div>
            <div style={{ fontSize: '18px', color: '#64748B' }}>
              Built on Base
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  if (type === 'profile') {
    const parsedStats = stats ? JSON.parse(stats) : {};
    
    return new ImageResponse(
      (
        <div style={containerStyle}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#8B5CF6',
              }}
            >
              Zero to Crypto Dev
            </div>
          </div>

          {/* Profile Section */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '48px' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '9999px',
                backgroundColor: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                marginRight: '32px',
              }}
            >
              {title ? title[0].toUpperCase() : '?'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{title}</div>
              <div style={{ fontSize: '24px', color: '#94A3B8' }}>
                Web3 Developer
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              marginTop: 'auto',
              marginBottom: '32px',
            }}
          >
            {parsedStats.projects !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#8B5CF6' }}>
                  {parsedStats.projects}
                </div>
                <div style={{ fontSize: '18px', color: '#94A3B8' }}>Projects</div>
              </div>
            )}
            {parsedStats.achievements !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#F59E0B' }}>
                  {parsedStats.achievements}
                </div>
                <div style={{ fontSize: '18px', color: '#94A3B8' }}>Achievements</div>
              </div>
            )}
            {parsedStats.streak !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#22C55E' }}>
                  {parsedStats.streak}
                </div>
                <div style={{ fontSize: '18px', color: '#94A3B8' }}>Day Streak</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ fontSize: '18px', color: '#64748B' }}>
            zerotocryptodev.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  if (type === 'certificate') {
    return new ImageResponse(
      (
        <div
          style={{
            ...containerStyle,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1a1a2e 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {/* Certificate Border */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 64px',
              border: '4px solid #8B5CF6',
              borderRadius: '24px',
              background: 'rgba(139, 92, 246, 0.1)',
            }}
          >
            {/* Award Icon */}
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>

            {/* Title */}
            <div
              style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#8B5CF6',
                marginBottom: '16px',
                letterSpacing: '0.1em',
              }}
            >
              CERTIFICATE OF COMPLETION
            </div>

            {/* User Name */}
            <div
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                marginBottom: '16px',
              }}
            >
              {userName || 'Web3 Developer'}
            </div>

            {/* Project */}
            <div style={{ fontSize: '20px', color: '#CBD5E1', marginBottom: '8px' }}>
              Successfully completed
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#F3E8FF',
                marginBottom: '24px',
              }}
            >
              {title}
            </div>

            {/* Project Type Badge */}
            {typeLabel && (
              <div
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  backgroundColor: colors.bg,
                  color: colors.text,
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                {typeLabel}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '32px',
              fontSize: '18px',
              color: '#64748B',
            }}
          >
            Zero to Crypto Dev • zerotocryptodev.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // Default OG image
  return new ImageResponse(
    (
      <div style={containerStyle}>
        {/* Logo/Brand */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#8B5CF6',
            marginBottom: '48px',
          }}
        >
          Zero to Crypto Dev
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            lineHeight: 1.2,
            marginBottom: '24px',
            maxWidth: '80%',
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '28px',
            color: '#94A3B8',
            lineHeight: 1.4,
            maxWidth: '70%',
            marginBottom: 'auto',
          }}
        >
          {description}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '48px',
          }}
        >
          <div style={{ fontSize: '20px', color: '#CBD5E1' }}>
            Learn • Build • Deploy
          </div>
          <div style={{ fontSize: '18px', color: '#64748B' }}>
            Built on Base
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
