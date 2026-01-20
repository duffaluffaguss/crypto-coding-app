import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeaderboardContent } from './LeaderboardContent';
import { type TimePeriod, getDateRangeForPeriod, type RisingStarUser } from '@/lib/leaderboard';

export const metadata = {
  title: 'Leaderboard | Zero to Crypto Dev',
  description: 'See the top learners in the Zero to Crypto Dev community',
};

// Define types for the leaderboard data
export interface LeaderboardData {
  byPoints: LeaderboardEntry[];
  byStreak: LeaderboardEntry[];
  byLessons: LeaderboardEntry[];
  currentUserRanks: {
    points: number | null;
    streak: number | null;
    lessons: number | null;
  };
  risingStars: RisingStarUser[];
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  value: number;
  rank: number;
}

// Placeholder data for when no real users exist
const placeholderUsers = [
  { id: 'placeholder-1', display_name: 'SolidityMaster', points: 2500, streak: 45, lessons: 28 },
  { id: 'placeholder-2', display_name: 'Web3Builder', points: 2100, streak: 32, lessons: 25 },
  { id: 'placeholder-3', display_name: 'CryptoLearner', points: 1850, streak: 28, lessons: 22 },
  { id: 'placeholder-4', display_name: 'DeFiDev', points: 1600, streak: 21, lessons: 19 },
  { id: 'placeholder-5', display_name: 'SmartContractor', points: 1400, streak: 18, lessons: 17 },
  { id: 'placeholder-6', display_name: 'BlockchainBob', points: 1200, streak: 15, lessons: 15 },
  { id: 'placeholder-7', display_name: 'TokenTrainer', points: 1000, streak: 12, lessons: 13 },
  { id: 'placeholder-8', display_name: 'EthereumEnthusiast', points: 850, streak: 10, lessons: 11 },
  { id: 'placeholder-9', display_name: 'NFTNinja', points: 700, streak: 8, lessons: 9 },
  { id: 'placeholder-10', display_name: 'GasSaver', points: 550, streak: 6, lessons: 7 },
];

async function getLeaderboardData(
  userId: string,
  period: TimePeriod = 'all'
): Promise<LeaderboardData> {
  const supabase = await createClient();
  const { start: startDate } = getDateRangeForPeriod(period);

  // For time-filtered data, we need different approaches
  if (period !== 'all' && startDate) {
    return getFilteredLeaderboardData(supabase, userId, startDate);
  }

  // All-time leaderboard (existing logic)
  const { data: pointsData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, achievement_points')
    .order('achievement_points', { ascending: false })
    .limit(50);

  const { data: streakData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, current_streak')
    .order('current_streak', { ascending: false })
    .limit(50);

  const { data: lessonsData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, lessons_completed')
    .order('lessons_completed', { ascending: false })
    .limit(50);

  // Get current user's ranks
  let currentUserRanks = { points: null as number | null, streak: null as number | null, lessons: null as number | null };

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('achievement_points, current_streak, lessons_completed')
    .eq('id', userId)
    .single();

  if (userProfile) {
    const { count: pointsRank } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('achievement_points', userProfile.achievement_points || 0);

    const { count: streakRank } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('current_streak', userProfile.current_streak || 0);

    const { count: lessonsRank } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('lessons_completed', userProfile.lessons_completed || 0);

    currentUserRanks = {
      points: (pointsRank ?? 0) + 1,
      streak: (streakRank ?? 0) + 1,
      lessons: (lessonsRank ?? 0) + 1,
    };
  }

  // Get rising stars (users with biggest improvement in the last week)
  const risingStars = await getRisingStars(supabase);

  // Check if we have real data
  const hasRealData = (pointsData && pointsData.length > 0) || 
                       (streakData && streakData.length > 0) || 
                       (lessonsData && lessonsData.length > 0);

  if (!hasRealData) {
    return {
      byPoints: placeholderUsers
        .sort((a, b) => b.points - a.points)
        .map((u, i) => ({ id: u.id, display_name: u.display_name, avatar_url: null, value: u.points, rank: i + 1 })),
      byStreak: placeholderUsers
        .sort((a, b) => b.streak - a.streak)
        .map((u, i) => ({ id: u.id, display_name: u.display_name, avatar_url: null, value: u.streak, rank: i + 1 })),
      byLessons: placeholderUsers
        .sort((a, b) => b.lessons - a.lessons)
        .map((u, i) => ({ id: u.id, display_name: u.display_name, avatar_url: null, value: u.lessons, rank: i + 1 })),
      currentUserRanks,
      risingStars: [],
    };
  }

  const byPoints: LeaderboardEntry[] = (pointsData || []).map((user, index) => ({
    id: user.id,
    display_name: user.display_name || 'Anonymous',
    avatar_url: user.avatar_url,
    value: user.achievement_points || 0,
    rank: index + 1,
  }));

  const byStreak: LeaderboardEntry[] = (streakData || []).map((user, index) => ({
    id: user.id,
    display_name: user.display_name || 'Anonymous',
    avatar_url: user.avatar_url,
    value: user.current_streak || 0,
    rank: index + 1,
  }));

  const byLessons: LeaderboardEntry[] = (lessonsData || []).map((user, index) => ({
    id: user.id,
    display_name: user.display_name || 'Anonymous',
    avatar_url: user.avatar_url,
    value: user.lessons_completed || 0,
    rank: index + 1,
  }));

  return {
    byPoints,
    byStreak,
    byLessons,
    currentUserRanks,
    risingStars,
  };
}

async function getFilteredLeaderboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  startDate: Date
): Promise<LeaderboardData> {
  const startISOString = startDate.toISOString();

  // Get points earned in period (from user_achievements joined with achievements)
  const { data: periodAchievements } = await supabase
    .from('user_achievements')
    .select(`
      user_id,
      achievements (points)
    `)
    .gte('earned_at', startISOString);

  // Aggregate points by user
  const pointsByUser = new Map<string, number>();
  periodAchievements?.forEach((ua: any) => {
    const current = pointsByUser.get(ua.user_id) || 0;
    pointsByUser.set(ua.user_id, current + (ua.achievements?.points || 0));
  });

  // Get user profiles for those with achievements
  const userIds = Array.from(pointsByUser.keys());
  let profilesMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);
    
    profiles?.forEach((p) => {
      profilesMap.set(p.id, { display_name: p.display_name || 'Anonymous', avatar_url: p.avatar_url });
    });
  }

  // Build points leaderboard
  const byPoints: LeaderboardEntry[] = Array.from(pointsByUser.entries())
    .map(([id, value]) => ({
      id,
      display_name: profilesMap.get(id)?.display_name || 'Anonymous',
      avatar_url: profilesMap.get(id)?.avatar_url || null,
      value,
      rank: 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Get lessons completed in period
  const { data: periodLessons } = await supabase
    .from('learning_progress')
    .select('user_id')
    .eq('status', 'completed')
    .gte('completed_at', startISOString);

  // Aggregate lessons by user
  const lessonsByUser = new Map<string, number>();
  periodLessons?.forEach((lp) => {
    const current = lessonsByUser.get(lp.user_id) || 0;
    lessonsByUser.set(lp.user_id, current + 1);
  });

  // Get profiles for lesson users
  const lessonUserIds = Array.from(lessonsByUser.keys());
  if (lessonUserIds.length > 0) {
    const { data: lessonProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', lessonUserIds);
    
    lessonProfiles?.forEach((p) => {
      if (!profilesMap.has(p.id)) {
        profilesMap.set(p.id, { display_name: p.display_name || 'Anonymous', avatar_url: p.avatar_url });
      }
    });
  }

  const byLessons: LeaderboardEntry[] = Array.from(lessonsByUser.entries())
    .map(([id, value]) => ({
      id,
      display_name: profilesMap.get(id)?.display_name || 'Anonymous',
      avatar_url: profilesMap.get(id)?.avatar_url || null,
      value,
      rank: 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // For streak in period, we'll show days active this period
  // Count distinct days with lesson completions in the period
  const daysActiveByUser = new Map<string, Set<string>>();
  
  const { data: periodActivity } = await supabase
    .from('learning_progress')
    .select('user_id, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', startISOString);

  periodActivity?.forEach((activity) => {
    if (!activity.completed_at) return;
    const dateStr = new Date(activity.completed_at).toISOString().split('T')[0];
    const userDays = daysActiveByUser.get(activity.user_id) || new Set();
    userDays.add(dateStr);
    daysActiveByUser.set(activity.user_id, userDays);
  });

  // Get profiles for streak users
  const streakUserIds = Array.from(daysActiveByUser.keys());
  if (streakUserIds.length > 0) {
    const { data: streakProfiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', streakUserIds);
    
    streakProfiles?.forEach((p) => {
      if (!profilesMap.has(p.id)) {
        profilesMap.set(p.id, { display_name: p.display_name || 'Anonymous', avatar_url: p.avatar_url });
      }
    });
  }

  const byStreak: LeaderboardEntry[] = Array.from(daysActiveByUser.entries())
    .map(([id, days]) => ({
      id,
      display_name: profilesMap.get(id)?.display_name || 'Anonymous',
      avatar_url: profilesMap.get(id)?.avatar_url || null,
      value: days.size,
      rank: 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Calculate current user ranks for the period
  const userPointsRank = byPoints.findIndex((e) => e.id === userId) + 1 || null;
  const userLessonsRank = byLessons.findIndex((e) => e.id === userId) + 1 || null;
  const userStreakRank = byStreak.findIndex((e) => e.id === userId) + 1 || null;

  const risingStars = await getRisingStars(supabase);

  return {
    byPoints,
    byStreak,
    byLessons,
    currentUserRanks: {
      points: userPointsRank || (pointsByUser.has(userId) ? byPoints.length + 1 : null),
      streak: userStreakRank || (daysActiveByUser.has(userId) ? byStreak.length + 1 : null),
      lessons: userLessonsRank || (lessonsByUser.has(userId) ? byLessons.length + 1 : null),
    },
    risingStars,
  };
}

async function getRisingStars(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<RisingStarUser[]> {
  // Get achievements earned in the last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // Current week achievements
  const { data: currentWeekData } = await supabase
    .from('user_achievements')
    .select(`
      user_id,
      achievements (points)
    `)
    .gte('earned_at', oneWeekAgo.toISOString());

  // Previous week achievements
  const { data: previousWeekData } = await supabase
    .from('user_achievements')
    .select(`
      user_id,
      achievements (points)
    `)
    .gte('earned_at', twoWeeksAgo.toISOString())
    .lt('earned_at', oneWeekAgo.toISOString());

  // Aggregate points
  const currentWeekPoints = new Map<string, number>();
  currentWeekData?.forEach((ua: any) => {
    const current = currentWeekPoints.get(ua.user_id) || 0;
    currentWeekPoints.set(ua.user_id, current + (ua.achievements?.points || 0));
  });

  const previousWeekPoints = new Map<string, number>();
  previousWeekData?.forEach((ua: any) => {
    const current = previousWeekPoints.get(ua.user_id) || 0;
    previousWeekPoints.set(ua.user_id, current + (ua.achievements?.points || 0));
  });

  // Find users with biggest improvement
  const improvements: { id: string; current: number; previous: number; improvement: number }[] = [];
  
  currentWeekPoints.forEach((current, userId) => {
    const previous = previousWeekPoints.get(userId) || 0;
    const improvement = current - previous;
    if (improvement > 0) {
      improvements.push({ id: userId, current, previous, improvement });
    }
  });

  // Sort by improvement and take top 5
  improvements.sort((a, b) => b.improvement - a.improvement);
  const topImprovers = improvements.slice(0, 5);

  if (topImprovers.length === 0) return [];

  // Get user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', topImprovers.map((i) => i.id));

  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return topImprovers.map((i) => ({
    id: i.id,
    display_name: profilesMap.get(i.id)?.display_name || 'Anonymous',
    avatar_url: profilesMap.get(i.id)?.avatar_url || null,
    currentPoints: i.current,
    previousPoints: i.previous,
    improvement: i.improvement,
    improvementPercent: i.previous > 0 ? Math.round((i.improvement / i.previous) * 100) : 100,
  }));
}

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const period = (params.period as TimePeriod) || 'all';
  const validPeriods: TimePeriod[] = ['all', 'week', 'month'];
  const validatedPeriod = validPeriods.includes(period) ? period : 'all';

  const [allTimeData, weekData, monthData] = await Promise.all([
    getLeaderboardData(user.id, 'all'),
    getLeaderboardData(user.id, 'week'),
    getLeaderboardData(user.id, 'month'),
  ]);

  return (
    <LeaderboardContent
      allTimeData={allTimeData}
      weekData={weekData}
      monthData={monthData}
      currentUserId={user.id}
      initialPeriod={validatedPeriod}
    />
  );
}
