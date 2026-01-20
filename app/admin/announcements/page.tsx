'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  Loader2
} from 'lucide-react';

type AnnouncementType = 'info' | 'warning' | 'success' | 'feature';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

const typeOptions: { value: AnnouncementType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-green-500' },
  { value: 'feature', label: 'Feature', icon: Sparkles, color: 'text-purple-500' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [priority, setPriority] = useState(0);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch');
      const { announcements } = await res.json();
      setAnnouncements(announcements || []);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          type,
          priority,
          starts_at: startsAt || undefined,
          expires_at: expiresAt || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create announcement');
      }

      setSuccess('Announcement created successfully!');
      setTitle('');
      setContent('');
      setType('info');
      setPriority(0);
      setStartsAt('');
      setExpiresAt('');
      fetchAnnouncements();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setSuccess('Announcement deleted');
    } catch {
      setError('Failed to delete announcement');
    }
  }

  const getTypeIcon = (t: AnnouncementType) => {
    const opt = typeOptions.find(o => o.value === t);
    if (!opt) return null;
    const Icon = opt.icon;
    return <Icon className={`w-4 h-4 ${opt.color}`} />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Megaphone className="w-8 h-8" />
          Announcements
        </h1>
        <p className="text-muted-foreground mt-1">
          Create and manage in-app announcements for users
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Announcement content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AnnouncementType)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priority
                    <span className="text-muted-foreground font-normal ml-1">(10+ = modal)</span>
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={e => setPriority(parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Starts At
                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expires At
                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Announcement
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Announcements List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : announcements.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active announcements
              </p>
            ) : (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div
                    key={announcement.id}
                    className="p-4 border border-border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(announcement.type)}
                          <span className="font-medium truncate">{announcement.title}</span>
                          {announcement.priority >= 10 && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                              Modal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Priority: {announcement.priority}</span>
                          {announcement.expires_at && (
                            <span>
                              Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
