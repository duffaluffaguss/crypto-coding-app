import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeaderboardContent } from './LeaderboardContent';

export const metadata = {
  title: 'Leaderboard | Zero to Crypto Dev',
  description: 'See the top learners in the Zero to Crypto Dev community',
};

// Define types for the leaderboard data
interface LeaderboardData {
  byPoints: LeaderboardEntry[];
  byStreak: LeaderboardEntry[];
  byLessons: LeaderboardEntry[];
  currentUserRanks: {
    points: number | null;
    streak: number | null;
    lessons: number | null;
  };
}

interface LeaderboardEntry {
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

async function getLeaderboardData(userId: string): Promise<LeaderboardData> {
  const supabase = await createClient();

  // Fetch top 50 by achievement points
  const { data: pointsData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, achievement_points')
    .order('achievement_points', { ascending: false })
    .limit(50);

  // Fetch top 50 by streak
  const { data: streakData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, current_streak')
    .order('current_streak', { ascending: false })
    .limit(50);

  // Fetch top 50 by lessons completed
  const { data: lessonsData } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, lessons_completed')
    .order('lessons_completed', { ascending: false })
    .limit(50);

  // Get current user's ranks (use RPC if available, otherwise calculate)
  let currentUserRanks = { points: null as number | null, streak: null as number | null, lessons: null as number | null };

  // Get user's current stats
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('achievement_points, current_streak, lessons_completed')
    .eq('id', userId)
    .single();

  if (userProfile) {
    // Count how many users are ahead
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

  // Check if we have real data, if not use placeholder
  const hasRealData = (pointsData && pointsData.length > 0) || 
                       (streakData && streakData.length > 0) || 
                       (lessonsData && lessonsData.length > 0);

  if (!hasRealData) {
    // Return placeholder data
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
    };
  }

  // Map real data
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
  };
}

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const leaderboardData = await getLeaderboardData(user.id);

  return (
    <LeaderboardContent
      data={leaderboardData}
      currentUserId={user.id}
    />
  );
}
