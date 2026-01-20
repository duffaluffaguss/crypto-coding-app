'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { contractTemplates, ContractTemplate, getDifficultyColor, getCategoryColor } from '@/lib/contract-templates';
import { tutorials, Tutorial, categoryLabels, categoryColors, difficultyColors } from '@/lib/tutorials';
import type { BookmarkItemType } from '@/components/bookmarks/BookmarkButton';

type TabType = 'templates' | 'projects' | 'lessons';

interface Bookmark {
  id: string;
  item_type: BookmarkItemType;
  item_id: string;
  created_at: string;
}

interface ShowcaseProject {
  id: string;
  name: string;
  description: string;
  project_type: string;
  showcase_description: string | null;
  likes_count: number;
  contract_address: string | null;
  profiles: { display_name: string | null } | null;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT',
  token: 'Token',
  dao: 'DAO',
  game: 'Game',
  social: 'Social',
  creator: 'Creator',
};

const PROJECT_TYPE_COLORS: Record<string, string> = {
  nft_marketplace: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  token: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  dao: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  game: 'bg-green-500/10 text-green-500 border-green-500/20',
  social: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  creator: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export default function BookmarksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [projects, setProjects] = useState<Map<string, ShowcaseProject>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookmarks();
    }
  }, [isLoggedIn]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/bookmarks');
      return;
    }
    setIsLoggedIn(true);
  };

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);

      // Fetch project details for bookmarked projects
      const projectIds = (data || [])
        .filter((b: Bookmark) => b.item_type === 'project')
        .map((b: Bookmark) => b.item_id);

      if (projectIds.length > 0) {
        const { data: projectData } = await supabase
          .from('projects')
          .select(`
            id, name, description, project_type, showcase_description,
            likes_count, contract_address,
            profiles (display_name)
          `)
          .in('id', projectIds)
          .eq('is_public', true);

        if (projectData) {
          const projectMap = new Map<string, ShowcaseProject>();
          projectData.forEach((p: any) => {
            projectMap.set(p.id, p);
          });
          setProjects(projectMap);
        }
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (!error) {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const filteredBookmarks = bookmarks.filter((b) => {
    if (activeTab === 'templates') return b.item_type === 'template';
    if (activeTab === 'projects') return b.item_type === 'project';
    if (activeTab === 'lessons') return b.item_type === 'lesson';
    return false;
  });

  const getTemplateById = (id: string): ContractTemplate | undefined => {
    return contractTemplates.find((t) => t.id === id);
  };

  const getTutorialById = (id: string): Tutorial | undefined => {
    return tutorials.find((t) => t.id === id);
  };

  const tabCounts = {
    templates: bookmarks.filter((b) => b.item_type === 'template').length,
    projects: bookmarks.filter((b) => b.item_type === 'project').length,
    lessons: bookmarks.filter((b) => b.item_type === 'lesson').length,
  };

  if (!isLoggedIn) {
    return null;
  }

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
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/bookmarks"
                className="text-sm font-medium text-foreground"
              >
                Bookmarks
              </Link>
            </nav>
          </div>
          <Link href="/dashboard">
            <Button size="sm" variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">My Bookmarks</h1>
          </div>
          <p className="text-muted-foreground">
            Save templates, projects, and tutorials for quick access later.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {(['templates', 'projects', 'lessons'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab} ({tabCounts[tab]})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No {activeTab} bookmarked yet</h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'templates' && 'Browse templates and save your favorites for quick access.'}
                {activeTab === 'projects' && 'Explore the showcase and bookmark projects that inspire you.'}
                {activeTab === 'lessons' && 'Save tutorials to create your own learning playlist.'}
              </p>
              <Link href={activeTab === 'templates' ? '/templates' : activeTab === 'projects' ? '/showcase' : '/tutorials'}>
                <Button>
                  Browse {activeTab === 'templates' ? 'Templates' : activeTab === 'projects' ? 'Showcase' : 'Tutorials'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Template Bookmarks */}
            {activeTab === 'templates' && filteredBookmarks.map((bookmark) => {
              const template = getTemplateById(bookmark.item_id);
              if (!template) return null;
              return (
                <Card key={bookmark.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(template.difficulty)}`}>
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBookmark(bookmark.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove bookmark"
                      >
                        <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 mb-4">
                      {template.description}
                    </CardDescription>
                    <Link href="/templates">
                      <Button size="sm" className="w-full">Use Template</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}

            {/* Project Bookmarks */}
            {activeTab === 'projects' && filteredBookmarks.map((bookmark) => {
              const project = projects.get(bookmark.item_id);
              if (!project) {
                return (
                  <Card key={bookmark.id} className="group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg text-muted-foreground">Project unavailable</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBookmark(bookmark.id)}
                          title="Remove bookmark"
                        >
                          <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This project may have been removed or made private.
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Card key={bookmark.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{project.name}</CardTitle>
                        <CardDescription className="mt-1">
                          by {project.profiles?.display_name || 'Anonymous'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${PROJECT_TYPE_COLORS[project.project_type] || ''}`}>
                          {PROJECT_TYPE_LABELS[project.project_type] || project.project_type}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBookmark(bookmark.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove bookmark"
                        >
                          <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.showcase_description || project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span className="text-sm">{project.likes_count}</span>
                      </div>
                      <Link href={`/showcase/${project.id}`}>
                        <Button size="sm" variant="outline">View Project</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Lesson/Tutorial Bookmarks */}
            {activeTab === 'lessons' && filteredBookmarks.map((bookmark) => {
              const tutorial = getTutorialById(bookmark.item_id);
              if (!tutorial) return null;
              const thumbnailUrl = `https://img.youtube.com/vi/${tutorial.youtubeId}/mqdefault.jpg`;
              return (
                <Card key={bookmark.id} className="group overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={thumbnailUrl}
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                      {tutorial.duration}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBookmark(bookmark.id)}
                      className="absolute top-2 right-2 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove bookmark"
                    >
                      <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[tutorial.category]}`}>
                        {categoryLabels[tutorial.category]}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${difficultyColors[tutorial.difficulty]}`}>
                        {tutorial.difficulty}
                      </span>
                    </div>
                    <h3 className="font-semibold line-clamp-2 mb-2">{tutorial.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {tutorial.description}
                    </p>
                    <Link href={`/tutorials/${tutorial.id}`}>
                      <Button size="sm" className="w-full">Watch Tutorial</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
