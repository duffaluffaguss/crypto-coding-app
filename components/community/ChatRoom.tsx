'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage, ChatDateSeparator } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  HelpCircle, 
  Sparkles,
  Hash,
  Users,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';
import type { ExpertLevel } from '@/lib/experts';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatRoom {
  id: string;
  name: string;
  type: 'general' | 'help' | 'showcase';
  description: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
}

interface ChatRoomProps {
  communityId: string;
  communityName: string;
  topicName?: string;
  currentUserId?: string;
  isMember: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ROOM_ICONS = {
  general: Hash,
  help: HelpCircle,
  showcase: Sparkles,
};

export function ChatRoom({
  communityId,
  communityName,
  topicName,
  currentUserId,
  isMember,
  isCollapsed = false,
  onToggleCollapse,
}: ChatRoomProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Fetch chat rooms
  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('community_id', communityId)
        .order('type');

      if (error) {
        console.error('Error fetching chat rooms:', error);
        return;
      }

      setRooms(data || []);
      // Default to help room if exists, otherwise first room
      const helpRoom = data?.find(r => r.type === 'help');
      setActiveRoom(helpRoom || data?.[0] || null);
    }

    fetchRooms();
  }, [communityId, supabase]);

  // Fetch messages for active room
  const fetchMessages = useCallback(async () => {
    if (!activeRoom) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('room_id', activeRoom.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  }, [activeRoom, supabase]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up realtime subscription
  useEffect(() => {
    if (!activeRoom) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom.id}`,
        },
        async (payload) => {
          // Fetch full message with profile
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles:user_id (
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          await channel.track({ user_id: currentUserId });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [activeRoom, currentUserId, supabase]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !currentUserId || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: activeRoom.id,
        user_id: currentUserId,
        content,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(content); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) {
      toast.error('Please sign in to react');
      return;
    }

    try {
      // Check if already reacted
      const { data: existing } = await supabase
        .from('chat_message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('chat_message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase.from('chat_message_reactions').insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // Handle delete
  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Format date for separators
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>(
    (groups, message) => {
      const date = formatDateHeader(message.created_at);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date, messages: [message] });
      }

      return groups;
    },
    []
  );

  if (isCollapsed) {
    return (
      <Card className="w-12 h-full flex flex-col items-center py-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        {onlineCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1">
            {onlineCount}
          </Badge>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px] w-full max-w-[350px]">
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            {onlineCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                {onlineCount}
              </Badge>
            )}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Room Tabs */}
        {rooms.length > 1 && (
          <Tabs
            value={activeRoom?.id}
            onValueChange={(id) => setActiveRoom(rooms.find((r) => r.id === id) || null)}
            className="mt-2"
          >
            <TabsList className="h-8 p-1">
              {rooms.map((room) => {
                const Icon = ROOM_ICONS[room.type];
                return (
                  <TabsTrigger
                    key={room.id}
                    value={room.id}
                    className="text-xs h-6 px-2 gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {room.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isMember
                ? 'Start the conversation!'
                : 'Join to participate in chat'}
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <ChatDateSeparator date={group.date} />
                {group.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    createdAt={message.created_at}
                    user={{
                      id: message.user_id,
                      displayName: message.profiles?.display_name || null,
                      avatarUrl: message.profiles?.avatar_url || null,
                    }}
                    topicName={topicName}
                    isOwnMessage={message.user_id === currentUserId}
                    onReact={handleReaction}
                    onDelete={
                      message.user_id === currentUserId ? handleDelete : undefined
                    }
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <CardContent className="p-3 border-t">
        {isMember ? (
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Message #${activeRoom?.name.toLowerCase() || 'chat'}...`}
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Join the community to chat
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Floating chat button for mobile
 */
export function ChatFloatingButton({
  unreadCount = 0,
  onClick,
}: {
  unreadCount?: number;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg lg:hidden"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
