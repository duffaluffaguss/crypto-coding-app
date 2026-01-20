import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TeamCard } from '@/components/teams/TeamCard';
import { CreateTeamModal } from '@/components/teams/CreateTeamModal';

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get teams the user is a member of
  const { data: membershipData } = await supabase
    .from('team_members')
    .select(`
      team_project_id,
      role,
      team_projects (
        id,
        name,
        description,
        created_at,
        created_by
      )
    `)
    .eq('user_id', user.id);

  // Get all team data with members and project counts
  const teams = await Promise.all(
    (membershipData || []).map(async (membership) => {
      const team = membership.team_projects as {
        id: string;
        name: string;
        description: string | null;
        created_at: string;
        created_by: string;
      };

      // Get team members with profiles
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('team_project_id', team.id);

      // Get project count for this team
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('team_project_id', team.id);

      return {
        ...team,
        members: members?.map(m => ({
          ...m,
          profile: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        })) || [],
        project_count: projectCount || 0,
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Teams</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate with others on Web3 projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Button>
          </Link>
          <CreateTeamModal />
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No teams yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a team to start collaborating on projects with other developers.
          </p>
          <CreateTeamModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
