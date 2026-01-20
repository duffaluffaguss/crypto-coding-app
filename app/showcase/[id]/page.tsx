import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LikeButton } from '@/components/showcase/LikeButton';
import { ForkButton } from '@/components/showcase/ForkButton';
import { ShareButton } from '@/components/social';
import type { ProjectType } from '@/types';
import type { Metadata } from 'next';

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  nft_marketplace: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  token: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  dao: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  game: 'bg-green-500/10 text-green-500 border-green-500/20',
  social: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  creator: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zerotocryptodev.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      profiles!projects_user_id_fkey (
        display_name
      )
    `)
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!project) {
    return {
      title: 'Project Not Found | Zero to Crypto Dev',
    };
  }

  const title = `${project.name} | Zero to Crypto Dev`;
  const description = project.showcase_description || project.description || `A ${PROJECT_TYPE_LABELS[project.project_type as ProjectType]} project built on Base`;
  const creatorName = project.profiles?.display_name || 'Anonymous';
  
  const ogImageUrl = new URL('/api/og', BASE_URL);
  ogImageUrl.searchParams.set('type', 'project');
  ogImageUrl.searchParams.set('title', project.name);
  ogImageUrl.searchParams.set('description', description.slice(0, 150));
  ogImageUrl.searchParams.set('projectType', project.project_type);
  ogImageUrl.searchParams.set('userName', creatorName);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${BASE_URL}/showcase/${id}`,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: project.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function ShowcaseProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch project files
  const { data: files } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', id)
    .order('updated_at', { ascending: false });

  // Check if current user has liked this project
  let hasLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .single();
    hasLiked = !!like;
  }

  const mainFile = files?.find(f => f.file_type === 'solidity') || files?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary">
              Zero to Crypto Dev
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/showcase"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Showcase
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>by {project.profiles?.display_name || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 text-sm rounded-full border ${
                    PROJECT_TYPE_COLORS[project.project_type as ProjectType]
                  }`}
                >
                  {PROJECT_TYPE_LABELS[project.project_type as ProjectType]}
                </span>
              </div>

              <p className="text-lg text-muted-foreground">
                {project.showcase_description || project.description}
              </p>
            </div>

            {/* Code Preview */}
            {mainFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {mainFile.filename}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm max-h-[500px] overflow-y-auto">
                      <code className="text-foreground">{mainFile.content}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Like Button */}
                <LikeButton
                  projectId={project.id}
                  initialLikes={project.likes_count || 0}
                  initialHasLiked={hasLiked}
                  isLoggedIn={!!user}
                />

                {/* Fork Button */}
                <ForkButton
                  projectId={project.id}
                  projectName={project.name}
                  isLoggedIn={!!user}
                />

                {/* Share Button */}
                <ShareButton
                  shareData={{
                    title: project.name,
                    text: `Check out "${project.name}" - a ${PROJECT_TYPE_LABELS[project.project_type as ProjectType]} project built on Zero to Crypto Dev! 🚀`,
                    url: `${BASE_URL}/showcase/${project.id}`,
                  }}
                  previewTitle={project.name}
                  previewDescription={project.showcase_description || project.description}
                  variant="outline"
                  className="w-full"
                />

                {/* View Contract */}
                {project.contract_address && (
                  <a
                    href={`https://${project.network === 'base-mainnet' ? '' : 'sepolia.'}basescan.org/address/${project.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Base Explorer
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Project Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    {project.contract_address ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-500">
                        ✓ Deployed
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {project.contract_address && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Contract Address</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded block overflow-hidden text-ellipsis">
                      {project.contract_address}
                    </code>
                  </div>
                )}

                {project.network && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Network</div>
                    <div className="text-sm">
                      {project.network === 'base-mainnet' ? 'Base Mainnet' : 'Base Sepolia (Testnet)'}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Files</div>
                  <div className="space-y-1">
                    {files?.map((file) => (
                      <div key={file.id} className="text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {file.filename}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creator Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/profile/${project.profiles?.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                    <span className="text-primary font-medium">
                      {(project.profiles?.display_name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-primary transition-colors">
                      {project.profiles?.display_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-muted-foreground">View Profile →</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
