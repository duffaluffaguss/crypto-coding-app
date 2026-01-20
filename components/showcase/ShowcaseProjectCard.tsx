'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import CloneButton from '@/components/project/CloneButton';
import { createClient } from '@/lib/supabase/client';
import type { ProjectType } from '@/types';

interface ShowcaseProjectCardProps {
  project: {
    id: string;
    name: string;
    project_type: ProjectType | string;
    showcase_description: string | null;
    description: string;
    likes_count: number;
    comments_count?: number;
    contract_address: string | null;
    profiles?: { display_name: string | null } | null;
  };
}

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

export function ShowcaseProjectCard({ project }: ShowcaseProjectCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkBookmarkStatus();
  }, [project.id]);

  const checkBookmarkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    if (!user) return;

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'project')
      .eq('item_id', project.id)
      .single();

    setIsBookmarked(!!data);
  };

  return (
    <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group relative">
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <CloneButton
          projectId={project.id}
          projectName={project.name}
          variant="outline"
          size="sm"
          showText={false}
          className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
        />
        <BookmarkButton
          itemType="project"
          itemId={project.id}
          initialBookmarked={isBookmarked}
          isLoggedIn={isLoggedIn}
          variant="outline"
          className="bg-background/80 hover:bg-background"
          onToggle={setIsBookmarked}
        />
      </div>
      
      <Link href={`/showcase/${project.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between pr-10">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="mt-1">
                by {project.profiles?.display_name || 'Anonymous'}
              </CardDescription>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full border ${
                PROJECT_TYPE_COLORS[project.project_type as ProjectType] || ''
              }`}
            >
              {PROJECT_TYPE_LABELS[project.project_type as ProjectType] || project.project_type}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {project.showcase_description || project.description}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-sm">{project.likes_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm">{project.comments_count || 0}</span>
              </div>
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
      </Link>
    </Card>
  );
}
