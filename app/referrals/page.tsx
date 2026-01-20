import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReferralDashboard } from './ReferralDashboard';

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile with referral code
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, referral_code, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Get referral stats
  const { data: stats } = await supabase
    .rpc('get_referral_stats', { user_uuid: user.id });

  // Get list of referred users
  const { data: referredUsers } = await supabase
    .rpc('get_referred_users', { user_uuid: user.id });

  // Get recent rewards
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('*, profiles!referral_rewards_referred_user_id_fkey(display_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerotocrypto.dev';
  const referralLink = `${baseUrl}/signup?ref=${profile.referral_code}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/showcase"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Showcase
            </Link>
            <span className="text-sm font-medium text-foreground">
              Referrals
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>🎁</span>
            Refer Friends & Earn Rewards
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your unique referral link and earn 100 points for each friend who joins!
          </p>
        </div>

        <ReferralDashboard
          referralCode={profile.referral_code || ''}
          referralLink={referralLink}
          stats={stats || { referral_count: 0, total_points: 0 }}
          referredUsers={referredUsers || []}
          rewards={rewards || []}
        />
      </main>
    </div>
  );
}
