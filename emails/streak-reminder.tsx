/**
 * Streak Reminder Email Template
 * Sent to remind users their streak is about to expire
 */

import * as React from 'react';

interface StreakReminderEmailProps {
  displayName: string;
  currentStreak: number;
  hoursRemaining: number;
  dashboardUrl?: string;
  settingsUrl?: string;
}

export const StreakReminderEmail: React.FC<StreakReminderEmailProps> = ({
  displayName,
  currentStreak,
  hoursRemaining,
  dashboardUrl = 'https://cryptocode.dev/dashboard',
  settingsUrl = 'https://cryptocode.dev/settings',
}) => {
  const getUrgencyText = () => {
    if (hoursRemaining <= 2) {
      return '⚠️ URGENT: Less than 2 hours remaining!';
    } else if (hoursRemaining <= 6) {
      return '⏰ Only a few hours left!';
    }
    return `⏳ About ${Math.floor(hoursRemaining)} hours remaining`;
  };

  const getUrgencyColor = () => {
    if (hoursRemaining <= 2) return '#ef4444';
    return '#fbbf24';
  };

  const getEncouragementText = () => {
    if (currentStreak >= 7) {
      return "You've worked so hard to build this streak. Don't let it slip away!";
    }
    return 'Every day of learning brings you closer to mastery!';
  };

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Don't Lose Your Streak!</title>
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

                {/* Streak Warning */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1810 100%)',
                    borderRadius: '16px',
                    padding: '40px',
                    border: '1px solid #ef4444',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔥</div>

                  <h2
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '24px',
                      color: '#ef4444',
                    }}
                  >
                    Your streak is at risk!
                  </h2>

                  <div
                    style={{
                      background: '#0f0f0f',
                      borderRadius: '12px',
                      padding: '20px',
                      margin: '20px 0',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: '#f59e0b',
                      }}
                    >
                      {currentStreak}
                    </div>
                    <div style={{ color: '#a0a0a0', fontSize: '16px' }}>
                      day streak
                    </div>
                  </div>

                  <p
                    style={{
                      color: getUrgencyColor(),
                      fontSize: '18px',
                      fontWeight: 600,
                      marginBottom: '24px',
                    }}
                  >
                    {getUrgencyText()}
                  </p>

                  <p
                    style={{
                      color: '#a0a0a0',
                      fontSize: '14px',
                      marginBottom: '24px',
                    }}
                  >
                    Complete just one lesson to keep your streak alive, {displayName}!
                  </p>

                  <a
                    href={dashboardUrl}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '16px 40px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '18px',
                    }}
                  >
                    Save My Streak! 🔥
                  </a>
                </div>

                {/* Motivation */}
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '30px',
                    color: '#a0a0a0',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {getEncouragementText()}
                  </p>
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

export default StreakReminderEmail;
