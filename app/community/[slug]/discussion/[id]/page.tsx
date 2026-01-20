import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DiscussionPageClient } from './DiscussionPageClient';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const supabase = await createClient();
  
  const { data: discussion } = await supabase
    .from('discussions')
    .select(`
      title,
      communities!inner(name)
    `)
    .eq('id', id)
    .single();

  if (!discussion) {
    return { title: 'Discussion Not Found' };
  }

  return {
    title: `${discussion.title} | ${discussion.communities.name} | Zero to Crypto Dev`,
    description: `Join the discussion: ${discussion.title}`,
  };
}

export default async function DiscussionPage({ params }: Props) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch discussion with author and community info
  const { data: discussion } = await supabase
    .from('discussions')
    .select(`
      *,
      profiles:author_id!inner (
        display_name
      ),
      communities!inner (
        id,
        name,
        slug,
        icon
      ),
      lessons (
        id,
        title,
        order
      )
    `)
    .eq('id', id)
    .eq('communities.slug', slug)
    .single();

  if (!discussion) {
    notFound();
  }

  // Fetch replies with author profiles
  const { data: replies } = await supabase
    .from('discussion_replies')
    .select(`
      *,
      profiles:author_id!inner (
        display_name
      )
    `)
    .eq('discussion_id', id)
    .order('is_accepted_answer', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true });

  // Check if user is a member of the community
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', discussion.communities.id)
      .eq('user_id', user.id)
      .single();
    isMember = !!membership;
  }

  // Check if user is the question author
  const isAuthor = user?.id === discussion.author_id;

  return (
    <DiscussionPageClient
      discussion={discussion}
      replies={replies || []}
      user={user}
      isMember={isMember}
      isAuthor={isAuthor}
    />
  );
}