// Leaderboard utilities and types

export type TimePeriod = 'all' | 'week' | 'month';

export type LeagueRank = 'diamond' | 'gold' | 'silver' | 'bronze';

export interface LeagueInfo {
  rank: LeagueRank;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  minPoints: number;
  maxPoints?: number;
}

export const LEAGUES: Record<LeagueRank, LeagueInfo> = {
  diamond: {
    rank: 'diamond',
    label: 'Diamond',
    icon: '💎',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    minPoints: 1001,
  },
  gold: {
    rank: 'gold',
    label: 'Gold',
    icon: '🥇',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    minPoints: 501,
    maxPoints: 1000,
  },
  silver: {
    rank: 'silver',
    label: 'Silver',
    icon: '🥈',
    color: 'text-gray-300',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/30',
    minPoints: 101,
    maxPoints: 500,
  },
  bronze: {
    rank: 'bronze',
    label: 'Bronze',
    icon: '🥉',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    minPoints: 0,
    maxPoints: 100,
  },
};

export function getLeagueFromPoints(points: number | null): LeagueInfo {
  if (points === null || points <= 100) return LEAGUES.bronze;
  if (points >= 1001) return LEAGUES.diamond;
  if (points >= 501) return LEAGUES.gold;
  if (points >= 101) return LEAGUES.silver;
  return LEAGUES.bronze;
}

// Keep the old function for backwards compatibility where rank is still needed
export function getLeagueFromRank(rank: number | null): LeagueInfo {
  if (rank === null) return LEAGUES.bronze;
  if (rank <= 10) return LEAGUES.diamond;
  if (rank <= 50) return LEAGUES.gold;
  if (rank <= 100) return LEAGUES.silver;
  return LEAGUES.bronze;
}

export function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday is start of week
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export function getDateRangeForPeriod(period: TimePeriod): { start: Date | null; end: Date } {
  const end = new Date();
  
  switch (period) {
    case 'week':
      return { start: getStartOfWeek(), end };
    case 'month':
      return { start: getStartOfMonth(), end };
    case 'all':
    default:
      return { start: null, end };
  }
}

export interface RisingStarUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  currentPoints: number;
  previousPoints: number;
  improvement: number;
  improvementPercent: number;
}
