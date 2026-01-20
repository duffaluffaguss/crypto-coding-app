import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { CertificateCustomizeClient } from './CertificateCustomizeClient';
import type { Metadata } from 'next';

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title: `Customize Certificate | Zero to Crypto Dev`,
    description: `Customize your NFT certificate design before minting`,
  };
}

function generateCertificateId(projectId: string, completedAt: string): string {
  const hash = Buffer.from(`${projectId}-${completedAt}`).toString('base64').slice(0, 8);
  return `ZTCD-${hash.toUpperCase()}`;
}

export default async function CertificateCustomizePage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Must be logged in
  if (!user) {
    redirect(`/login?redirect=/certificate/${projectId}/customize`);
  }

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

  // Must be project owner
  if (project.user_id !== user.id) {
    redirect(`/certificate/${projectId}`);
  }

  // Verify project is completed
  const isCompleted = project.status === 'deployed' || project.status === 'published';
  if (!isCompleted) {
    notFound();
  }

  // Get completion date
  const completionDate = project.deployed_at || project.created_at;
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const userName = project.profiles?.display_name || 'Web3 Developer';
  const certificateId = generateCertificateId(projectId, completionDate);

  const certificateData = {
    certificateId,
    userName,
    projectName: project.name,
    projectType: project.project_type,
    completionDate: formattedDate,
    contractAddress: project.contract_address,
    network: project.network,
  };

  // Check if user already has a custom style saved
  const { data: existingStyle } = await supabase
    .from('certificate_styles')
    .select('style_config')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-500/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <Link
              href={`/certificate/${projectId}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Certificate
            </Link>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            🎨 Customize Your NFT Certificate
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Design your certificate before minting it as an NFT. Choose colors, styles, and what elements to display.
          </p>
        </div>

        {/* Project Info Card */}
        <div className="max-w-md mx-auto mb-8 p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{project.name}</h3>
              <p className="text-sm text-muted-foreground">
                {PROJECT_TYPE_LABELS[project.project_type] || project.project_type}
              </p>
            </div>
          </div>
        </div>

        {/* Designer Component */}
        <div className="max-w-4xl mx-auto">
          <CertificateCustomizeClient
            certificateData={certificateData}
            projectId={projectId}
            initialStyle={existingStyle?.style_config || undefined}
          />
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
