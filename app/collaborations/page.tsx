import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Clock, MessageCircle, Lightbulb, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { CollabActionButtons } from './CollabActionButtons';

interface CollabRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  project_idea: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_profile?: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
  to_profile?: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  };
}

export default async function CollaborationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch incoming requests (requests TO this user)
  const { data: incomingRequests } = await supabase
    .from('collab_requests')
    .select(`
      *,
      from_profile:from_user_id(username, avatar_url, display_name)
    `)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch sent requests (requests FROM this user)
  const { data: sentRequests } = await supabase
    .from('collab_requests')
    .select(`
      *,
      to_profile:to_user_id(username, avatar_url, display_name)
    `)
    .eq('from_user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch active collaborations (accepted requests)
  const { data: activeCollabs } = await supabase
    .from('collab_requests')
    .select(`
      *,
      from_profile:from_user_id(username, avatar_url, display_name),
      to_profile:to_user_id(username, avatar_url, display_name)
    `)
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Collaborations</h1>
        <p className="text-muted-foreground">
          Manage your collaboration requests and active partnerships
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* Incoming Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Incoming Requests
              {incomingRequests && incomingRequests.length > 0 && (
                <Badge variant="secondary">{incomingRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!incomingRequests || incomingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} type="incoming" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sent Requests
              {sentRequests && sentRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="outline">{sentRequests.filter(r => r.status === 'pending').length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!sentRequests || sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No requests sent</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <RequestCard key={request.id} request={request} type="sent" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Collaborations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Active Collaborations
            {activeCollabs && activeCollabs.length > 0 && (
              <Badge variant="default">{activeCollabs.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeCollabs || activeCollabs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active collaborations</p>
              <p className="text-sm mt-2">Start connecting with other builders!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeCollabs.map((request) => (
                <CollabCard key={request.id} request={request} currentUserId={user.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RequestCard({ request, type }: { request: CollabRequest; type: 'incoming' | 'sent' }) {
  const profile = type === 'incoming' ? request.from_profile : request.to_profile;
  const otherUserId = type === 'incoming' ? request.from_user_id : request.to_user_id;

  if (!profile) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${otherUserId}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link 
              href={`/profile/${otherUserId}`}
              className="font-medium hover:underline"
            >
              {profile.display_name || profile.username}
            </Link>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Project Idea</p>
            <p className="text-sm text-muted-foreground">{request.project_idea}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MessageCircle className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Message</p>
            <p className="text-sm text-muted-foreground">{request.message}</p>
          </div>
        </div>
      </div>

      {type === 'incoming' && request.status === 'pending' && (
        <CollabActionButtons requestId={request.id} />
      )}
    </div>
  );
}

function CollabCard({ request, currentUserId }: { request: CollabRequest; currentUserId: string }) {
  const isFromCurrentUser = request.from_user_id === currentUserId;
  const otherProfile = isFromCurrentUser ? request.to_profile : request.from_profile;
  const otherUserId = isFromCurrentUser ? request.to_user_id : request.from_user_id;

  if (!otherProfile) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${otherUserId}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherProfile.avatar_url || undefined} />
            <AvatarFallback>
              {(otherProfile.display_name || otherProfile.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link 
            href={`/profile/${otherUserId}`}
            className="font-medium hover:underline"
          >
            {otherProfile.display_name || otherProfile.username}
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Started {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Active
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Project</p>
            <p className="text-sm text-muted-foreground">{request.project_idea}</p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/profile/${otherUserId}`}>
            View Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'accepted':
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <Check className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    case 'declined':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <X className="h-3 w-3 mr-1" />
          Declined
        </Badge>
      );
    default:
      return null;
  }
}