'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CollaboratorInvite, Profile, CollaboratorRole } from '@/types';

interface InviteCollaboratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onInviteSent: () => void;
}

interface SearchResult extends Profile {
  email?: string;
}

export default function InviteCollaboratorModal({
  open,
  onOpenChange,
  projectId,
  onInviteSent,
}: InviteCollaboratorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<Exclude<CollaboratorRole, 'owner'>>('viewer');
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const supabase = createClientComponentClient();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search by username/display_name or email
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(
          `display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,github_username.ilike.%${searchQuery}%`
        )
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        toast.error('Failed to search users');
        return;
      }

      setSearchResults(profiles || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) return;

    setIsInviting(true);
    try {
      const invite: CollaboratorInvite = {
        project_id: projectId,
        user_id: selectedUser.id,
        role: selectedRole,
      };

      const response = await fetch('/api/collaborators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invite),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${selectedUser.display_name || selectedUser.email}`);
      onInviteSent();
      onOpenChange(false);
      
      // Reset form
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRole('viewer');
    } catch (error) {
      console.error('Invitation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleIcon = (role: CollaboratorRole) => {
    switch (role) {
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '👁️';
    }
  };

  const getRoleDescription = (role: CollaboratorRole) => {
    switch (role) {
      case 'editor':
        return 'Can edit code, files, and project settings';
      case 'viewer':
        return 'Can view code and files, cannot edit';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Collaborator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label htmlFor="search">Find User</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                size="icon"
                variant="outline"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {(user.display_name || user.email || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.display_name || 'No name'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.github_username ? `@${user.github_username}` : user.email}
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-md">
              No users found matching "{searchQuery}"
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
              <Label>Selected User</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback>
                    {(selectedUser.display_name || selectedUser.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {selectedUser.display_name || 'No name'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedUser.github_username ? `@${selectedUser.github_username}` : selectedUser.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="role">Collaborator Role</Label>
              <Select value={selectedRole} onValueChange={(value: Exclude<CollaboratorRole, 'owner'>) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <span>{getRoleIcon('editor')}</span>
                      <div className="flex flex-col">
                        <span>Editor</span>
                        <span className="text-xs text-gray-500">
                          {getRoleDescription('editor')}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <span>{getRoleIcon('viewer')}</span>
                      <div className="flex flex-col">
                        <span>Viewer</span>
                        <span className="text-xs text-gray-500">
                          {getRoleDescription('viewer')}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!selectedUser || isInviting}
          >
            {isInviting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}