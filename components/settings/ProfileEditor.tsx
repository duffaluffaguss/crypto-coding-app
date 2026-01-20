'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, ExternalLink, Twitter, Github, MessageCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  display_name?: string | null;
  bio?: string | null;
  website_url?: string | null;
  twitter_handle?: string | null;
  github_username?: string | null;
  discord_username?: string | null;
  avatar_url?: string | null;
}

interface ProfileEditorProps {
  userId: string;
  initialData?: ProfileData;
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

export function ProfileEditor({ userId, initialData }: ProfileEditorProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: initialData?.display_name || '',
    bio: initialData?.bio || '',
    website_url: initialData?.website_url || '',
    twitter_handle: initialData?.twitter_handle || '',
    github_username: initialData?.github_username || '',
    discord_username: initialData?.discord_username || '',
    avatar_url: initialData?.avatar_url || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const supabase = createClient();

  // Track changes
  useEffect(() => {
    const hasChanged = Object.keys(profileData).some(key => {
      const currentValue = profileData[key as keyof ProfileData];
      const initialValue = initialData?.[key as keyof ProfileData];
      return currentValue !== (initialValue || '');
    });
    setHasChanges(hasChanged);
  }, [profileData, initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const displayName = profileData.display_name?.trim();
    if (!displayName) {
      newErrors.display_name = 'Display name is required';
    } else if (displayName.length > 50) {
      newErrors.display_name = 'Display name must be 50 characters or less';
    }

    const bio = profileData.bio || '';
    if (bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    if (profileData.website_url && !validateUrl(profileData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL';
    }

    if (profileData.twitter_handle && !validateTwitterHandle(profileData.twitter_handle)) {
      newErrors.twitter_handle = 'Invalid Twitter handle';
    }

    if (profileData.github_username && !validateGithubUsername(profileData.github_username)) {
      newErrors.github_username = 'Invalid GitHub username';
    }

    if (profileData.discord_username && !validateDiscordUsername(profileData.discord_username)) {
      newErrors.discord_username = 'Invalid Discord username';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);

    const updateData = Object.fromEntries(
      Object.entries(profileData).map(([key, value]) => [
        key,
        value?.trim() || null
      ])
    );

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      toast.error('Failed to update profile');
      setErrors({ form: 'Failed to save changes. Please try again.' });
    } else {
      toast.success('Profile updated successfully');
      setHasChanges(false);
    }

    setIsSaving(false);
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Manage your public profile and connect your social accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profileData.avatar_url || ''} />
            <AvatarFallback className="text-lg">
              {profileData.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium">Profile Photo</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upload a custom avatar or use your default image
            </p>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Avatar upload coming soon
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name *</Label>
          <Input
            id="display_name"
            value={profileData.display_name || ''}
            onChange={(e) => updateField('display_name', e.target.value)}
            placeholder="Your display name"
            maxLength={50}
            className={errors.display_name ? 'border-destructive' : ''}
          />
          <div className="flex justify-between">
            {errors.display_name ? (
              <p className="text-sm text-destructive">{errors.display_name}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">
              {(profileData.display_name || '').length}/50
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profileData.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder="Tell others about yourself..."
            maxLength={500}
            rows={4}
            className={`resize-none ${errors.bio ? 'border-destructive' : ''}`}
          />
          <div className="flex justify-between">
            {errors.bio ? (
              <p className="text-sm text-destructive">{errors.bio}</p>
            ) : (
              <span />
            )}
            <p className={`text-xs ${
              (profileData.bio || '').length > 450 
                ? 'text-yellow-500' 
                : 'text-muted-foreground'
            } ${(profileData.bio || '').length >= 500 ? 'text-destructive' : ''}`}>
              {(profileData.bio || '').length}/500
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Social Links</Label>
          
          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website_url" className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website_url"
              type="url"
              value={profileData.website_url || ''}
              onChange={(e) => updateField('website_url', e.target.value)}
              placeholder="https://yourwebsite.com"
              className={errors.website_url ? 'border-destructive' : ''}
            />
            {errors.website_url && (
              <p className="text-sm text-destructive">{errors.website_url}</p>
            )}
          </div>

          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="twitter_handle" className="flex items-center gap-2 text-sm">
              <Twitter className="h-4 w-4" />
              Twitter / X
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="twitter_handle"
                value={profileData.twitter_handle || ''}
                onChange={(e) => updateField('twitter_handle', e.target.value.replace(/^@/, ''))}
                placeholder="username"
                maxLength={15}
                className={`pl-8 ${errors.twitter_handle ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.twitter_handle && (
              <p className="text-sm text-destructive">{errors.twitter_handle}</p>
            )}
          </div>

          {/* GitHub */}
          <div className="space-y-2">
            <Label htmlFor="github_username" className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4" />
              GitHub
            </Label>
            <Input
              id="github_username"
              value={profileData.github_username || ''}
              onChange={(e) => updateField('github_username', e.target.value)}
              placeholder="username"
              maxLength={39}
              className={errors.github_username ? 'border-destructive' : ''}
            />
            {errors.github_username && (
              <p className="text-sm text-destructive">{errors.github_username}</p>
            )}
          </div>

          {/* Discord */}
          <div className="space-y-2">
            <Label htmlFor="discord_username" className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              Discord
            </Label>
            <Input
              id="discord_username"
              value={profileData.discord_username || ''}
              onChange={(e) => updateField('discord_username', e.target.value)}
              placeholder="username"
              maxLength={32}
              className={errors.discord_username ? 'border-destructive' : ''}
            />
            {errors.discord_username && (
              <p className="text-sm text-destructive">{errors.discord_username}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Display name or username
            </p>
          </div>
        </div>

        {/* Profile Preview */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Profile Preview</Label>
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profileData.avatar_url || ''} />
                <AvatarFallback>
                  {profileData.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">
                  {profileData.display_name || 'Your Name'}
                </h4>
                {profileData.bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {profileData.bio}
                  </p>
                )}
                {/* Social Links Preview */}
                {(profileData.website_url || profileData.twitter_handle || profileData.github_username || profileData.discord_username) && (
                  <div className="flex gap-2 mt-2">
                    {profileData.website_url && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    )}
                    {profileData.twitter_handle && (
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                    )}
                    {profileData.github_username && (
                      <Github className="h-4 w-4 text-muted-foreground" />
                    )}
                    {profileData.discord_username && (
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Form Errors */}
        {errors.form && (
          <p className="text-sm text-destructive text-center">{errors.form}</p>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving ? (
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
      </CardContent>
    </Card>
  );
}