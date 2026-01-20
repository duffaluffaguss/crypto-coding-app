'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExpertBadgeCompact } from './ExpertBadge';
import { formatDistanceToNow } from 'date-fns';
import { Smile, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ExpertLevel } from '@/lib/experts';

const QUICK_REACTIONS = ['👍', '❤️', '🎉', '🚀', '💡', '🔥'];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatMessageProps {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  expertLevel?: ExpertLevel | null;
  topicName?: string;
  reactions?: Reaction[];
  isOwnMessage?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}

export function ChatMessage({
  id,
  content,
  createdAt,
  user,
  expertLevel,
  topicName,
  reactions = [],
  isOwnMessage = false,
  onReact,
  onDelete,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleReaction = (emoji: string) => {
    if (onReact) {
      onReact(id, emoji);
    }
  };

  return (
    <div
      className={`group flex gap-3 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors ${
        isOwnMessage ? 'flex-row-reverse' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.avatarUrl || undefined} />
        <AvatarFallback className="text-xs bg-primary/10">
          {getInitials(user.displayName)}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
          <span className="text-sm font-medium truncate">
            {user.displayName || 'Anonymous'}
          </span>
          {expertLevel && (
            <ExpertBadgeCompact level={expertLevel} topicName={topicName} />
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  reaction.hasReacted
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-muted hover:bg-muted/80 border border-transparent'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className={`flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          showActions ? 'opacity-100' : ''
        }`}
      >
        {/* Quick Reactions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* More Actions */}
        {isOwnMessage && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/**
 * System message for join/leave events
 */
export function ChatSystemMessage({ content }: { content: string }) {
  return (
    <div className="text-center py-2">
      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
        {content}
      </span>
    </div>
  );
}

/**
 * Date separator for message grouping
 */
export function ChatDateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">{date}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
