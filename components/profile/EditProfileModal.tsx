'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProfileData {
  display_name?: string | null;
  bio?: string | null;
  website_url?: string | null;
  twitter_handle?: string | null;
  github_username?: string | null;
  discord_username?: string | null;
}

interface EditProfileModalProps {
  currentDisplayName?: string | null;
  currentBio?: string | null;
  currentWebsiteUrl?: string | null;
  currentTwitterHandle?: string | null;
  currentGithubUsername?: string | null;
  currentDiscordUsername?: string | null;
  userId: string;
  onUpdate?: (data: ProfileData) => void;
  trigger?: React.ReactNode;
}

// Validation helpers
function validateUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateTwitterHandle(handle: string): boolean {
  if (!handle) return true;
  return /^[a-zA-Z0-9_]{1,15}$/.test(handle);
}

function validateGithubUsername(username: string): boolean {
  if (!username) return true;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username);
}

function validateDiscordUsername(username: string): boolean {
  if (!username) return true;
  return /^[a-zA-Z0-9._-]{2,32}$/.test(username);
}

export function EditProfileModal({
  currentDisplayName,
  currentBio,
  currentWebsiteUrl,
  currentTwitterHandle,
  currentGithubUsername,
  currentDiscordUsername,
  userId,
  onUpdate,
  trigger,
}: EditProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [bio, setBio] = useState(currentBio || '');
  const [websiteUrl, setWebsiteUrl] = useState(currentWebsiteUrl || '');
  const [twitterHandle, setTwitterHandle] = useState(currentTwitterHandle || '');
  const [githubUsername, setGithubUsername] = useState(currentGithubUsername || '');
  const [discordUsername, setDiscordUsername] = useState(currentDiscordUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const supabase = createClient();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setDisplayName(currentDisplayName || '');
      setBio(currentBio || '');
      setWebsiteUrl(currentWebsiteUrl || '');
      setTwitterHandle(currentTwitterHandle || '');
      setGithubUsername(currentGithubUsername || '');
      setDiscordUsername(currentDiscordUsername || '');
      setErrors({});
    }
  }, [open, currentDisplayName, currentBio, currentWebsiteUrl, currentTwitterHandle, currentGithubUsername, currentDiscordUsername]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      newErrors.displayName = 'Display name cannot be empty';
    } else if (trimmedName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less';
    }

    if (bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    if (websiteUrl && !validateUrl(websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL (e.g., https://example.com)';
    }

    if (twitterHandle && !validateTwitterHandle(twitterHandle)) {
      newErrors.twitterHandle = 'Invalid Twitter handle (letters, numbers, underscores only, max 15 chars)';
    }

    if (githubUsername && !validateGithubUsername(githubUsername)) {
      newErrors.githubUsername = 'Invalid GitHub username';
    }

    if (discordUsername && !validateDiscordUsername(discordUsername)) {
      newErrors.discordUsername = 'Invalid Discord username (letters, numbers, periods, underscores, hyphens, 2-32 chars)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const updateData: ProfileData = {
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      website_url: websiteUrl.trim() || null,
      twitter_handle: twitterHandle.trim() || null,
      github_username: githubUsername.trim() || null,
      discord_username: discordUsername.trim() || null,
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      setErrors({ form: 'Failed to update profile. Please try again.' });
      setIsLoading(false);
      return;
    }

    onUpdate?.(updateData);
    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Customize your profile to show off your personality and connect with others.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                maxLength={50}
                autoFocus
              />
              <div className="flex justify-between">
                {errors.displayName ? (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {displayName.length}/50
                </p>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-between">
                {errors.bio ? (
                  <p className="text-sm text-destructive">{errors.bio}</p>
                ) : (
                  <span />
                )}
                <p className={`text-xs ${bio.length > 450 ? 'text-yellow-500' : 'text-muted-foreground'} ${bio.length >= 500 ? 'text-destructive' : ''}`}>
                  {bio.length}/500
                </p>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Social Links</Label>
              
              {/* Website URL */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <Input
                    id="websiteUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="pl-10"
                  />
                </div>
                {errors.websiteUrl && (
                  <p className="text-sm text-destructive">{errors.websiteUrl}</p>
                )}
              </div>

              {/* Twitter Handle */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <Input
                    id="twitterHandle"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ''))}
                    placeholder="username"
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
                {errors.twitterHandle && (
                  <p className="text-sm text-destructive">{errors.twitterHandle}</p>
                )}
                <p className="text-xs text-muted-foreground">Without the @ symbol</p>
              </div>

              {/* GitHub Username */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <Input
                    id="githubUsername"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="username"
                    className="pl-10"
                    maxLength={39}
                  />
                </div>
                {errors.githubUsername && (
                  <p className="text-sm text-destructive">{errors.githubUsername}</p>
                )}
              </div>

              {/* Discord Username */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <Input
                    id="discordUsername"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder="username"
                    className="pl-10"
                    maxLength={32}
                  />
                </div>
                {errors.discordUsername && (
                  <p className="text-sm text-destructive">{errors.discordUsername}</p>
                )}
                <p className="text-xs text-muted-foreground">Display name or username</p>
              </div>
            </div>

            {/* Form-level error */}
            {errors.form && (
              <p className="text-sm text-destructive text-center">{errors.form}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
