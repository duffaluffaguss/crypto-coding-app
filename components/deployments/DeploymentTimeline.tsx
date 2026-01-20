'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DeploymentCard } from './DeploymentCard';
import type { Deployment } from '@/types';

interface DeploymentTimelineProps {
  projectId?: string; // If provided, only show deployments for this project
  showProjectName?: boolean; // Show project name in cards
  limit?: number; // Limit number of deployments shown
}

export function DeploymentTimeline({ 
  projectId, 
  showProjectName = false, 
  limit 
}: DeploymentTimelineProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchDeployments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, limit]);

  const fetchDeployments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('deployments')
        .select(`
          *,
          projects:project_id (
            name,
            project_type
          )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map the joined data
      const mappedDeployments = (data || []).map((d: any) => ({
        ...d,
        project_name: d.projects?.name,
        project_type: d.projects?.project_type,
      }));

      setDeployments(mappedDeployments);
    } catch (err) {
      console.error('Error fetching deployments:', err);
      setError('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  const groupDeploymentsByDate = (deployments: Deployment[]) => {
    const groups: { [key: string]: Deployment[] } = {};
    
    deployments.forEach((deployment) => {
      const date = new Date(deployment.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(deployment);
    });
    
    return groups;
  };

  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) {
      return 'Today';
    } else if (dateString === yesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {/* Loading skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="border border-border rounded-lg p-6">
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-6">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L5.196 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={fetchDeployments}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-muted-foreground mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {projectId 
            ? "This project hasn't been deployed yet. Start coding and deploy your smart contract to see it here."
            : "You haven't deployed any contracts yet. Create a project and deploy your first smart contract to get started."
          }
        </p>
      </div>
    );
  }

  const groupedDeployments = groupDeploymentsByDate(deployments);
  const sortedDates = Object.keys(groupedDeployments).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-8 p-6">
      {sortedDates.map((dateString, dateIndex) => (
        <div key={dateString} className="relative">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">{formatDateGroup(dateString)}</h3>
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">
                {groupedDeployments[dateString].length} deployment{groupedDeployments[dateString].length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            {dateIndex < sortedDates.length - 1 && (
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border -z-10" />
            )}

            {/* Deployments for this date */}
            <div className="space-y-6">
              {groupedDeployments[dateString].map((deployment, index) => (
                <div key={deployment.id} className="relative flex gap-6">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    {/* Connection line to next deployment */}
                    {index < groupedDeployments[dateString].length - 1 && (
                      <div className="absolute left-1/2 top-12 w-px h-6 bg-border transform -translate-x-0.5" />
                    )}
                  </div>

                  {/* Deployment Card */}
                  <div className="flex-1 min-w-0">
                    <DeploymentCard 
                      deployment={deployment} 
                      showProjectName={showProjectName} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Show more indicator if limit was applied */}
      {limit && deployments.length === limit && (
        <div className="text-center py-6 border-t border-border">
          <p className="text-muted-foreground text-sm">
            Showing {limit} most recent deployments
          </p>
          {!projectId && (
            <a 
              href="/deployments" 
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              View all deployments →
            </a>
          )}
        </div>
      )}
    </div>
  );
}