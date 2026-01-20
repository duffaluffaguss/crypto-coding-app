'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DeleteProjectButton } from './DeleteProjectButton';
import CloneButton from '@/components/project/CloneButton';
import type { ProjectCollaborator } from '@/types';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    description: string | null;
    contract_address: string | null;
    deployments_count?: number;
    collaborators?: ProjectCollaborator[];
    user_role?: 'owner' | 'editor' | 'viewer';
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'deployed':
      return 'bg-green-500/10 text-green-500';
    case 'learning':
      return 'bg-blue-500/10 text-blue-500';
    case 'published':
      return 'bg-purple-500/10 text-purple-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ProjectCard({ project }: ProjectCardProps) {
  const isCompleted = project.status === 'deployed' || project.status === 'published';

  return (
    <div className="relative group">
      <Link href={`/projects/${project.id}`}>
        <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription className="mt-1">
                  {project.project_type.replace('_', ' ')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>

            {/* Collaborators Section */}
            {project.collaborators && project.collaborators.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center -space-x-2">
                  {project.collaborators.slice(0, 4).map((collaborator, index) => (
                    <Avatar key={collaborator.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage 
                        src={collaborator.user_profile?.avatar_url || undefined} 
                        alt={collaborator.user_profile?.display_name || 'Collaborator'} 
                      />
                      <AvatarFallback className="text-xs">
                        {(collaborator.user_profile?.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.collaborators.length > 4 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                      +{project.collaborators.length - 4}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {project.collaborators.length} collaborator{project.collaborators.length !== 1 ? 's' : ''}
                </div>
                {project.user_role && project.user_role !== 'owner' && (
                  <Badge variant="secondary" className="text-xs">
                    {project.user_role}
                  </Badge>
                )}
              </div>
            )}

            {(project.contract_address || project.deployments_count) && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {project.contract_address && (
                  <p className="text-xs text-muted-foreground">
                    Contract:{' '}
                    <code className="text-primary">
                      {project.contract_address.slice(0, 6)}...
                      {project.contract_address.slice(-4)}
                    </code>
                  </p>
                )}
                {project.deployments_count !== undefined && project.deployments_count > 0 && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{project.deployments_count} deployment{project.deployments_count !== 1 ? 's' : ''}</span>
                    </div>
                    <Link
                      href={`/projects/${project.id}/deployments`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:underline"
                    >
                      View History
                    </Link>
                  </div>
                )}
              </div>
            )}
            {/* Certificate Button for Completed Projects */}
            {isCompleted && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href={`/certificate/${project.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40 text-amber-600 dark:text-amber-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    Get Certificate
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      {/* Action buttons - show on hover */}
      <div 
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <CloneButton 
          projectId={project.id} 
          projectName={project.name}
          variant="ghost" 
          size="sm" 
          showText={false}
          className="h-8 w-8 p-0"
        />
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </div>
    </div>
  );
}
