/**
 * Achievement Notification Email Template
 * Sent when a user unlocks an achievement
 */

import * as React from 'react';

interface AchievementEmailProps {
  displayName: string;
  achievementName: string;
  achievementIcon: string;
  points: number;
  description?: string;
  profileUrl?: string;
  settingsUrl?: string;
}

export const AchievementEmail: React.FC<AchievementEmailProps> = ({
  displayName,
  achievementName,
  achievementIcon,
  points,
  description,
  profileUrl = 'https://cryptocode.dev/profile',
  settingsUrl = 'https://cryptocode.dev/settings',
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Achievement Unlocked!</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: '#0f0f0f',
          color: '#ffffff',
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}
        >
          <tbody>
            <tr>
              <td>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h1 style={{ fontSize: '32px', margin: 0, color: '#f59e0b' }}>
                    ⚡ CryptoCode
                  </h1>
                </div>

                {/* Achievement Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '16px',
                    padding: '40px',
                    border: '1px solid #f59e0b',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                    {achievementIcon}
                  </div>

                  <h2
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '28px',
                      color: '#f59e0b',
                    }}
                  >
                    Achievement Unlocked!
                  </h2>

                  <h3
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '22px',
                      color: '#ffffff',
                    }}
                  >
                    {achievementName}
                  </h3>

                  {description && (
                    <p
                      style={{
                        color: '#a0a0a0',
                        fontSize: '16px',
                        marginBottom: '24px',
                      }}
                    >
                      {description}
                    </p>
                  )}

                  <div
                    style={{
                      background: '#0f0f0f',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'inline-block',
                    }}
                  >
                    <span
                      style={{
                        color: '#f59e0b',
                        fontSize: '24px',
                        fontWeight: 'bold',
                      }}
                    >
                      +{points}
                    </span>
                    <span
                      style={{
                        color: '#a0a0a0',
                        fontSize: '16px',
                        marginLeft: '8px',
                      }}
                    >
                      points earned
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <p style={{ color: '#a0a0a0', marginBottom: '20px' }}>
                    Keep up the great work, {displayName}!
                  </p>
                  <a
                    href={profileUrl}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#000000',
                      textDecoration: 'none',
                      padding: '14px 32px',
                      borderRadius: '8px',
                      fontWeight: 600,
                    }}
                  >
                    View All Achievements →
                  </a>
                </div>

                {/* Footer */}
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    color: '#666',
                    fontSize: '12px',
                  }}
                >
                  <a
                    href={settingsUrl}
                    style={{ color: '#f59e0b', textDecoration: 'none' }}
                  >
                    Manage email preferences
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
};

export default AchievementEmail;
