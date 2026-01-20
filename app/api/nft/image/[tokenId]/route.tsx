import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getCertificate, getCertificateNFTAddress, formatCompletionDate } from '@/lib/certificate-nft';
import { baseSepolia, base } from 'viem/chains';
import {
  CertificateStyleConfig,
  deserializeStyle,
  getDefaultStyle,
  generateGradientCSS,
  ACCENT_COLORS,
} from '@/lib/certificate-styles';

export const runtime = 'edge';

// Cache images for 24 hours
export const revalidate = 86400;

const PROJECT_TYPE_COLORS: Record<string, { primary: string; secondary: string }> = {
  nft_marketplace: { primary: '#8B5CF6', secondary: '#C4B5FD' },
  token: { primary: '#EAB308', secondary: '#FDE047' },
  dao: { primary: '#3B82F6', secondary: '#93C5FD' },
  game: { primary: '#22C55E', secondary: '#86EFAC' },
  social: { primary: '#EC4899', secondary: '#F9A8D4' },
  creator: { primary: '#F97316', secondary: '#FDBA74' },
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'On-Chain Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

// Get secondary color for an accent color
function getSecondaryColor(primary: string): string {
  const found = ACCENT_COLORS.find((c) => c.color === primary);
  return found?.secondary || '#C4B5FD';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = BigInt(params.tokenId);
    
    // Get chain ID from query params, default to Base Sepolia
    const { searchParams } = new URL(request.url);
    const chainIdParam = searchParams.get('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam) : baseSepolia.id;
    
    // Get custom style from query params
    const styleParam = searchParams.get('style');
    let customStyle: CertificateStyleConfig | null = null;
    
    if (styleParam) {
      customStyle = deserializeStyle(styleParam);
    }

    // Verify contract is deployed
    const contractAddress = getCertificateNFTAddress(chainId);
    if (!contractAddress) {
      return generateErrorImage('Contract not deployed');
    }

    // Fetch certificate from blockchain
    let certificate;
    try {
      certificate = await getCertificate(chainId, tokenId);
    } catch {
      return generateErrorImage('Certificate not found');
    }

    if (!certificate || !certificate.projectId) {
      return generateErrorImage('Certificate not found');
    }

    const completionDate = formatCompletionDate(certificate.completionDate);
    const projectTypeLabel = PROJECT_TYPE_LABELS[certificate.projectType] || certificate.projectType;
    const networkName = chainId === base.id ? 'Base Mainnet' : 'Base Sepolia';
    
    // Shorten the address for display
    const shortAddress = `${certificate.recipient.slice(0, 6)}...${certificate.recipient.slice(-4)}`;

    // Determine colors - use custom style if available, otherwise project type defaults
    const defaultColors = PROJECT_TYPE_COLORS[certificate.projectType] || { primary: '#8B5CF6', secondary: '#C4B5FD' };
    const colors = customStyle 
      ? { primary: customStyle.accentColor, secondary: getSecondaryColor(customStyle.accentColor) }
      : defaultColors;
    
    // Generate background gradient
    const bgGradient = customStyle 
      ? generateGradientCSS(customStyle.background)
      : `linear-gradient(145deg, #0a0a1a 0%, #1a1a3e 40%, ${colors.primary}22 100%)`;
    
    // Element visibility from custom style or defaults
    const elements = customStyle?.elements || {
      showDate: true,
      showBadge: true,
      showContractAddress: true,
      showNetwork: true,
      showCornerAccents: true,
      showCertificateId: true,
    };
    
    // Border settings
    const borderWidth = customStyle?.border?.width || 3;
    const borderType = customStyle?.border?.type || 'gradient';
    const borderRadius = customStyle?.border?.radius || 24;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: bgGradient,
            padding: '40px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Decorative Elements */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.primary}33 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-150px',
              left: '-150px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.secondary}22 0%, transparent 70%)`,
            }}
          />

          {/* Main Certificate Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              border: borderType === 'none' ? 'none' : `${borderWidth}px ${borderType === 'double' ? 'double' : 'solid'} ${colors.primary}`,
              borderRadius: `${borderRadius}px`,
              background: 'rgba(10, 10, 26, 0.9)',
              padding: '40px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Corner Accents */}
            {elements.showCornerAccents && (
              <>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '60px', height: '60px', borderTop: `4px solid ${colors.primary}`, borderLeft: `4px solid ${colors.primary}`, borderRadius: '4px 0 0 0' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', borderTop: `4px solid ${colors.primary}`, borderRight: `4px solid ${colors.primary}`, borderRadius: '0 4px 0 0' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '60px', height: '60px', borderBottom: `4px solid ${colors.primary}`, borderLeft: `4px solid ${colors.primary}`, borderRadius: '0 0 0 4px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '60px', height: '60px', borderBottom: `4px solid ${colors.primary}`, borderRight: `4px solid ${colors.primary}`, borderRadius: '0 0 4px 0' }} />
              </>
            )}

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: colors.primary,
                  letterSpacing: '0.05em',
                }}
              >
                ZERO TO CRYPTO DEV
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: `${colors.primary}33`,
                  border: `1px solid ${colors.primary}`,
                }}
              >
                <span style={{ fontSize: '14px', color: colors.secondary, fontWeight: 600 }}>
                  #{tokenId.toString()}
                </span>
              </div>
            </div>

            {/* Award Icon & Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
              
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: colors.primary,
                  letterSpacing: '0.2em',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                Certificate of Completion
              </div>

              {/* Recipient Address */}
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  marginBottom: '12px',
                }}
              >
                {shortAddress}
              </div>

              <div style={{ fontSize: '18px', color: '#94A3B8', marginBottom: '8px' }}>
                successfully completed
              </div>

              {/* Project Name */}
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#F3E8FF',
                  marginBottom: '16px',
                  textAlign: 'center',
                  maxWidth: '80%',
                }}
              >
                {certificate.projectName}
              </div>

              {/* Project Type Badge */}
              {elements.showBadge && (
                <div
                  style={{
                    display: 'flex',
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0a0a1a' }}>
                    {projectTypeLabel}
                  </span>
                </div>
              )}

              {/* Completion Date */}
              {elements.showDate && (
                <div style={{ fontSize: '16px', color: '#64748B' }}>
                  {completionDate}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: `1px solid ${colors.primary}4D`,
              }}
            >
              {elements.showNetwork && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#22C55E',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#94A3B8' }}>
                    Verified on {networkName}
                  </span>
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#64748B' }}>
                zerotocryptodev.com
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          'Content-Type': 'image/png',
        },
      }
    );
  } catch (error) {
    console.error('NFT image generation error:', error);
    return generateErrorImage('Error generating image');
  }
}

function generateErrorImage(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>❓</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
          Certificate Not Found
        </div>
        <div style={{ fontSize: '18px', color: '#94A3B8' }}>{message}</div>
      </div>
    ),
    {
      width: 800,
      height: 800,
    }
  );
}
