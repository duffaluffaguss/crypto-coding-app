/**
 * Discord Bot Integration
 * 
 * This module provides functions to send messages to a Discord channel
 * using the Discord.js library or webhooks.
 * 
 * Setup Instructions:
 * 1. Create a Discord application at https://discord.com/developers/applications
 * 2. Create a bot for your application
 * 3. Copy the bot token and add it to your .env.local as DISCORD_BOT_TOKEN
 * 4. Invite the bot to your server with message permissions
 * 5. Get the channel ID by enabling Developer Mode in Discord,
 *    right-clicking the channel, and selecting "Copy ID"
 * 6. Add the channel ID to your .env.local as DISCORD_CHANNEL_ID
 * 
 * Alternatively, you can use webhooks:
 * 1. In your Discord channel, go to Settings > Integrations > Webhooks
 * 2. Create a webhook and copy the URL
 * 3. Add it to your .env.local as DISCORD_WEBHOOK_URL
 */

// Types for Discord messages
export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  timestamp?: string;
  url?: string;
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

// Environment variables
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

/**
 * Send a message to Discord via webhook
 * This is the simplest approach - no bot required
 */
export async function sendDiscordWebhook(message: DiscordMessage): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('Discord webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Discord webhook error:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}

/**
 * Send a simple text message to Discord
 */
export async function sendDiscordMessage(content: string): Promise<boolean> {
  return sendDiscordWebhook({ content });
}

/**
 * Send an achievement notification to Discord
 */
export async function sendAchievementNotification(
  userName: string,
  achievementName: string,
  achievementIcon: string,
  points: number,
  description?: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: `🏆 Achievement Unlocked!`,
    description: `**${userName}** earned a new achievement!`,
    color: 0xFFD700, // Gold color
    fields: [
      {
        name: `${achievementIcon} ${achievementName}`,
        value: description || 'Great job!',
        inline: false,
      },
      {
        name: '💰 Points Earned',
        value: `+${points}`,
        inline: true,
      },
    ],
    footer: {
      text: 'Zero to Crypto Dev',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: 'CryptoDev Bot',
  });
}

/**
 * Send a daily challenge reminder to Discord
 */
export async function sendDailyChallengeReminder(
  challengeTitle: string,
  difficulty: string,
  points: number,
  expiresIn: string
): Promise<boolean> {
  const difficultyColors: Record<string, number> = {
    easy: 0x22C55E,    // Green
    medium: 0xF59E0B,  // Yellow
    hard: 0xEF4444,    // Red
  };

  const embed: DiscordEmbed = {
    title: '🎯 Daily Challenge Available!',
    description: `A new challenge is waiting for you!`,
    color: difficultyColors[difficulty] || 0x8B5CF6,
    fields: [
      {
        name: '📝 Challenge',
        value: challengeTitle,
        inline: false,
      },
      {
        name: '⚡ Difficulty',
        value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        inline: true,
      },
      {
        name: '💰 Reward',
        value: `${points} XP`,
        inline: true,
      },
      {
        name: '⏰ Expires',
        value: expiresIn,
        inline: true,
      },
    ],
    footer: {
      text: 'Complete the challenge at cryptocode.dev',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: 'CryptoDev Bot',
  });
}

/**
 * Send a leaderboard update to Discord
 */
export async function sendLeaderboardUpdate(
  topUsers: Array<{
    rank: number;
    name: string;
    points: number;
  }>
): Promise<boolean> {
  const leaderboardText = topUsers
    .map((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${user.rank}.`;
      return `${medal} **${user.name}** - ${user.points} XP`;
    })
    .join('\n');

  const embed: DiscordEmbed = {
    title: '📊 Weekly Leaderboard Update',
    description: leaderboardText,
    color: 0x8B5CF6, // Purple
    footer: {
      text: 'Keep learning to climb the ranks!',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: 'CryptoDev Bot',
  });
}

/**
 * Send a new user welcome message to Discord
 */
export async function sendWelcomeNotification(userName: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '👋 New Builder Joined!',
    description: `Welcome **${userName}** to the Zero to Crypto Dev community!`,
    color: 0x22C55E, // Green
    footer: {
      text: 'Say hello in the chat!',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: 'CryptoDev Bot',
  });
}

/**
 * Send a project deployment notification to Discord
 */
export async function sendDeploymentNotification(
  userName: string,
  projectName: string,
  contractAddress: string,
  network: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '🚀 Contract Deployed!',
    description: `**${userName}** just deployed a smart contract!`,
    color: 0x3B82F6, // Blue
    fields: [
      {
        name: '📦 Project',
        value: projectName,
        inline: true,
      },
      {
        name: '🌐 Network',
        value: network,
        inline: true,
      },
      {
        name: '📍 Contract Address',
        value: `\`${contractAddress}\``,
        inline: false,
      },
    ],
    footer: {
      text: 'Zero to Crypto Dev',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhook({
    embeds: [embed],
    username: 'CryptoDev Bot',
  });
}
