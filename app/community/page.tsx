import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CommunityList } from './CommunityList';

export const metadata: Metadata = {
  title: 'Communities | Zero to Crypto Dev',
  description: 'Join crypto developer communities. Discuss tokens, NFTs, DAOs, DeFi, and more.',
};

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all communities
  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false });

  // Fetch user's memberships
  let userMemberships: string[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);
    userMemberships = memberships?.map((m) => m.community_id) || [];
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold">Communities</h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Connect with fellow crypto developers. Ask questions, share your work, 
            and learn from others building on-chain.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <CommunityList
          communities={communities || []}
          userMemberships={userMemberships}
          isAuthenticated={!!user}
        />
      </div>
    </div>
  );
}
