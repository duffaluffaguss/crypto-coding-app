/**
 * Welcome Email Template
 * Sent when a user signs up for CryptoCode
 */

import * as React from 'react';

interface WelcomeEmailProps {
  displayName: string;
  dashboardUrl?: string;
  settingsUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  displayName,
  dashboardUrl = 'https://cryptocode.dev/dashboard',
  settingsUrl = 'https://cryptocode.dev/settings',
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to CryptoCode</title>
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

                {/* Main Content */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '16px',
                    padding: '40px',
                    border: '1px solid #333',
                  }}
                >
                  <h2
                    style={{
                      margin: '0 0 20px 0',
                      fontSize: '24px',
                      color: '#ffffff',
                    }}
                  >
                    Welcome aboard, {displayName}! 🚀
                  </h2>

                  <p
                    style={{
                      color: '#a0a0a0',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      marginBottom: '24px',
                    }}
                  >
                    You've just taken the first step into the world of Web3 development.
                    CryptoCode is your interactive learning platform to master smart
                    contracts, DeFi protocols, and blockchain technology.
                  </p>

                  <div
                    style={{
                      background: '#0f0f0f',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '24px',
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 16px 0',
                        color: '#f59e0b',
                        fontSize: '16px',
                      }}
                    >
                      🎯 What's next?
                    </h3>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '20px',
                        color: '#a0a0a0',
                        lineHeight: '1.8',
                      }}
                    >
                      <li>Complete your first lesson to start your streak 🔥</li>
                      <li>Earn achievements as you progress 🏆</li>
                      <li>Build real smart contracts in our interactive editor 💻</li>
                      <li>Climb the leaderboard and compete with others 📊</li>
                    </ul>
                  </div>

                  <a
                    href={dashboardUrl}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#000000',
                      textDecoration: 'none',
                      padding: '14px 32px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}
                  >
                    Start Learning →
                  </a>
                </div>

                {/* Footer */}
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    color: '#666',
                  }}
                >
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                    Happy coding! 🎉
                  </p>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    <a
                      href={settingsUrl}
                      style={{ color: '#f59e0b', textDecoration: 'none' }}
                    >
                      Manage email preferences
                    </a>
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
};

export default WelcomeEmail;
