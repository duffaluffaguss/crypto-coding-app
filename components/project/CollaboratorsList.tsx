'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, UserX, Settings, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectCollaborator, CollaboratorRole } from '@/types';
import { getRoleColor, getRoleDisplayName, canUserManageCollaborators } from '@/types';

interface CollaboratorsListProps {
  projectId: string;
  userRole?: CollaboratorRole;
  refreshTrigger?: number;
}

export default function CollaboratorsList({
  projectId,
  userRole,
  refreshTrigger = 0,
}: CollaboratorsListProps) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<ProjectCollaborator | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClientComponentClient();
  const canManageCollaborators = canUserManageCollaborators(userRole);

  useEffect(() => {
    loadCollaborators();
    getCurrentUser();
  }, [projectId, refreshTrigger]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadCollaborators = async () => {
    try {
      const response = await fetch(`/api/collaborators?projectId=${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }

      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (error) {
      console.error('Error loading collaborators:', error);
      toast.error('Failed to load collaborators');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator: ProjectCollaborator) => {
    setCollaboratorToRemove(collaborator);
    setShowRemoveDialog(true);
  };

  const confirmRemoveCollaborator = async () => {
    if (!collaboratorToRemove) return;

    setRemovingId(collaboratorToRemove.id);
    try {
      const response = await fetch(`/api/collaborators?collaboratorId=${collaboratorToRemove.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }

      setCollaborators(prev => prev.filter(c => c.id !== collaboratorToRemove.id));
      toast.success('Collaborator removed successfully');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    } finally {
      setRemovingId(null);
      setShowRemoveDialog(false);
      setCollaboratorToRemove(null);
    }
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: Exclude<CollaboratorRole, 'owner'>) => {
    try {
      const response = await fetch('/api/collaborators', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaborator_id: collaboratorId,
          action: 'update_role',
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      setCollaborators(prev =>
        prev.map(c =>
          c.id === collaboratorId ? { ...c, role: newRole } : c
        )
      );

      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleAcceptInvitation = async (collaboratorId: string) => {
    try {
      const response = await fetch('/api/collaborators', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaborator_id: collaboratorId,
          action: 'accept',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      setCollaborators(prev =>
        prev.map(c =>
          c.id === collaboratorId
            ? { ...c, accepted_at: new Date().toISOString(), is_pending: false }
            : c
        )
      );

      toast.success('Invitation accepted!');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg font-medium mb-2">No collaborators yet</div>
        <div className="text-sm">
          Invite people to collaborate on this project
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className={`flex items-center gap-3 p-3 border rounded-lg ${
              collaborator.is_pending ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
            }`}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={collaborator.user_profile?.avatar_url || undefined} />
              <AvatarFallback>
                {(collaborator.user_profile?.display_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {collaborator.user_profile?.display_name || 'Unknown User'}
                </span>
                {collaborator.is_pending && (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getRoleColor(collaborator.role)}`}
                >
                  {getRoleDisplayName(collaborator.role)}
                </Badge>
                {collaborator.is_pending && (
                  <span className="text-xs text-yellow-600">Pending invitation</span>
                )}
                {!collaborator.is_pending && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Active
                  </span>
                )}
              </div>
              {collaborator.user_profile?.github_username && (
                <div className="text-xs text-gray-500 mt-1">
                  @{collaborator.user_profile.github_username}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {collaborator.is_pending && collaborator.user_id === currentUserId && (
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvitation(collaborator.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Accept
                </Button>
              )}

              {(canManageCollaborators || collaborator.user_id === currentUserId) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removingId === collaborator.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canManageCollaborators && collaborator.role !== 'owner' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(collaborator.id, 'editor')}
                          disabled={collaborator.role === 'editor'}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Make Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(collaborator.id, 'viewer')}
                          disabled={collaborator.role === 'viewer'}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleRemoveCollaborator(collaborator)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      {collaborator.user_id === currentUserId
                        ? 'Leave Project'
                        : 'Remove'
                      }
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {collaboratorToRemove?.user_id === currentUserId
                ? 'Leave Project'
                : 'Remove Collaborator'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {collaboratorToRemove?.user_id === currentUserId
                ? 'Are you sure you want to leave this project? You will lose access to the project files and will need to be re-invited to rejoin.'
                : `Are you sure you want to remove ${
                    collaboratorToRemove?.user_profile?.display_name || 'this user'
                  } from the project? They will lose access to the project files.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCollaborator}
              className="bg-red-600 hover:bg-red-700"
            >
              {collaboratorToRemove?.user_id === currentUserId
                ? 'Leave'
                : 'Remove'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}