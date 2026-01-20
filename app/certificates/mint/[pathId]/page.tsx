import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';
import { MintCertificateClient } from './MintCertificateClient';

interface MintPageProps {
  params: {
    pathId: string;
  };
}

async function getPathData(pathId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get learning path details
  const { data: pathData, error: pathError } = await supabase
    .from('learning_paths')
    .select(`
      id,
      name,
      slug,
      description,
      difficulty,
      estimated_hours,
      learning_path_items(
        lesson_id,
        is_required
      )
    `)
    .eq('id', pathId)
    .eq('is_active', true)
    .single();

  if (pathError || !pathData) {
    // Try finding by slug
    const { data: pathBySlug, error: slugError } = await supabase
      .from('learning_paths')
      .select(`
        id,
        name,
        slug,
        description,
        difficulty,
        estimated_hours,
        learning_path_items(
          lesson_id,
          is_required
        )
      `)
      .eq('slug', pathId)
      .eq('is_active', true)
      .single();

    if (slugError || !pathBySlug) {
      notFound();
    }

    return getPathDataInternal(pathBySlug, user);
  }

  return getPathDataInternal(pathData, user);
}

async function getPathDataInternal(pathData: any, user: any) {
  const supabase = await createClient();
  
  // Get user progress for this path
  const { data: userPath } = await supabase
    .from('user_learning_paths')
    .select('progress, started_at, completed_at')
    .eq('user_id', user.id)
    .eq('path_id', pathData.id)
    .single();

  // Get completed lessons for this user
  const { data: completedLessons } = await supabase
    .from('learning_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const completedLessonIds = new Set(completedLessons?.map(l => l.lesson_id) || []);
  
  // Check if all required lessons are completed
  const requiredLessonIds = pathData.learning_path_items
    ?.filter((item: any) => item.is_required)
    .map((item: any) => item.lesson_id) || [];
  
  const completedRequired = requiredLessonIds.filter((id: string) => completedLessonIds.has(id)).length;
  const isEligible = completedRequired === requiredLessonIds.length && requiredLessonIds.length > 0;

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url')
    .eq('id', user.id)
    .single();

  return {
    path: {
      id: pathData.id,
      name: pathData.name,
      slug: pathData.slug,
      description: pathData.description,
      difficulty: pathData.difficulty as 'beginner' | 'intermediate' | 'advanced',
      estimatedHours: pathData.estimated_hours,
      totalLessons: pathData.learning_path_items?.length || 0,
      requiredLessons: requiredLessonIds.length,
    },
    user: {
      id: user.id,
      name: profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Anonymous',
      email: user.email,
    },
    progress: {
      isEnrolled: !!userPath,
      isCompleted: !!userPath?.completed_at,
      completedAt: userPath?.completed_at,
      completedLessons: completedLessonIds.size,
      completedRequired,
      isEligible,
    },
  };
}

export async function generateMetadata({ params }: MintPageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data: path } = await supabase
    .from('learning_paths')
    .select('name')
    .or(`id.eq.${params.pathId},slug.eq.${params.pathId}`)
    .single();

  return {
    title: `Mint Certificate - ${path?.name || 'Learning Path'} | Zero to Crypto Dev`,
    description: 'Mint your completion certificate as an NFT on Base.',
  };
}

export default async function MintCertificatePage({ params }: MintPageProps) {
  const data = await getPathData(params.pathId);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <MintCertificateClient 
        path={data.path}
        user={data.user}
        progress={data.progress}
      />
    </div>
  );
}
