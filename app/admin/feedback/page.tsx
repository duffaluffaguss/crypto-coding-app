'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Search,
  Bug,
  Lightbulb,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Calendar,
  Link2,
  User,
} from 'lucide-react';

type FeedbackStatus = 'new' | 'reviewing' | 'resolved';
type FeedbackType = 'bug' | 'feature' | 'general';

interface Feedback {
  id: string;
  user_id: string | null;
  type: FeedbackType;
  message: string;
  page_url: string | null;
  status: FeedbackStatus;
  created_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

const statusOptions: { value: FeedbackStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'new', label: 'New', color: 'bg-orange-500', icon: <AlertTriangle className="w-4 h-4" /> },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> },
];

const typeOptions: { value: FeedbackType | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Types', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'bug', label: 'Bug', icon: <Bug className="w-4 h-4" /> },
  { value: 'feature', label: 'Feature', icon: <Lightbulb className="w-4 h-4" /> },
  { value: 'general', label: 'General', icon: <MessageCircle className="w-4 h-4" /> },
];

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ new: 0, reviewing: 0, resolved: 0 });

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = '/dashboard';
          return;
        }
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback || []);
      setStats(data.stats || { new: 0, reviewing: 0, resolved: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: string, newStatus: FeedbackStatus) => {
    try {
      setUpdatingId(id);
      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local state
      setFeedback(prev =>
        prev.map(f => (f.id === id ? { ...f, status: newStatus } : f))
      );
      
      // Update stats
      const oldItem = feedback.find(f => f.id === id);
      if (oldItem) {
        setStats(prev => ({
          ...prev,
          [oldItem.status]: prev[oldItem.status as keyof typeof prev] - 1,
          [newStatus]: prev[newStatus as keyof typeof prev] + 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'feature':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case 'new':
        return 'bg-orange-500';
      case 'reviewing':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="w-8 h-8" />
          Feedback Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage user feedback
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statusOptions.map(option => (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all ${
              statusFilter === option.value ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === option.value ? 'all' : option.value)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${option.color}`} />
              <div>
                <p className="text-2xl font-bold">{stats[option.value]}</p>
                <p className="text-sm text-muted-foreground">{option.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
                  className="pl-9 pr-8 py-2 bg-background border border-input rounded-lg text-sm appearance-none cursor-pointer hover:bg-muted transition-colors"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Feedback ({feedback.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchFeedback}
                className="mt-4 text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No feedback found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getTypeColor(
                            item.type
                          )}`}
                        >
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.status}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm whitespace-pre-wrap">{item.message}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {item.profiles && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.profiles.display_name || item.profiles.email || 'Anonymous'}
                          </span>
                        )}
                        {!item.profiles && item.user_id && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            User
                          </span>
                        )}
                        {!item.user_id && (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <User className="w-3 h-3" />
                            Anonymous
                          </span>
                        )}
                        {item.page_url && (
                          <span className="flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {item.page_url}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="flex flex-col gap-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateStatus(item.id, option.value)}
                          disabled={updatingId === item.id || item.status === option.value}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            item.status === option.value
                              ? `${option.color} text-white`
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          } disabled:opacity-50`}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
