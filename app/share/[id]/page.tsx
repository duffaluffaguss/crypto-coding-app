import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project without auth check (public view)
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .in('status', ['deployed', 'published'])
    .single();

  if (!project) {
    notFound();
  }

  // Get the creator's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', project.user_id)
    .single();

  // Get project files
  const { data: files } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', id)
    .order('filename');

  const mainFile = files?.find((f) => f.file_type === 'solidity');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Zero to Crypto Dev
          </Link>
          <Link href="/signup">
            <Button size="sm">Start Building</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Project Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Deployed on Base Sepolia
            </div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.project_type.replace('_', ' ')} by{' '}
              <span className="text-foreground">{profile?.display_name || 'Anonymous'}</span>
            </p>
          </div>

          {/* Contract Details Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Smart Contract
              </CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contract Address */}
              {project.contract_address && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
                    <code className="text-sm font-mono">{project.contract_address}</code>
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/address/${project.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    View on BaseScan
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}

              {/* Network Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Network</p>
                  <p className="text-sm font-medium">Base Sepolia (Testnet)</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Deployed</p>
                  <p className="text-sm font-medium">
                    {project.deployed_at
                      ? new Date(project.deployed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Code Preview */}
          {mainFile && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  Source Code
                </CardTitle>
                <CardDescription>{mainFile.filename}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-900 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-700">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-xs text-zinc-400">{mainFile.filename}</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm text-zinc-300 font-mono max-h-96">
                    <code>{mainFile.content}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Want to build your own Web3 project?
            </p>
            <Link href="/signup">
              <Button size="lg">
                Start Building for Free
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
