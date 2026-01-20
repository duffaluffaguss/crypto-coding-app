import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PathCard } from '@/components/paths/PathCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, TrendingUp, Award } from 'lucide-react';

export const metadata = {
  title: 'Learning Paths | Zero to Crypto Dev',
  description: 'Structured learning paths to master Web3 development step by step.',
};

interface LearningPath {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  lesson_count: number;
}

interface UserProgress {
  path_id: string;
  progress: number;
  started_at: string;
  completed_at?: string;
  current_lesson_id?: string;
}

async function getPathsAndProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get all learning paths with lesson counts
  const { data: paths, error: pathsError } = await supabase
    .from('learning_paths')
    .select(`
      id,
      name,
      slug,
      description,
      difficulty,
      estimated_hours,
      learning_path_items!inner(id)
    `)
    .eq('is_active', true)
    .order('order', { ascending: true });

  if (pathsError) {
    console.error('Error fetching learning paths:', pathsError);
    throw new Error('Failed to fetch learning paths');
  }

  // Transform data to include lesson count
  const pathsWithCounts: LearningPath[] = (paths || []).map(path => ({
    id: path.id,
    name: path.name,
    slug: path.slug,
    description: path.description,
    difficulty: path.difficulty,
    estimated_hours: path.estimated_hours,
    lesson_count: path.learning_path_items?.length || 0,
  }));

  // Get user's progress for all paths
  const { data: userProgress, error: progressError } = await supabase
    .from('user_learning_paths')
    .select('path_id, progress, started_at, completed_at, current_lesson_id')
    .eq('user_id', user.id);

  if (progressError) {
    console.error('Error fetching user progress:', progressError);
    // Don't throw here, just continue without progress data
  }

  // Create a map for easy lookup
  const progressMap = new Map<string, UserProgress>();
  (userProgress || []).forEach(progress => {
    progressMap.set(progress.path_id, progress);
  });

  return {
    paths: pathsWithCounts,
    progressMap,
    user,
  };
}

export default async function PathsPage() {
  const { paths, progressMap } = await getPathsAndProgress();

  // Categorize paths
  const enrolledPaths = paths.filter(path => progressMap.has(path.id));
  const availablePaths = paths.filter(path => !progressMap.has(path.id));
  const completedPaths = enrolledPaths.filter(path => 
    progressMap.get(path.id)?.completed_at
  );

  // Statistics
  const totalHours = paths.reduce((sum, path) => sum + path.estimated_hours, 0);
  const completedHours = completedPaths.reduce((sum, path) => sum + path.estimated_hours, 0);
  const inProgressCount = enrolledPaths.length - completedPaths.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Paths</h1>
        <p className="text-muted-foreground text-lg">
          Structured learning paths to master Web3 development step by step. 
          Follow curated lessons designed to take you from beginner to expert.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{paths.length}</div>
                <div className="text-xs text-muted-foreground">Learning Paths</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{completedPaths.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{completedHours}/{totalHours}</div>
                <div className="text-xs text-muted-foreground">Hours Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      {enrolledPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledPaths
              .filter(path => !progressMap.get(path.id)?.completed_at)
              .map(path => (
                <PathCard
                  key={path.id}
                  path={path}
                  userProgress={progressMap.get(path.id)}
                />
              ))
            }
          </div>
        </div>
      )}

      {/* Completed Section */}
      {completedPaths.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Completed Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPaths.map(path => (
              <PathCard
                key={path.id}
                path={path}
                userProgress={progressMap.get(path.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Paths Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {enrolledPaths.length > 0 ? 'Discover More Paths' : 'All Learning Paths'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePaths.map(path => (
            <PathCard
              key={path.id}
              path={path}
              userProgress={null}
            />
          ))}
        </div>
      </div>

      {paths.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Learning Paths Available</h3>
            <p className="text-muted-foreground">
              Learning paths are being prepared. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}