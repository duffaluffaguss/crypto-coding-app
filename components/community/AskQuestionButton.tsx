'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface AskQuestionButtonProps {
  communitySlug: string;
  isMember: boolean;
  className?: string;
}

export function AskQuestionButton({ 
  communitySlug, 
  isMember, 
  className = "" 
}: AskQuestionButtonProps) {
  if (!isMember) {
    return (
      <Button disabled variant="outline" className={className}>
        <HelpCircle className="h-4 w-4 mr-2" />
        Join to Ask
      </Button>
    );
  }

  return (
    <Link href={`/community/${communitySlug}/ask`}>
      <Button variant="outline" className={className}>
        <HelpCircle className="h-4 w-4 mr-2" />
        Ask Question
      </Button>
    </Link>
  );
}