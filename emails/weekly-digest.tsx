/**
 * Weekly Digest Email Template
 * Sent weekly with user's progress summary
 */

import * as React from 'react';

interface WeeklyDigestEmailProps {
  displayName: string;
  stats: {
    lessonsCompleted: number;
    pointsEarned: number;
    currentStreak: number;
    achievementsUnlocked: number;
    rank?: number;
    rankChange?: number;
  };
  dashboardUrl?: string;
  settingsUrl?: string;
}

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  displayName,
  stats,
  dashboardUrl = 'https://cryptocode.dev/dashboard',
  settingsUrl = 'https://cryptocode.dev/settings',
}) => {
  const { lessonsCompleted, pointsEarned, currentStreak, achievementsUnlocked, rank, rankChange } = stats;

  const getEncouragementMessage = () => {
    if (lessonsCompleted >= 7) return '🌟 Amazing week! You\'re on fire!';
    if (lessonsCompleted >= 3) return '💪 Great progress! Keep it up!';
    if (lessonsCompleted >= 1) return '👍 Good start! Try to do a bit more next week.';
    return '🎯 Let\'s make next week your best week yet!';
  };

  const getRankChangeDisplay = () => {
    if (!rankChange) return null;
    if (rankChange > 0) {
      return (
        <span style={{ color: '#22c55e', marginLeft: '8px' }}>
          ↑ {rankChange}
        </span>
      );
    }
    return (
      <span style={{ color: '#ef4444', marginLeft: '8px' }}>
        ↓ {Math.abs(rankChange)}
      </span>
    );
  };

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Weekly CryptoCode Progress</title>
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
                      margin: '0 0 8px 0',
                      fontSize: '24px',
                      color: '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    📊 Your Weekly Summary
                  </h2>
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#a0a0a0',
                      marginBottom: '30px',
                    }}
                  >
                    Hey {displayName}, here's what you accomplished this week!
                  </p>

                  {/* Stats Grid */}
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={10}
                    style={{ marginBottom: '30px' }}
                  >
                    <tbody>
                      <tr>
                        <td
                          width="50%"
                          style={{
                            background: '#0f0f0f',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '36px',
                              fontWeight: 'bold',
                              color: '#f59e0b',
                            }}
                          >
                            {lessonsCompleted}
                          </div>
                          <div style={{ color: '#a0a0a0', fontSize: '14px' }}>
                            Lessons Completed
                          </div>
                        </td>
                        <td
                          width="50%"
                          style={{
                            background: '#0f0f0f',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '36px',
                              fontWeight: 'bold',
                              color: '#22c55e',
                            }}
                          >
                            +{pointsEarned}
                          </div>
                          <div style={{ color: '#a0a0a0', fontSize: '14px' }}>
                            Points Earned
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td
                          width="50%"
                          style={{
                            background: '#0f0f0f',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '36px',
                              fontWeight: 'bold',
                              color: '#ef4444',
                            }}
                          >
                            🔥 {currentStreak}
                          </div>
                          <div style={{ color: '#a0a0a0', fontSize: '14px' }}>
                            Day Streak
                          </div>
                        </td>
                        <td
                          width="50%"
                          style={{
                            background: '#0f0f0f',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '36px',
                              fontWeight: 'bold',
                              color: '#a855f7',
                            }}
                          >
                            {achievementsUnlocked}
                          </div>
                          <div style={{ color: '#a0a0a0', fontSize: '14px' }}>
                            Achievements
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Rank Display */}
                  {rank && (
                    <div
                      style={{
                        background: '#0f0f0f',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '30px',
                      }}
                    >
                      <span style={{ color: '#a0a0a0' }}>Leaderboard Rank:</span>
                      <span
                        style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#f59e0b',
                          marginLeft: '10px',
                        }}
                      >
                        #{rank}
                      </span>
                      {getRankChangeDisplay()}
                    </div>
                  )}

                  {/* Encouragement */}
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
                      borderRadius: '12px',
                      marginBottom: '24px',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: '#f59e0b',
                        fontSize: '16px',
                      }}
                    >
                      {getEncouragementMessage()}
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
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
                      }}
                    >
                      Continue Learning →
                    </a>
                  </div>
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

export default WeeklyDigestEmail;
