import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DeploymentTimeline } from '@/components/deployments/DeploymentTimeline';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: `${project?.name || 'Project'} Deployments | Zero to Crypto`,
    description: 'View deployment history for this project',
  };
}

export default async function ProjectDeploymentsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project details
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    notFound();
  }

  // Get deployment stats for this project
  const { data: deployments } = await supabase
    .from('deployments')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const totalDeployments = deployments?.length || 0;
  const testnetDeployments = deployments?.filter(d => d.network === 'base-sepolia').length || 0;
  const mainnetDeployments = deployments?.filter(d => d.network === 'base-mainnet').length || 0;
  const totalGasUsed = deployments?.reduce((sum, d) => sum + (d.gas_used || 0), 0) || 0;
  const latestDeployment = deployments?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/projects/${id}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Project
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <Link href="/deployments">
                <Button variant="ghost" size="sm" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  </svg>
                  All Deployments
                </Button>
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant="outline" className="capitalize">
              {project.project_type.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Deployment history and contract interactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDeployments}</p>
                  <p className="text-sm text-muted-foreground">Deployments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{testnetDeployments}</p>
                  <p className="text-sm text-muted-foreground">Testnet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{mainnetDeployments}</p>
                  <p className="text-sm text-muted-foreground">Mainnet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalGasUsed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Gas Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Contract Info */}
        {latestDeployment && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Current Deployment
              </CardTitle>
              <CardDescription>
                Most recent contract deployment for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Address</p>
                  <p className="font-mono text-sm break-all">{latestDeployment.contract_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Network</p>
                  <Badge 
                    variant="outline" 
                    className={latestDeployment.network === 'base-sepolia' 
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                      : 'bg-green-500/10 text-green-500 border-green-500/20'
                    }
                  >
                    {latestDeployment.network === 'base-sepolia' ? 'Base Sepolia' : 'Base Mainnet'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deployed</p>
                  <p className="text-sm">
                    {new Date(latestDeployment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deployment Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Timeline</CardTitle>
            <CardDescription>
              Complete deployment history for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DeploymentTimeline projectId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}