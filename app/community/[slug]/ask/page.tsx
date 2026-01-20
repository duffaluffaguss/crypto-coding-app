import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AskQuestionClient } from './AskQuestionClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: community } = await supabase
    .from('communities')
    .select('name')
    .eq('slug', slug)
    .single();

  if (!community) {
    return { title: 'Community Not Found' };
  }

  return {
    title: `Ask a Question | ${community.name} | Zero to Crypto Dev`,
    description: `Ask the ${community.name} community for help with your coding questions`,
  };
}

export default async function AskQuestionPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!community) {
    notFound();
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect(`/community/${slug}`);
  }

  // Fetch lessons for tagging (if community has project_type)
  let lessons = [];
  if (community.project_type) {
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, order')
      .eq('project_type', community.project_type)
      .order('order');
    lessons = lessonsData || [];
  }

  return (
    <AskQuestionClient
      community={community}
      lessons={lessons}
      user={user}
    />
  );
}