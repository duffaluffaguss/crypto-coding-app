// Challenge bonus points system

export interface BonusPoints {
  type: 'early_bird' | 'perfect_week' | 'streak_milestone';
  points: number;
  description: string;
}

// Bonus point values
export const BONUS_POINTS = {
  EARLY_BIRD: 10, // Completing within first hour of day
  PERFECT_WEEK: 50, // 7/7 challenges in a week
  STREAK_7: 25, // 7 day streak milestone
  STREAK_30: 100, // 30 day streak milestone
  STREAK_100: 500, // 100 day streak milestone
} as const;

// Check if completion qualifies for early bird bonus
export function isEarlyBirdCompletion(completedAt: Date, challengeDate: string): boolean {
  const challengeStart = new Date(challengeDate + 'T00:00:00');
  const oneHourAfter = new Date(challengeStart.getTime() + 60 * 60 * 1000);
  return completedAt <= oneHourAfter;
}

// Get streak milestone bonus if any
export function getStreakMilestoneBonus(streak: number): BonusPoints | null {
  if (streak === 100) {
    return {
      type: 'streak_milestone',
      points: BONUS_POINTS.STREAK_100,
      description: '100 day challenge streak milestone!',
    };
  }
  if (streak === 30) {
    return {
      type: 'streak_milestone',
      points: BONUS_POINTS.STREAK_30,
      description: '30 day challenge streak milestone!',
    };
  }
  if (streak === 7) {
    return {
      type: 'streak_milestone',
      points: BONUS_POINTS.STREAK_7,
      description: '7 day challenge streak milestone!',
    };
  }
  return null;
}

// Calculate all bonuses for a challenge completion
export function calculateBonuses(params: {
  completedAt: Date;
  challengeDate: string;
  newStreak: number;
  weekCompletions: number;
}): BonusPoints[] {
  const bonuses: BonusPoints[] = [];

  // Early bird bonus
  if (isEarlyBirdCompletion(params.completedAt, params.challengeDate)) {
    bonuses.push({
      type: 'early_bird',
      points: BONUS_POINTS.EARLY_BIRD,
      description: 'Completed within the first hour!',
    });
  }

  // Perfect week bonus (when 7th completion of the week)
  if (params.weekCompletions === 7) {
    bonuses.push({
      type: 'perfect_week',
      points: BONUS_POINTS.PERFECT_WEEK,
      description: 'Perfect week - 7/7 challenges!',
    });
  }

  // Streak milestone bonus
  const streakBonus = getStreakMilestoneBonus(params.newStreak);
  if (streakBonus) {
    bonuses.push(streakBonus);
  }

  return bonuses;
}

// Calculate total bonus points
export function getTotalBonusPoints(bonuses: BonusPoints[]): number {
  return bonuses.reduce((sum, b) => sum + b.points, 0);
}

// Get week boundaries (Monday to Sunday)
export function getWeekBoundaries(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Generate weekly progress data for display
export function generateWeeklyProgress(
  completedDates: string[],
  today: Date = new Date()
): { date: string; completed: boolean; isToday: boolean }[] {
  const { start } = getWeekBoundaries(today);
  const todayStr = today.toISOString().split('T')[0];
  const completedSet = new Set(completedDates);
  
  const progress = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    progress.push({
      date: dateStr,
      completed: completedSet.has(dateStr),
      isToday: dateStr === todayStr,
    });
  }
  
  return progress;
}

// Calculate challenge streak from completions
export function calculateChallengeStreak(
  completions: { challenge_date: string }[],
  challenges: { challenge_date: string }[]
): number {
  if (completions.length === 0 || challenges.length === 0) return 0;
  
  // Sort challenges by date descending
  const sortedChallenges = [...challenges].sort(
    (a, b) => new Date(b.challenge_date).getTime() - new Date(a.challenge_date).getTime()
  );
  
  // Create set of completed dates
  const completedDates = new Set(completions.map(c => c.challenge_date));
  
  // Count consecutive days from most recent
  let streak = 0;
  for (const challenge of sortedChallenges) {
    if (completedDates.has(challenge.challenge_date)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
