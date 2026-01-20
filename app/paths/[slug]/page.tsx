import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  BookOpen, 
  Trophy, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  Circle,
  Lock,
  Star,
  Award,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface PathPageProps {
  params: {
    slug: string;
  };
}

interface LearningPathDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  lessons: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    is_required: boolean;
    project_type: string;
    concepts: string[];
  }>;
}

interface UserProgress {
  progress: number;
  started_at: string;
  completed_at?: string;
  current_lesson_id?: string;
  completedLessons: Set<string>;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-700 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-700 border-red-500/20',
} as const;

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',  
  advanced: 'Advanced',
} as const;

async function getPathDetails(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get learning path details with lessons
  const { data: pathData, error: pathError } = await supabase
    .from('learning_paths')
    .select(`
      id,
      name,
      slug,
      description,
      difficulty,
      estimated_hours,
      learning_path_items!inner(
        lesson_id,
        "order",
        is_required,
        lessons!inner(
          id,
          title,
          description,
          project_type,
          concepts
        )
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (pathError || !pathData) {
    notFound();
  }

  // Transform the data
  const path: LearningPathDetails = {
    id: pathData.id,
    name: pathData.name,
    slug: pathData.slug,
    description: pathData.description,
    difficulty: pathData.difficulty,
    estimated_hours: pathData.estimated_hours,
    lessons: pathData.learning_path_items
      .map(item => ({
        id: item.lessons.id,
        title: item.lessons.title,
        description: item.lessons.description,
        order: item.order,
        is_required: item.is_required,
        project_type: item.lessons.project_type,
        concepts: item.lessons.concepts,
      }))
      .sort((a, b) => a.order - b.order),
  };

  // Get user progress for this path
  const { data: userPath } = await supabase
    .from('user_learning_paths')
    .select('progress, started_at, completed_at, current_lesson_id')
    .eq('user_id', user.id)
    .eq('path_id', path.id)
    .single();

  // Get completed lessons for this user (across all projects)
  const { data: completedLessons } = await supabase
    .from('learning_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const userProgress: UserProgress | null = userPath ? {
    progress: userPath.progress,
    started_at: userPath.started_at,
    completed_at: userPath.completed_at,
    current_lesson_id: userPath.current_lesson_id,
    completedLessons: new Set(completedLessons?.map(l => l.lesson_id) || []),
  } : null;

  return {
    path,
    userProgress,
    user,
  };
}

async function enrollInPath(pathId: string) {
  'use server';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  await supabase
    .from('user_learning_paths')
    .insert({
      user_id: user.id,
      path_id: pathId,
      progress: 0,
    });
  
  redirect(`/paths/${await getPathSlug(pathId)}`);
}

async function getPathSlug(pathId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('learning_paths')
    .select('slug')
    .eq('id', pathId)
    .single();
  
  return data?.slug || '';
}

export async function generateMetadata({ params }: PathPageProps) {
  const supabase = await createClient();
  const { data: path } = await supabase
    .from('learning_paths')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  return {
    title: `${path?.name || 'Learning Path'} | Zero to Crypto Dev`,
    description: path?.description || 'Learn Web3 development step by step.',
  };
}

export default async function PathDetailPage({ params }: PathPageProps) {
  const { path, userProgress } = await getPathDetails(params.slug);
  
  const isEnrolled = !!userProgress;
  const isCompleted = !!userProgress?.completed_at;
  const progress = userProgress?.progress ?? 0;
  const completedLessons = userProgress?.completedLessons || new Set();
  
  const totalLessons = path.lessons.length;
  const requiredLessons = path.lessons.filter(l => l.is_required).length;
  const completedRequiredLessons = path.lessons.filter(l => 
    l.is_required && completedLessons.has(l.id)
  ).length;

  // Find next lesson to take
  const nextLesson = path.lessons.find(lesson => 
    !completedLessons.has(lesson.id)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{path.name}</h1>
            <div className="flex items-center gap-4 mb-3">
              <Badge 
                variant="outline" 
                className={difficultyColors[path.difficulty]}
              >
                {difficultyLabels[path.difficulty]}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{path.estimated_hours} hours</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{totalLessons} lessons</span>
              </div>
            </div>
          </div>
          {isCompleted && (
            <div className="flex flex-col items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                <Award className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          )}
        </div>
        
        <p className="text-muted-foreground text-lg mb-6">
          {path.description}
        </p>

        {/* Progress Bar */}
        {isEnrolled && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Your Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {completedRequiredLessons} / {requiredLessons} lessons completed
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {progress}% complete
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {isCompleted ? (
            <>
              <Button 
                size="lg" 
                asChild
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
              >
                <Link href={`/certificates/mint/${path.id}`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mint NFT Certificate
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`/certificate?path=${path.slug}`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href={nextLesson ? `/projects/new?lesson=${nextLesson.id}` : '#'}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Review Lessons
                </Link>
              </Button>
            </>
          ) : isEnrolled ? (
            <Button size="lg" asChild disabled={!nextLesson}>
              <Link href={nextLesson ? `/projects/new?lesson=${nextLesson.id}` : '#'}>
                <Play className="h-4 w-4 mr-2" />
                {nextLesson ? 'Continue Learning' : 'All Lessons Completed'}
              </Link>
            </Button>
          ) : (
            <form action={() => enrollInPath(path.id)}>
              <Button size="lg" type="submit">
                <Play className="h-4 w-4 mr-2" />
                Start Learning Path
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Lessons List */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Lessons</h2>
        <div className="space-y-4">
          {path.lessons.map((lesson, index) => {
            const isCompleted = completedLessons.has(lesson.id);
            const isNext = nextLesson?.id === lesson.id;
            const isLocked = !isEnrolled && !isCompleted;

            return (
              <Card 
                key={lesson.id}
                className={`transition-all duration-200 ${
                  isNext ? 'ring-2 ring-primary' : ''
                } ${isLocked ? 'opacity-60' : 'hover:shadow-md'}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="shrink-0 mt-1">
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : isLocked ? (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-lg">
                          {index + 1}. {lesson.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!lesson.is_required && (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          )}
                          {isNext && (
                            <Badge variant="default" className="text-xs">
                              Next
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {lesson.description}
                      </p>

                      {/* Concepts */}
                      {lesson.concepts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {lesson.concepts.slice(0, 5).map((concept, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                          {lesson.concepts.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{lesson.concepts.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      {!isLocked && (
                        <Button 
                          variant={isCompleted ? "outline" : "default"}
                          size="sm"
                          asChild
                        >
                          <Link href={`/projects/new?lesson=${lesson.id}`}>
                            {isCompleted ? 'Review' : 'Start'} Lesson
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}