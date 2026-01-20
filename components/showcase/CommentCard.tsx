'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

interface CommentCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    parent_id: string | null;
    profiles?: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
  currentUserId?: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
  level?: number;
}

export function CommentCard({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onUpdate,
  level = 0
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const isEdited = comment.updated_at !== comment.created_at;
  const maxDepth = 3; // Limit nesting depth

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const displayName = comment.profiles?.display_name || 'Anonymous';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}`}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8">
              {comment.profiles?.avatar_url && (
                <img
                  src={comment.profiles.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              )}
              <AvatarFallback className="text-xs">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-sm">{displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  {isEdited && ' (edited)'}
                </span>
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Update your comment..."
                    maxLength={1000}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {editContent.length}/1000 characters
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleEdit}
                        disabled={isSubmitting || !editContent.trim()}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-3">
                    {currentUserId && level < maxDepth && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onReply(comment.id)}
                        className="text-xs h-7 px-2"
                      >
                        Reply
                      </Button>
                    )}
                    
                    {isOwner && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="text-xs h-7 px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(comment.id)}
                          className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}