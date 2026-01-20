import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  ArrowUp, 
  CheckCircle, 
  BookOpen,
  Clock,
  User 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Discussion {
  id: string;
  title: string;
  content: string;
  lesson_id: string | null;
  is_question: boolean;
  is_answered: boolean;
  upvotes: number;
  created_at: string;
  author_id: string;
  profiles?: {
    display_name: string | null;
  } | null;
  lessons?: {
    id: string;
    title: string;
    order: number;
  } | null;
  reply_count?: number;
}

interface DiscussionCardProps {
  discussion: Discussion;
  communitySlug: string;
  showCommunity?: boolean;
  className?: string;
}

export function DiscussionCard({ 
  discussion, 
  communitySlug, 
  showCommunity = false,
  className = "" 
}: DiscussionCardProps) {
  // Truncate content for preview
  const truncatedContent = discussion.content.length > 150 
    ? discussion.content.substring(0, 150) + '...'
    : discussion.content;

  // Remove markdown formatting for preview
  const cleanContent = truncatedContent
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace links with text

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <Link href={`/community/${communitySlug}/discussion/${discussion.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold leading-tight hover:text-primary transition-colors line-clamp-2">
                {discussion.title}
              </CardTitle>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {discussion.profiles?.display_name || 'Anonymous'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {discussion.is_question && (
                <Badge 
                  variant={discussion.is_answered ? "default" : "secondary"}
                  className={`text-xs ${discussion.is_answered ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {discussion.is_answered ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Answered</>
                  ) : (
                    'Question'
                  )}
                </Badge>
              )}
              {discussion.lessons && (
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  L{discussion.lessons.order}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm line-clamp-3 mb-4">
            {cleanContent}
          </CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                {discussion.upvotes}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {discussion.reply_count || 0}
              </div>
            </div>
            {showCommunity && (
              <Badge variant="secondary" className="text-xs">
                {communitySlug}
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}