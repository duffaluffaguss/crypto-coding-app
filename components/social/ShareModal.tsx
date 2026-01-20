'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShareButtons, type ShareData } from './ShareButtons';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  shareData: ShareData;
  previewImage?: string;
  previewTitle?: string;
  previewDescription?: string;
  trigger?: React.ReactNode;
  className?: string;
  onShare?: (platform: string) => void;
}

export function ShareModal({
  shareData,
  previewImage,
  previewTitle,
  previewDescription,
  trigger,
  className,
  onShare,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState(shareData.text);

  const handleShare = useCallback((platform: string) => {
    onShare?.(platform);
    // Optionally close modal after share
    // setOpen(false);
  }, [onShare]);

  // Create modified share data with custom message
  const currentShareData: ShareData = {
    ...shareData,
    text: customMessage,
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      Share
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Share this with your network
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
            {previewImage && (
              <div className="aspect-[1.91/1] relative bg-muted">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <p className="font-medium text-sm truncate">
                {previewTitle || shareData.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {previewDescription || shareData.text}
              </p>
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {shareData.url}
              </p>
            </div>
          </div>

          {/* Custom Message Input */}
          <div className="space-y-2">
            <label htmlFor="share-message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="share-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Add a message..."
              maxLength={280}
            />
            <p className="text-xs text-muted-foreground text-right">
              {customMessage.length}/280
            </p>
          </div>

          {/* Share Buttons */}
          <div className="pt-2">
            <p className="text-sm font-medium mb-3">Share to</p>
            <ShareButtons
              shareData={currentShareData}
              variant="default"
              onShare={handleShare}
              className="justify-center"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simpler inline share button that opens the modal
export function ShareButton({
  shareData,
  previewImage,
  previewTitle,
  previewDescription,
  variant = 'outline',
  size = 'default',
  className,
  onShare,
}: ShareModalProps & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}) {
  const trigger = (
    <Button variant={variant} size={size} className={cn('gap-2', className)}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      {size !== 'icon' && <span>Share</span>}
    </Button>
  );

  return (
    <ShareModal
      shareData={shareData}
      previewImage={previewImage}
      previewTitle={previewTitle}
      previewDescription={previewDescription}
      trigger={trigger}
      onShare={onShare}
    />
  );
}
