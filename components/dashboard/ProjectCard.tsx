'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteProjectButton } from './DeleteProjectButton';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    project_type: string;
    status: string;
    description: string | null;
    contract_address: string | null;
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
            {project.contract_address && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Contract:{' '}
                  <code className="text-primary">
                    {project.contract_address.slice(0, 6)}...
                    {project.contract_address.slice(-4)}
                  </code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      {/* Delete button - shows on hover */}
      <div 
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </div>
    </div>
  );
}
