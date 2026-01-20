import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Certificate } from '@/components/certificate/Certificate';
import { ShareButtons } from '@/components/certificate/ShareButtons';
import { Button } from '@/components/ui/button';
import { CertificateActions } from './CertificateActions';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

function generateCertificateId(projectId: string, completedAt: string): string {
  // Create a unique certificate ID based on project ID and completion date
  const hash = Buffer.from(`${projectId}-${completedAt}`).toString('base64').slice(0, 8);
  return `ZTCD-${hash.toUpperCase()}`;
}

export default async function CertificatePage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch project with creator info
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles!projects_user_id_fkey (
        id,
        display_name
      )
    `)
    .eq('id', projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  // Verify project is completed (deployed or published status)
  const isCompleted = project.status === 'deployed' || project.status === 'published';
  if (!isCompleted) {
    notFound();
  }

  // Get completion date (deployed_at or created_at as fallback)
  const completionDate = project.deployed_at || project.created_at;
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get user's display name (owner for their own cert, or profile name for public view)
  const isOwner = user?.id === project.user_id;
  const userName = project.profiles?.display_name || 'Web3 Developer';

  // Generate certificate ID
  const certificateId = generateCertificateId(projectId, completionDate);

  // Certificate URL for sharing
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerotocryptodev.com';
  const certificateUrl = `${baseUrl}/certificate/${projectId}`;

  const certificateData = {
    certificateId,
    userName,
    projectName: project.name,
    projectType: project.project_type,
    completionDate: formattedDate,
    contractAddress: project.contract_address,
    network: project.network,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-500/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            {isOwner && (
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="sm">Start Building</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            🎉 Certificate of Completion
          </h1>
          <p className="text-muted-foreground">
            {isOwner
              ? 'Congratulations on completing your Web3 project!'
              : `${userName} has completed this Web3 project`}
          </p>
        </div>

        {/* Certificate Display */}
        <div className="flex justify-center mb-8">
          <Certificate data={certificateData} />
        </div>

        {/* Actions */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Download/Print Actions - Client Component */}
          <CertificateActions certificateData={certificateData} />

          {/* Share Buttons */}
          <div className="pt-6 border-t border-border">
            <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">
              Share your achievement
            </h2>
            <ShareButtons
              projectName={project.name}
              certificateUrl={certificateUrl}
              contractAddress={project.contract_address}
            />
          </div>

          {/* Contract Link */}
          {project.contract_address && (
            <div className="pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">
                View your deployed contract on Base Explorer
              </p>
              <a
                href={`https://${project.network === 'base-mainnet' ? '' : 'sepolia.'}basescan.org/address/${project.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View on BaseScan
                </Button>
              </a>
            </div>
          )}

          {/* CTA for non-users */}
          {!user && (
            <div className="pt-6 border-t border-border text-center">
              <p className="text-muted-foreground mb-4">
                Want to build your own Web3 project and earn a certificate?
              </p>
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Building for Free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          Built with Zero to Crypto Dev
        </div>
      </footer>
    </div>
  );
}
