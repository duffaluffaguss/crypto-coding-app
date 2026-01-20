/**
 * Email sending utility for crypto-coding-app
 * Uses Resend API when RESEND_API_KEY is configured, otherwise logs to console
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Check if Resend is configured
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'CryptoCode <noreply@cryptocode.dev>';

/**
 * Send an email using Resend API or log to console as fallback
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text } = options;

  // If Resend API key is not configured, log and return success (dev mode)
  if (!RESEND_API_KEY) {
    console.log('📧 [Email Dev Mode] Would send email:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   HTML Length: ${html.length} chars`);
    if (text) console.log(`   Text Length: ${text.length} chars`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send a batch of emails (useful for weekly digests)
 */
export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(emails.map(sendEmail));
  
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++;
    } else {
      failed++;
      const error = result.status === 'rejected' 
        ? result.reason?.message 
        : result.value.error;
      errors.push(`Email ${index + 1}: ${error || 'Unknown error'}`);
    }
  });

  return { sent, failed, errors };
}

// ============================================================================
// Email Template Generators
// ============================================================================

/**
 * Generate Welcome email HTML
 */
export function generateWelcomeEmail(displayName: string): { subject: string; html: string; text: string } {
  const subject = '🎉 Welcome to CryptoCode!';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CryptoCode</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin: 0; color: #f59e0b;">⚡ CryptoCode</h1>
        </div>
        
        <!-- Main Content -->
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff;">
            Welcome aboard, ${displayName}! 🚀
          </h2>
          
          <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            You've just taken the first step into the world of Web3 development. 
            CryptoCode is your interactive learning platform to master smart contracts, 
            DeFi protocols, and blockchain technology.
          </p>
          
          <div style="background: #0f0f0f; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #f59e0b; font-size: 16px;">🎯 What's next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #a0a0a0; line-height: 1.8;">
              <li>Complete your first lesson to start your streak 🔥</li>
              <li>Earn achievements as you progress 🏆</li>
              <li>Build real smart contracts in our interactive editor 💻</li>
              <li>Climb the leaderboard and compete with others 📊</li>
            </ul>
          </div>
          
          <a href="https://cryptocode.dev/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Start Learning →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #666;">
          <p style="margin: 0 0 10px 0; font-size: 14px;">Happy coding! 🎉</p>
          <p style="margin: 0; font-size: 12px;">
            <a href="https://cryptocode.dev/settings" style="color: #f59e0b; text-decoration: none;">Manage email preferences</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Welcome to CryptoCode, ${displayName}! 🚀

You've just taken the first step into the world of Web3 development.

What's next?
- Complete your first lesson to start your streak 🔥
- Earn achievements as you progress 🏆
- Build real smart contracts in our interactive editor 💻
- Climb the leaderboard and compete with others 📊

Start learning: https://cryptocode.dev/dashboard

Happy coding! 🎉
`;

  return { subject, html, text };
}

/**
 * Generate Achievement notification email HTML
 */
export function generateAchievementEmail(
  displayName: string,
  achievementName: string,
  achievementIcon: string,
  points: number,
  description?: string
): { subject: string; html: string; text: string } {
  const subject = `🏆 Achievement Unlocked: ${achievementName}!`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin: 0; color: #f59e0b;">⚡ CryptoCode</h1>
        </div>
        
        <!-- Achievement Card -->
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #f59e0b; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">${achievementIcon}</div>
          
          <h2 style="margin: 0 0 8px 0; font-size: 28px; color: #f59e0b;">
            Achievement Unlocked!
          </h2>
          
          <h3 style="margin: 0 0 16px 0; font-size: 22px; color: #ffffff;">
            ${achievementName}
          </h3>
          
          ${description ? `<p style="color: #a0a0a0; font-size: 16px; margin-bottom: 24px;">${description}</p>` : ''}
          
          <div style="background: #0f0f0f; border-radius: 12px; padding: 16px; display: inline-block;">
            <span style="color: #f59e0b; font-size: 24px; font-weight: bold;">+${points}</span>
            <span style="color: #a0a0a0; font-size: 16px; margin-left: 8px;">points earned</span>
          </div>
        </div>
        
        <!-- CTA -->
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #a0a0a0; margin-bottom: 20px;">Keep up the great work, ${displayName}!</p>
          <a href="https://cryptocode.dev/profile" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
            View All Achievements →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
          <a href="https://cryptocode.dev/settings" style="color: #f59e0b; text-decoration: none;">Manage email preferences</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
🏆 Achievement Unlocked: ${achievementName}!

${achievementIcon} ${achievementName}
${description || ''}

+${points} points earned

Keep up the great work, ${displayName}!

View achievements: https://cryptocode.dev/profile
`;

  return { subject, html, text };
}

/**
 * Generate Streak Reminder email HTML
 */
export function generateStreakReminderEmail(
  displayName: string,
  currentStreak: number,
  hoursRemaining: number
): { subject: string; html: string; text: string } {
  const subject = `🔥 Don't lose your ${currentStreak}-day streak!`;
  
  const urgencyText = hoursRemaining <= 2 
    ? '⚠️ URGENT: Less than 2 hours remaining!' 
    : hoursRemaining <= 6 
    ? '⏰ Only a few hours left!' 
    : `⏳ About ${Math.floor(hoursRemaining)} hours remaining`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin: 0; color: #f59e0b;">⚡ CryptoCode</h1>
        </div>
        
        <!-- Streak Warning -->
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d1810 100%); border-radius: 16px; padding: 40px; border: 1px solid #ef4444; text-align: center;">
          <div style="font-size: 64px; margin-bottom: 20px;">🔥</div>
          
          <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #ef4444;">
            Your streak is at risk!
          </h2>
          
          <div style="background: #0f0f0f; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <div style="font-size: 48px; font-weight: bold; color: #f59e0b;">${currentStreak}</div>
            <div style="color: #a0a0a0; font-size: 16px;">day streak</div>
          </div>
          
          <p style="color: ${hoursRemaining <= 2 ? '#ef4444' : '#fbbf24'}; font-size: 18px; font-weight: 600; margin-bottom: 24px;">
            ${urgencyText}
          </p>
          
          <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 24px;">
            Complete just one lesson to keep your streak alive, ${displayName}!
          </p>
          
          <a href="https://cryptocode.dev/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
            Save My Streak! 🔥
          </a>
        </div>
        
        <!-- Motivation -->
        <div style="text-align: center; margin-top: 30px; color: #a0a0a0;">
          <p style="margin: 0; font-size: 14px;">
            ${currentStreak >= 7 ? "You've worked so hard to build this streak. Don't let it slip away!" : "Every day of learning brings you closer to mastery!"}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
          <a href="https://cryptocode.dev/settings" style="color: #f59e0b; text-decoration: none;">Manage email preferences</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
🔥 Don't lose your ${currentStreak}-day streak!

${urgencyText}

Complete just one lesson to keep your streak alive, ${displayName}!

Save your streak: https://cryptocode.dev/dashboard
`;

  return { subject, html, text };
}

/**
 * Generate Weekly Digest email HTML
 */
export function generateWeeklyDigestEmail(
  displayName: string,
  stats: {
    lessonsCompleted: number;
    pointsEarned: number;
    currentStreak: number;
    achievementsUnlocked: number;
    rank?: number;
    rankChange?: number;
  }
): { subject: string; html: string; text: string } {
  const subject = `📊 Your Weekly CryptoCode Progress`;
  
  const { lessonsCompleted, pointsEarned, currentStreak, achievementsUnlocked, rank, rankChange } = stats;
  
  const rankChangeText = rankChange 
    ? rankChange > 0 
      ? `<span style="color: #22c55e;">↑ ${rankChange}</span>` 
      : `<span style="color: #ef4444;">↓ ${Math.abs(rankChange)}</span>`
    : '';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 32px; margin: 0; color: #f59e0b;">⚡ CryptoCode</h1>
        </div>
        
        <!-- Main Content -->
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
          <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #ffffff; text-align: center;">
            📊 Your Weekly Summary
          </h2>
          <p style="text-align: center; color: #a0a0a0; margin-bottom: 30px;">
            Hey ${displayName}, here's what you accomplished this week!
          </p>
          
          <!-- Stats Grid -->
          <table width="100%" cellpadding="0" cellspacing="10" style="margin-bottom: 30px;">
            <tr>
              <td width="50%" style="background: #0f0f0f; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">${lessonsCompleted}</div>
                <div style="color: #a0a0a0; font-size: 14px;">Lessons Completed</div>
              </td>
              <td width="50%" style="background: #0f0f0f; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #22c55e;">+${pointsEarned}</div>
                <div style="color: #a0a0a0; font-size: 14px;">Points Earned</div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="background: #0f0f0f; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #ef4444;">🔥 ${currentStreak}</div>
                <div style="color: #a0a0a0; font-size: 14px;">Day Streak</div>
              </td>
              <td width="50%" style="background: #0f0f0f; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #a855f7;">${achievementsUnlocked}</div>
                <div style="color: #a0a0a0; font-size: 14px;">Achievements</div>
              </td>
            </tr>
          </table>
          
          ${rank ? `
          <div style="background: #0f0f0f; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <span style="color: #a0a0a0;">Leaderboard Rank:</span>
            <span style="font-size: 24px; font-weight: bold; color: #f59e0b; margin-left: 10px;">#${rank}</span>
            ${rankChangeText}
          </div>
          ` : ''}
          
          <!-- Encouragement -->
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f59e0b20 0%, #d9770620 100%); border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 0; color: #f59e0b; font-size: 16px;">
              ${lessonsCompleted >= 7 ? "🌟 Amazing week! You're on fire!" : 
                lessonsCompleted >= 3 ? "💪 Great progress! Keep it up!" : 
                lessonsCompleted >= 1 ? "👍 Good start! Try to do a bit more next week." :
                "🎯 Let's make next week your best week yet!"}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://cryptocode.dev/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
              Continue Learning →
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
          <a href="https://cryptocode.dev/settings" style="color: #f59e0b; text-decoration: none;">Manage email preferences</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
📊 Your Weekly CryptoCode Progress

Hey ${displayName}, here's what you accomplished this week!

📚 Lessons Completed: ${lessonsCompleted}
⭐ Points Earned: +${pointsEarned}
🔥 Current Streak: ${currentStreak} days
🏆 Achievements: ${achievementsUnlocked}
${rank ? `📊 Leaderboard Rank: #${rank}${rankChange ? ` (${rankChange > 0 ? '↑' : '↓'}${Math.abs(rankChange)})` : ''}` : ''}

Continue learning: https://cryptocode.dev/dashboard
`;

  return { subject, html, text };
}
