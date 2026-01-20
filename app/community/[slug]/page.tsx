import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CommunityPageClient } from './CommunityPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: community } = await supabase
    .from('communities')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!community) {
    return { title: 'Community Not Found' };
  }

  return {
    title: `${community.name} | Communities | Zero to Crypto Dev`,
    description: community.description || `Join the ${community.name} community`,
  };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!community) {
    notFound();
  }

  // Fetch posts with author profiles
  const { data: posts } = await supabase
    .from('community_posts')
    .select(`
      id,
      title,
      content,
      post_type,
      upvotes,
      replies_count,
      is_pinned,
      is_answered,
      created_at,
      profiles:author_id (
        display_name
      )
    `)
    .eq('community_id', community.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch members with profiles
  const { data: members } = await supabase
    .from('community_members')
    .select(`
      user_id,
      role,
      joined_at,
      profiles:user_id (
        display_name,
        avatar_url
      )
    `)
    .eq('community_id', community.id)
    .order('joined_at', { ascending: true })
    .limit(20);

  // Fetch discussions with author profiles and reply counts
  const { data: discussions } = await supabase
    .from('discussions')
    .select(`
      *,
      profiles:author_id!inner (
        display_name
      ),
      lessons (
        id,
        title,
        order
      )
    `)
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Add reply counts to discussions
  const discussionsWithCounts = await Promise.all(
    (discussions || []).map(async (discussion) => {
      const { count } = await supabase
        .from('discussion_replies')
        .select('id', { count: 'exact' })
        .eq('discussion_id', discussion.id);
      
      return {
        ...discussion,
        reply_count: count || 0
      };
    })
  );

  // Check if user is a member
  let isMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .single();
    isMember = !!membership;
  }

  return (
    <CommunityPageClient
      community={community}
      posts={posts || []}
      discussions={discussionsWithCounts}
      members={members || []}
      isMember={isMember}
      isAuthenticated={!!user}
      postCount={posts?.length || 0}
    />
  );
}
