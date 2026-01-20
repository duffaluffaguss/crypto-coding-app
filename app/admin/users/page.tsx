import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isAdminEmail } from '@/lib/admin';
import { Users, Search, Mail, Calendar, FolderKanban, Rocket, Trophy } from 'lucide-react';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Use service client for admin queries
  const serviceClient = await createServiceClient();

  // Build query
  let query = serviceClient
    .from('profiles')
    .select(`
      id,
      display_name,
      email,
      avatar_url,
      onboarding_completed,
      experience_level,
      created_at,
      updated_at
    `, { count: 'exact' });

  // Add search filter
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Add pagination
  const { data: users, count: totalCount } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Get project counts for each user
  const userIds = users?.map(u => u.id) || [];
  const { data: projectCounts } = userIds.length > 0 
    ? await serviceClient
        .from('projects')
        .select('user_id')
        .in('user_id', userIds)
    : { data: [] };

  const projectCountMap = (projectCounts || []).reduce((acc: Record<string, number>, p: { user_id: string }) => {
    acc[p.user_id] = (acc[p.user_id] || 0) + 1;
    return acc;
  }, {});

  // Get deployment counts
  const { data: deploymentCounts } = userIds.length > 0
    ? await serviceClient
        .from('deployments')
        .select('user_id')
        .in('user_id', userIds)
    : { data: [] };

  const deploymentCountMap = (deploymentCounts || []).reduce((acc: Record<string, number>, d: { user_id: string }) => {
    acc[d.user_id] = (acc[d.user_id] || 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  const getExperienceBadge = (level: string | null) => {
    switch (level) {
      case 'complete_beginner':
        return { label: 'Beginner', color: 'bg-green-500/10 text-green-500' };
      case 'some_coding':
        return { label: 'Some Coding', color: 'bg-blue-500/10 text-blue-500' };
      case 'web_developer':
        return { label: 'Web Dev', color: 'bg-purple-500/10 text-purple-500' };
      case 'blockchain_curious':
        return { label: 'Blockchain Curious', color: 'bg-orange-500/10 text-orange-500' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500/10 text-gray-500' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all users ({totalCount?.toLocaleString() || 0} total)
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search by name or email..."
              defaultValue={search}
              className="pl-10"
            />
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Experience</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      <FolderKanban className="w-4 h-4 inline mr-1" />
                      Projects
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                      <Rocket className="w-4 h-4 inline mr-1" />
                      Deploys
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: {
                    id: string;
                    display_name: string | null;
                    email: string | null;
                    avatar_url: string | null;
                    onboarding_completed: boolean | null;
                    experience_level: string | null;
                    created_at: string;
                    updated_at: string;
                  }) => {
                    const expBadge = getExperienceBadge(u.experience_level);
                    const projectCount = projectCountMap[u.id] || 0;
                    const deploymentCount = deploymentCountMap[u.id] || 0;

                    return (
                      <tr
                        key={u.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.display_name || 'User'}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {(u.display_name || u.email || '?')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{u.display_name || 'Anonymous'}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${expBadge.color}`}>
                            {expBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium">{projectCount}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium">{deploymentCount}</span>
                        </td>
                        <td className="py-4 px-4">
                          {u.onboarding_completed ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500">
                              Onboarding
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(u.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'No users found matching your search' : 'No users yet'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + pageSize, totalCount || 0)} of {totalCount} users
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ''}`}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ''}`}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
