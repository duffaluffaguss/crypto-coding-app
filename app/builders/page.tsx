import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BuilderDirectoryClient } from './BuilderDirectoryClient';

export const metadata: Metadata = {
  title: 'Builder Directory | Zero to Crypto Dev',
  description: 'Discover and connect with crypto developers, builders, and collaborators. Find talented individuals to work with on your next Web3 project.',
  keywords: ['crypto builders', 'web3 developers', 'blockchain collaboration', 'developer directory'],
};

export default async function BuildersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch builders with relevant data
  const { data: buildersData, error } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      bio,
      avatar_url,
      interests,
      experience_level,
      created_at,
      website_url,
      twitter_handle,
      github_username,
      looking_for_collaborators,
      skills
    `)
    .eq('onboarding_completed', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching builders:', error);
  }

  // Get projects count for each builder
  const builderIds = buildersData?.map(b => b.id) || [];
  const { data: projectCounts } = await supabase
    .from('projects')
    .select('user_id, id')
    .in('user_id', builderIds)
    .eq('status', 'published');

  // Get follower counts
  const { data: followerCounts } = await supabase
    .rpc('get_follower_counts', { user_ids: builderIds });

  // Get current user's following relationships
  let userFollowing: string[] = [];
  if (user) {
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    userFollowing = followingData?.map(f => f.following_id) || [];
  }

  // Calculate reputation scores (simple algorithm for now)
  const builders = (buildersData || []).map(builder => {
    const projects_count = projectCounts?.filter(p => p.user_id === builder.id).length || 0;
    const followers_count = followerCounts?.[builder.id] || 0;
    
    // Simple reputation calculation: projects * 10 + followers * 2
    const reputation_score = (projects_count * 10) + (followers_count * 2);
    
    return {
      ...builder,
      projects_count,
      followers_count,
      reputation_score,
      recent_activity: builder.created_at, // Could be enhanced with actual activity data
      is_following: userFollowing.includes(builder.id),
      is_follower: false, // Could be computed if needed
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold">Builder Directory</h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Connect with talented crypto developers and builders. Find collaborators 
            for your next Web3 project or discover skilled individuals to learn from.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{builders.length} builders</span>
            <span>•</span>
            <span>{builders.filter(b => b.looking_for_collaborators).length} looking for collaborators</span>
            <span>•</span>
            <span>{builders.filter(b => b.projects_count > 0).length} with published projects</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <BuilderDirectoryClient 
          initialBuilders={builders}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
}