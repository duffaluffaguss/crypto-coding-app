import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VerificationStatus } from '@/components/verification/VerificationStatus';

export const metadata = {
  title: 'Get Verified | CryptoCode',
  description: 'Verify your identity and build trust in the community',
};

export default async function VerifyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/verify');
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Get Verified</h1>
        <p className="text-muted-foreground">
          Build trust and unlock exclusive features by verifying your identity through multiple providers.
        </p>
      </div>

      <VerificationStatus userId={user.id} />
    </div>
  );
}
