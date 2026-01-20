import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRepliesWithExpertData } from '@/lib/supabase/experts';
import { PostDetailClient } from './PostDetailClient';
import type { ProjectType } from '@/types';

interface PageProps {
  params: Promise<{
    slug: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug, postId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get community
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, project_type')
    .eq('slug', slug)
    .single();

  if (!community) notFound();

  // Get post with author profile
  const { data: post } = await supabase
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
      author_id,
      profiles:author_id(display_name, avatar_url)
    `)
    .eq('id', postId)
    .eq('community_id', community.id)
    .single();

  if (!post) notFound();

  // Get replies with expert data
  const projectType = community.project_type as ProjectType | null;
  const replies = await getRepliesWithExpertData(postId, projectType);

  // Check if current user is a member
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

  // Get topic label for expert badges
  const topicLabels: Record<string, string> = {
    nft_marketplace: 'NFT',
    token: 'Token',
    dao: 'DAO',
    game: 'Gaming',
    social: 'Social',
    creator: 'Creator',
  };
  const topicName = projectType ? topicLabels[projectType] : undefined;

  return (
    <PostDetailClient
      community={{
        id: community.id,
        name: community.name,
        slug: community.slug,
        projectType,
      }}
      post={{
        id: post.id,
        title: post.title,
        content: post.content,
        post_type: post.post_type as 'discussion' | 'question' | 'announcement' | 'showcase',
        upvotes: post.upvotes,
        replies_count: post.replies_count,
        is_pinned: post.is_pinned,
        is_answered: post.is_answered,
        created_at: post.created_at,
        author_id: post.author_id,
        profiles: post.profiles as { display_name: string | null; avatar_url: string | null } | null,
      }}
      initialReplies={replies}
      currentUserId={user?.id || null}
      isMember={isMember}
      topicName={topicName}
    />
  );
}
