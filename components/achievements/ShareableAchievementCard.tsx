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

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface ShareableAchievementCardProps {
  children: React.ReactNode;
  achievement: Achievement;
  userId: string;
  displayName?: string;
}

export function ShareableAchievementCard({
  children,
  achievement,
  userId,
  displayName,
}: ShareableAchievementCardProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Generate shareable text for achievement
  const generateShareText = () => {
    const name = displayName || 'I';
    return `🎉 ${name === 'I' ? 'I just' : `${name} just`} unlocked the "${achievement.name}" achievement on Zero to Crypto Dev! ${achievement.icon}\\n\\n${achievement.description}\\n\\n+${achievement.points} points earned! 🏆\\n\\nJoin me in learning Web3 development 👇`;
  };

  // Generate share URL - achievement detail page
  const shareUrl = `${window.location.origin}/share/progress/${userId}?achievement=${achievement.id}`;

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
        body: JSON.stringify({ platform: 'twitter_achievement', userId, achievementId: achievement.id }),
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
        body: JSON.stringify({ platform: 'linkedin_achievement', userId, achievementId: achievement.id }),
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
        description: 'Achievement link copied to clipboard',
      });
      
      // Track copy
      await fetch('/api/profile/share-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'copy_achievement', userId, achievementId: achievement.id }),
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
      // Generate OG image with achievement details
      const ogImageUrl = `${window.location.origin}/api/og/achievement?userId=${userId}&achievementId=${achievement.id}&t=${Date.now()}`;
      
      // Open image in new tab for download/sharing
      window.open(ogImageUrl, '_blank');
      
      toast({
        title: 'Image generated!',
        description: 'Your achievement card opened in a new tab',
      });
      
      // Track image generation
      await fetch('/api/profile/share-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/JSON' },
        body: JSON.stringify({ platform: 'image_achievement', userId, achievementId: achievement.id }),
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
            <span>🎉</span>
            Share Achievement
          </DialogTitle>
          <DialogDescription>
            Celebrate your achievement with the community!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Achievement Preview */}
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full text-4xl shadow-lg">
                {achievement.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{achievement.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {achievement.description}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full text-white text-sm font-medium">
                <span>🏆</span>
                +{achievement.points} points
              </div>
            </div>
          </div>

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
                {isGeneratingImage ? 'Generating...' : 'Generate Achievement Card'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}