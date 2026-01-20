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
      members={members || []}
      isMember={isMember}
      isAuthenticated={!!user}
      postCount={posts?.length || 0}
    />
  );
}
