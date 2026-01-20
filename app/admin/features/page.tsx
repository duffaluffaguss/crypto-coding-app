'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Slider
} from '@/components/ui/slider';
import { getAllFeatureFlags, clearFeatureFlagsCache, FeatureFlag } from '@/lib/features';
import { createClient } from '@/lib/supabase/client';
import { 
  Flag, 
  Plus, 
  Save, 
  Trash2, 
  Users, 
  Percent, 
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface EditingFlag extends FeatureFlag {
  isNew?: boolean;
}

export default function AdminFeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlag, setEditingFlag] = useState<EditingFlag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [betaUsersText, setBetaUsersText] = useState('');

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await getAllFeatureFlags();
      setFlags(data);
    } catch (error) {
      console.error('Error loading flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const openEditDialog = (flag?: FeatureFlag) => {
    if (flag) {
      setEditingFlag(flag);
      setBetaUsersText(flag.user_ids.join(', '));
    } else {
      // New flag
      setEditingFlag({
        id: '',
        key: '',
        name: '',
        description: '',
        enabled: false,
        rollout_percentage: 0,
        user_ids: [],
        created_at: '',
        updated_at: '',
        isNew: true
      });
      setBetaUsersText('');
    }
    setIsDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingFlag(null);
    setBetaUsersText('');
    setIsDialogOpen(false);
  };

  const saveFlag = async () => {
    if (!editingFlag) return;

    try {
      const supabase = createClient();
      
      // Parse beta users from text
      const userIds = betaUsersText
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      const flagData = {
        key: editingFlag.key,
        name: editingFlag.name,
        description: editingFlag.description,
        enabled: editingFlag.enabled,
        rollout_percentage: editingFlag.rollout_percentage,
        user_ids: userIds,
      };

      if (editingFlag.isNew) {
        // Create new flag
        const { data, error } = await supabase
          .from('feature_flags')
          .insert([flagData])
          .select()
          .single();

        if (error) throw error;
        toast.success('Feature flag created successfully');
      } else {
        // Update existing flag
        const { data, error } = await supabase
          .from('feature_flags')
          .update(flagData)
          .eq('id', editingFlag.id)
          .select()
          .single();

        if (error) throw error;
        toast.success('Feature flag updated successfully');
      }

      // Clear cache and reload
      clearFeatureFlagsCache();
      await loadFlags();
      closeEditDialog();
    } catch (error) {
      console.error('Error saving flag:', error);
      toast.error('Failed to save feature flag');
    }
  };

  const deleteFlag = async (flagId: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', flagId);

      if (error) throw error;

      toast.success('Feature flag deleted successfully');
      clearFeatureFlagsCache();
      await loadFlags();
    } catch (error) {
      console.error('Error deleting flag:', error);
      toast.error('Failed to delete feature flag');
    }
  };

  const quickToggleFlag = async (flag: FeatureFlag) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: !flag.enabled })
        .eq('id', flag.id);

      if (error) throw error;

      toast.success(`Feature flag ${!flag.enabled ? 'enabled' : 'disabled'}`);
      clearFeatureFlagsCache();
      await loadFlags();
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error('Failed to toggle feature flag');
    }
  };

  const refreshCache = () => {
    clearFeatureFlagsCache();
    loadFlags();
    toast.success('Feature flags cache cleared and reloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground">
            Manage feature rollouts and A/B testing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshCache}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => openEditDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Flag
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5" />
            All Feature Flags ({flags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading feature flags...</div>
          ) : flags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feature flags found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rollout</TableHead>
                  <TableHead>Beta Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flag.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {flag.key}
                        </div>
                        {flag.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {flag.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => quickToggleFlag(flag)}
                          className="p-1"
                        >
                          {flag.enabled ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <Badge
                          variant={flag.enabled ? "default" : "secondary"}
                        >
                          {flag.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Percent className="w-3 h-3" />
                        {flag.rollout_percentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        {flag.user_ids.length} users
                        {flag.user_ids.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Beta
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(flag)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFlag(flag.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFlag?.isNew ? 'Create Feature Flag' : 'Edit Feature Flag'}
            </DialogTitle>
            <DialogDescription>
              Configure feature flag settings and rollout parameters.
            </DialogDescription>
          </DialogHeader>

          {editingFlag && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="key">Flag Key</Label>
                  <Input
                    id="key"
                    value={editingFlag.key}
                    onChange={(e) => setEditingFlag({ ...editingFlag, key: e.target.value })}
                    placeholder="e.g., new_editor"
                    disabled={!editingFlag.isNew}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={editingFlag.name}
                    onChange={(e) => setEditingFlag({ ...editingFlag, name: e.target.value })}
                    placeholder="e.g., New Code Editor"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingFlag.description}
                  onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                  placeholder="Describe what this feature flag controls..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingFlag.enabled}
                    onCheckedChange={(enabled) => setEditingFlag({ ...editingFlag, enabled })}
                  />
                  <Label>Enabled</Label>
                </div>
              </div>

              <div>
                <Label>Rollout Percentage: {editingFlag.rollout_percentage}%</Label>
                <div className="mt-2">
                  <Slider
                    value={[editingFlag.rollout_percentage]}
                    onValueChange={(value) => setEditingFlag({ ...editingFlag, rollout_percentage: value[0] })}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Percentage of users who will see this feature (0-100%)
                </div>
              </div>

              <div>
                <Label htmlFor="betaUsers">Beta Users (User IDs)</Label>
                <Textarea
                  id="betaUsers"
                  value={betaUsersText}
                  onChange={(e) => setBetaUsersText(e.target.value)}
                  placeholder="user-id-1, user-id-2, user-id-3..."
                  rows={3}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Comma-separated list of user IDs who should always see this feature
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeEditDialog}>
                  Cancel
                </Button>
                <Button onClick={saveFlag}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingFlag.isNew ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}