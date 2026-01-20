'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CommunityCard } from '@/components/community/CommunityCard';
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

interface CommunityListProps {
  communities: Community[];
  userMemberships: string[];
  isAuthenticated: boolean;
}

export function CommunityList({
  communities,
  userMemberships,
  isAuthenticated,
}: CommunityListProps) {
  const [memberships, setMemberships] = useState<string[]>(userMemberships);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (communityId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to join communities');
      router.push('/login');
      return;
    }

    setLoadingId(communityId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      setMemberships([...memberships, communityId]);
      toast.success('Joined community!');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community');
    } finally {
      setLoadingId(null);
    }
  };

  const handleLeave = async (communityId: string) => {
    setLoadingId(communityId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;

      setMemberships(memberships.filter((id) => id !== communityId));
      toast.success('Left community');
      startTransition(() => router.refresh());
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave community');
    } finally {
      setLoadingId(null);
    }
  };

  const joinedCommunities = communities.filter((c) => memberships.includes(c.id));
  const otherCommunities = communities.filter((c) => !memberships.includes(c.id));

  return (
    <div className="space-y-8">
      {/* Your Communities */}
      {joinedCommunities.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Communities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {joinedCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                isMember={true}
                onLeave={handleLeave}
                isLoading={loadingId === community.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Communities */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          {joinedCommunities.length > 0 ? 'Explore More' : 'All Communities'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {otherCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isMember={false}
              onJoin={handleJoin}
              isLoading={loadingId === community.id}
            />
          ))}
        </div>
        {otherCommunities.length === 0 && joinedCommunities.length > 0 && (
          <p className="text-muted-foreground text-center py-8">
            You&apos;ve joined all available communities! 🎉
          </p>
        )}
      </section>
    </div>
  );
}
