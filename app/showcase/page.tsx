import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShowcaseFilters } from '@/components/showcase/ShowcaseFilters';
import type { ProjectType } from '@/types';

interface ShowcaseProject {
  id: string;
  name: string;
  project_type: ProjectType;
  showcase_description: string | null;
  description: string;
  likes_count: number;
  created_at: string;
  contract_address: string | null;
  profiles: {
    display_name: string | null;
  } | null;
}

// Type for the query result
type ProjectWithProfile = {
  id: string;
  name: string;
  project_type: string;
  showcase_description: string | null;
  description: string;
  likes_count: number;
  created_at: string;
  contract_address: string | null;
  profiles: { display_name: string | null } | null;
};

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  nft_marketplace: 'NFT',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social',
  creator: 'Creator',
};

const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  nft_marketplace: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  token: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  dao: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  game: 'bg-green-500/10 text-green-500 border-green-500/20',
  social: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  creator: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Build query
  let query = supabase
    .from('projects')
    .select(`
      id,
      name,
      project_type,
      showcase_description,
      description,
      likes_count,
      created_at,
      contract_address,
      profiles (
        display_name
      )
    `)
    .eq('is_public', true);

  // Filter by type
  if (params.type && params.type !== 'all') {
    query = query.eq('project_type', params.type);
  }

  // Sort
  if (params.sort === 'likes') {
    query = query.order('likes_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: projects } = await query;

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
                className="text-sm font-medium text-foreground"
              >
                Showcase
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Projects
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Community Showcase</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing Web3 projects built by our community. Get inspired, 
            learn from others, and fork projects to make them your own.
          </p>
        </div>

        {/* Filters */}
        <ShowcaseFilters 
          currentType={params.type || 'all'} 
          currentSort={params.sort || 'newest'} 
        />

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/showcase/${project.id}`}>
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          by {(project.profiles as any)?.display_name || 'Anonymous'}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${
                          PROJECT_TYPE_COLORS[project.project_type as ProjectType]
                        }`}
                      >
                        {PROJECT_TYPE_LABELS[project.project_type as ProjectType]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {project.showcase_description || project.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="text-sm">{project.likes_count}</span>
                      </div>
                      {project.contract_address && (
                        <div className="text-xs text-muted-foreground">
                          <span className="px-2 py-1 rounded bg-green-500/10 text-green-500">
                            Deployed
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share your project with the community!
            </p>
            {user ? (
              <Link href="/dashboard">
                <Button>Create a Project</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
