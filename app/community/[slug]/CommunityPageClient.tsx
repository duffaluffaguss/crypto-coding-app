'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { PostCard } from '@/components/community/PostCard';
import { CreatePostButton } from '@/components/community/CreatePostButton';
import { AskQuestionButton } from '@/components/community/AskQuestionButton';
import { DiscussionCard } from '@/components/community/DiscussionCard';
import { MembersSidebar } from '@/components/community/MembersSidebar';
import { ChatRoom, ChatFloatingButton } from '@/components/community/ChatRoom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, HelpCircle, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  member_count: number;
  project_type: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: 'discussion' | 'question' | 'announcement' | 'showcase';
  upvotes: number;
  replies_count: number;
  is_pinned: boolean;
  is_answered: boolean;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  lesson_id: string | null;
  is_question: boolean;
  is_answered: boolean;
  upvotes: number;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
  lessons?: {
    id: string;
    title: string;
    order: number;
  } | null;
  reply_count: number;
}

interface Member {
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommunityPageClientProps {
  community: Community;
  posts: Post[];
  discussions: Discussion[];
  members: Member[];
  isMember: boolean;
  isAuthenticated: boolean;
  postCount: number;
}

export function CommunityPageClient({
  community,
  posts,
  discussions,
  members,
  isMember: initialIsMember,
  isAuthenticated,
  postCount,
}: CommunityPageClientProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Get current user ID for chat
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    }
    if (isAuthenticated) {
      getUser();
    }
  }, [isAuthenticated, supabase.auth]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to join communities');
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      setIsMember(true);
      toast.success('Welcome to the community!');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsMember(false);
      toast.success('Left community');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave community');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPosts = (type: string | null) => {
    if (!type) return posts;
    return posts.filter((p) => p.post_type === type);
  };

  const pinnedPosts = posts.filter((p) => p.is_pinned);
  const regularPosts = posts.filter((p) => !p.is_pinned);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/community">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            All Communities
          </Button>
        </Link>
      </div>

      {/* Header */}
      <CommunityHeader
        community={community}
        postCount={postCount}
        isMember={isMember}
        onJoin={handleJoin}
        onLeave={handleLeave}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr,300px]">
          {/* Main Feed */}
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Discussions</h2>
              <div className="flex items-center gap-2">
                <AskQuestionButton
                  communitySlug={community.slug}
                  isMember={isMember}
                />
                <CreatePostButton
                  communityId={community.id}
                  communitySlug={community.slug}
                  isMember={isMember}
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="qa" className="gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Q&A ({discussions.length})
                </TabsTrigger>
                <TabsTrigger value="discussions" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Discussions
                </TabsTrigger>
                <TabsTrigger value="questions" className="gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Questions
                </TabsTrigger>
                <TabsTrigger value="showcase" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Showcase
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {discussions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Recent Q&A</h3>
                    {discussions.slice(0, 3).map((discussion) => (
                      <DiscussionCard key={discussion.id} discussion={discussion} communitySlug={community.slug} />
                    ))}
                  </div>
                )}
                {pinnedPosts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Pinned Posts</h3>
                    {pinnedPosts.map((post) => (
                      <PostCard key={post.id} post={post} communitySlug={community.slug} />
                    ))}
                  </div>
                )}
                {regularPosts.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Community Posts</h3>
                    {regularPosts.map((post) => (
                      <PostCard key={post.id} post={post} communitySlug={community.slug} />
                    ))}
                  </div>
                ) : pinnedPosts.length === 0 && discussions.length === 0 ? (
                  <EmptyState isMember={isMember} />
                ) : null}
              </TabsContent>

              <TabsContent value="qa" className="space-y-4 mt-4">
                {discussions.length > 0 ? (
                  <div className="space-y-3">
                    {discussions.map((discussion) => (
                      <DiscussionCard key={discussion.id} discussion={discussion} communitySlug={community.slug} />
                    ))}
                  </div>
                ) : (
                  <EmptyState isMember={isMember} type="questions" />
                )}
              </TabsContent>

              <TabsContent value="discussions" className="space-y-4 mt-4">
                {filterPosts('discussion').length > 0 ? (
                  filterPosts('discussion').map((post) => (
                    <PostCard key={post.id} post={post} communitySlug={community.slug} />
                  ))
                ) : (
                  <EmptyState isMember={isMember} type="discussions" />
                )}
              </TabsContent>

              <TabsContent value="questions" className="space-y-4 mt-4">
                {filterPosts('question').length > 0 ? (
                  filterPosts('question').map((post) => (
                    <PostCard key={post.id} post={post} communitySlug={community.slug} />
                  ))
                ) : (
                  <EmptyState isMember={isMember} type="questions" />
                )}
              </TabsContent>

              <TabsContent value="showcase" className="space-y-4 mt-4">
                {filterPosts('showcase').length > 0 ? (
                  filterPosts('showcase').map((post) => (
                    <PostCard key={post.id} post={post} communitySlug={community.slug} />
                  ))
                ) : (
                  <EmptyState isMember={isMember} type="showcase posts" />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Real-time Chat */}
            <div className="hidden lg:block">
              <ChatRoom
                communityId={community.id}
                communityName={community.name}
                topicName={community.project_type?.replace('_', ' ')}
                currentUserId={currentUserId}
                isMember={isMember}
                isCollapsed={isChatCollapsed}
                onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              />
            </div>

            <MembersSidebar members={members} totalMembers={community.member_count} />

            {/* Quick Links */}
            {community.project_type && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-2">Related</h3>
                <Link
                  href={`/templates?type=${community.project_type}`}
                  className="text-sm text-primary hover:underline"
                >
                  Browse {community.project_type.replace('_', ' ')} templates →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Chat */}
        {showMobileChat && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm lg:hidden">
            <div className="container mx-auto px-4 py-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Community Chat</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileChat(false)}
                >
                  Close
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatRoom
                  communityId={community.id}
                  communityName={community.name}
                  topicName={community.project_type?.replace('_', ' ')}
                  currentUserId={currentUserId}
                  isMember={isMember}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Chat FAB */}
        <ChatFloatingButton onClick={() => setShowMobileChat(true)} />
      </div>
    </div>
  );
}

function EmptyState({ isMember, type }: { isMember: boolean; type?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium">No {type || 'posts'} yet</p>
      <p className="text-sm mt-1">
        {isMember
          ? 'Be the first to start a conversation!'
          : 'Join the community to start posting.'}
      </p>
    </div>
  );
}
