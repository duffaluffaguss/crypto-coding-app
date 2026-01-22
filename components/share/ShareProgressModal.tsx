'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

interface UserStats {
  lessonsCompleted: number;
  currentStreak: number;
  achievementPoints: number;
  projectsCreated: number;
  challengesCompleted?: number;
  longestStreak?: number;
}

interface ShareProgressModalProps {
  children: React.ReactNode;
  userId: string;
  userStats: UserStats;
  displayName?: string;
}

export function ShareProgressModal({
  children,
  userId,
  userStats,
  displayName,
}: ShareProgressModalProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Generate shareable text
  const generateShareText = () => {
    const name = displayName || 'I';
    const achievements = [];
    
    if (userStats.lessonsCompleted > 0) {
      achievements.push(`✅ ${userStats.lessonsCompleted} lessons completed`);
    }
    if (userStats.currentStreak > 0) {
      achievements.push(`🔥 ${userStats.currentStreak} day learning streak`);
    }
    if (userStats.projectsCreated > 0) {
      achievements.push(`🚀 ${userStats.projectsCreated} Web3 projects built`);
    }
    if (userStats.achievementPoints > 0) {
      achievements.push(`🏆 ${userStats.achievementPoints} achievement points`);
    }

    const achievementText = achievements.length > 0 
      ? `\n\n${achievements.join('\n')}`
      : '';

    return `${name === 'I' ? "I'm" : `${name} is`} building the future with Web3! 🌟${achievementText}\n\nJoin me on Zero to Crypto Dev 👇`;
  };

  // Generate share URL
  const shareUrl = `${window.location.origin}/share/progress/${userId}`;

  // Share to Twitter/X
  const shareToTwitter = async () => {
    setIsSharing(true);
    try {
      const text = generateShareText();
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      
      // Track share
      await fetch('/api/profile/share-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'twitter', userId }),
      }).catch(() => {}); // Ignore tracking errors
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share to Twitter/X',
        variant: 'destructive',
      });
    }
    setIsSharing(false);
  };

  // Share to LinkedIn
  const shareToLinkedIn = async () => {
    setIsSharing(true);
    try {
      const text = generateShareText();
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(text)}`;
      window.open(linkedInUrl, '_blank', 'width=550,height=420');
      
      // Track share
      await fetch('/api/profile/share-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'linkedin', userId }),
      }).catch(() => {});
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share to LinkedIn',
        variant: 'destructive',
      });
    }
    setIsSharing(false);
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
      
      // Track copy
      await fetch('/api/profile/share-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'copy_link', userId }),
      }).catch(() => {});
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  // Generate and share image
  const generateShareImage = async () => {
    setIsGeneratingImage(true);
    try {
      // Generate OG image with current stats
      const ogImageUrl = `${window.location.origin}/api/og/progress?userId=${userId}&t=${Date.now()}`;
      
      // Open image in new tab for download/sharing
      window.open(ogImageUrl, '_blank');
      
      toast({
        title: 'Image generated!',
        description: 'Your progress card opened in a new tab',
      });
      
      // Track image generation
      await fetch('/api/profile/share-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'image', userId }),
      }).catch(() => {});
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive',
      });
    }
    setIsGeneratingImage(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>📤</span>
            Share Your Progress
          </DialogTitle>
          <DialogDescription>
            Show off your Web3 learning journey with the community!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Preview */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border">
            <h3 className="font-semibold mb-3">Your Web3 Journey 🌟</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span>📚</span>
                <span>{userStats.lessonsCompleted} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔥</span>
                <span>{userStats.currentStreak} Day Streak</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span>{userStats.projectsCreated} Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏆</span>
                <span>{userStats.achievementPoints} Points</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Share Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Share on social media</h4>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={shareToTwitter}
                disabled={isSharing}
                className="w-full justify-start gap-3"
                variant="outline"
              >
                <div className="w-5 h-5 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-xs">𝕏</span>
                </div>
                Share on Twitter/X
              </Button>

              <Button
                onClick={shareToLinkedIn}
                disabled={isSharing}
                className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                variant="outline"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </Button>
            </div>

            <Separator />

            <h4 className="font-medium text-sm">Other options</h4>
            
            <div className="flex flex-col gap-2">
              <Button
                onClick={copyLink}
                className="w-full justify-start gap-3"
                variant="outline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Share Link
              </Button>

              <Button
                onClick={generateShareImage}
                disabled={isGeneratingImage}
                className="w-full justify-start gap-3"
                variant="outline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isGeneratingImage ? 'Generating...' : 'Generate Progress Card'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}