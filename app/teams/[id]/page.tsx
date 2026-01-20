import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteMemberModal } from '@/components/teams/InviteMemberModal';
import { LinkProjectToTeam } from '@/components/teams/LinkProjectToTeam';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_project_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    notFound();
  }

  const isOwner = membership.role === 'owner';

  // Get team details
  const { data: team } = await supabase
    .from('team_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!team) {
    notFound();
  }

  // Get team members with profiles
  const { data: members } = await supabase
    .from('team_members')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles:user_id (
        username,
        avatar_url,
        full_name
      )
    `)
    .eq('team_project_id', id)
    .order('joined_at');

  // Get team projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('team_project_id', id)
    .order('created_at', { ascending: false });

  // Get user's personal projects not linked to any team (for linking)
  const { data: personalProjects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .is('team_project_id', null);

  const formattedMembers = members?.map(m => ({
    ...m,
    profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/teams" className="text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold">{team.name}</h1>
          </div>
          {team.description && (
            <p className="text-muted-foreground max-w-2xl">
              {team.description}
            </p>
          )}
        </div>
        {isOwner && (
          <InviteMemberModal teamId={team.id} teamName={team.name} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Projects</CardTitle>
                  <CardDescription>
                    Projects shared with this team
                  </CardDescription>
                </div>
                {personalProjects && personalProjects.length > 0 && (
                  <LinkProjectToTeam 
                    teamId={team.id} 
                    projects={personalProjects} 
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Link 
                      key={project.id} 
                      href={`/projects/${project.id}`}
                      className="block p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.project_type?.replace('_', ' ')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'deployed' 
                            ? 'bg-green-500/10 text-green-500' 
                            : project.status === 'published'
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p>No projects yet</p>
                  <p className="text-sm mt-1">Link a project to share it with your team</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Members</CardTitle>
              <CardDescription>
                {formattedMembers.length} member{formattedMembers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formattedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profile?.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.profile?.full_name || member.profile?.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{member.profile?.username || 'user'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.role === 'owner' 
                        ? 'bg-amber-500/10 text-amber-500' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(team.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Role</p>
                <p className="text-sm capitalize">{membership.role}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
