'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SettingsSection, SettingsItem } from '@/components/settings/SettingsSection';
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { ExportDataButton } from '@/components/settings/ExportDataButton';
import { SocialVerifyButton } from '@/components/verification/SocialVerifyButton';
import { ENSVerifyButton } from '@/components/verification/ENSVerifyButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SettingsContentProps {
  displayName?: string | null;
  email?: string | null;
}

// localStorage keys
const FONT_SIZE_KEY = 'crypto-app-editor-font-size';
const EMAIL_PREFS_KEY = 'crypto-app-email-preferences';

interface EmailPreferences {
  achievements: boolean;
  streak_reminders: boolean;
  weekly_digest: boolean;
}

const defaultEmailPrefs: EmailPreferences = {
  achievements: true,
  streak_reminders: true,
  weekly_digest: true,
};

export function SettingsContent({ displayName, email }: SettingsContentProps) {
  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>(defaultEmailPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    setMounted(true);
    
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }

    const savedEmailPrefs = localStorage.getItem(EMAIL_PREFS_KEY);
    if (savedEmailPrefs) {
      try {
        setEmailPrefs({ ...defaultEmailPrefs, ...JSON.parse(savedEmailPrefs) });
      } catch {
        setEmailPrefs(defaultEmailPrefs);
      }
    }
  }, []);

  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.min(Math.max(newSize, 10), 24);
    setFontSize(clampedSize);
    localStorage.setItem(FONT_SIZE_KEY, clampedSize.toString());
  };

  const handleEmailPrefChange = async (key: keyof EmailPreferences, enabled: boolean) => {
    const newPrefs = { ...emailPrefs, [key]: enabled };
    setEmailPrefs(newPrefs);
    localStorage.setItem(EMAIL_PREFS_KEY, JSON.stringify(newPrefs));
    
    // Also save to profile in database (optional sync)
    setSavingPrefs(true);
    try {
      await fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_preferences: newPrefs }),
      });
    } catch {
      // Silent fail - local storage is the source of truth for now
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <SettingsSection
        title="Profile"
        description="Your account information"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        }
      >
        <div className="space-y-0">
          <SettingsItem
            label="Display Name"
            description="This is how you appear to others"
          >
            <span className="text-sm font-medium">
              {displayName || 'Not set'}
            </span>
          </SettingsItem>
          <SettingsItem
            label="Email"
            description="Your account email (read-only)"
          >
            <span className="text-sm text-muted-foreground">
              {email || 'Not set'}
            </span>
          </SettingsItem>
        </div>
      </SettingsSection>

      {/* Connected Accounts Section */}
      <SettingsSection
        title="Connected Accounts"
        description="Link your social media accounts to verify your identity"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        }
      >
        <div className="space-y-4">
          <SettingsItem
            label="Twitter/X"
            description="Connect your Twitter account to verify your identity"
          >
            <SocialVerifyButton platform="twitter" size="sm" />
          </SettingsItem>
          <SettingsItem
            label="GitHub"
            description="Connect your GitHub account to showcase your coding profile"
          >
            <SocialVerifyButton platform="github" size="sm" />
          </SettingsItem>
          <SettingsItem
            label="Discord"
            description="Connect your Discord account to join our community"
          >
            <SocialVerifyButton platform="discord" size="sm" />
          </SettingsItem>
          <SettingsItem
            label="ENS Name"
            description="Verify ownership of your Ethereum Name Service domain"
          >
            <ENSVerifyButton size="sm" />
          </SettingsItem>
        </div>
      </SettingsSection>

      {/* Theme Customization Section */}
      <SettingsSection
        title="Theme & Appearance"
        description="Customize colors and visual preferences"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"
            />
          </svg>
        }
      >
        <ThemeCustomizer />
      </SettingsSection>

      {/* Editor Preferences Section */}
      <SettingsSection
        title="Editor Preferences"
        description="Customize your coding experience"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        }
      >
        <div className="space-y-0">
          <SettingsItem
            label="Editor Font Size"
            description="Adjust code editor text size (10-24px)"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFontSizeChange(fontSize - 1)}
                disabled={fontSize <= 10}
                className="w-8 h-8 p-0"
              >
                −
              </Button>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10) || 14)}
                min={10}
                max={24}
                className="w-16 text-center h-8"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFontSizeChange(fontSize + 1)}
                disabled={fontSize >= 24}
                className="w-8 h-8 p-0"
              >
                +
              </Button>
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </SettingsItem>
        </div>
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection
        title="Email Notifications"
        description="Choose what emails you'd like to receive"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
      >
        <div className="space-y-0">
          <SettingsItem
            label="Achievement Notifications"
            description="Get notified when you unlock new achievements"
          >
            <Button
              variant={emailPrefs.achievements ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleEmailPrefChange('achievements', !emailPrefs.achievements)}
              disabled={savingPrefs}
              className="w-20"
            >
              {emailPrefs.achievements ? 'On' : 'Off'}
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Streak Reminders"
            description="Receive reminders when your streak is about to expire"
          >
            <Button
              variant={emailPrefs.streak_reminders ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleEmailPrefChange('streak_reminders', !emailPrefs.streak_reminders)}
              disabled={savingPrefs}
              className="w-20"
            >
              {emailPrefs.streak_reminders ? 'On' : 'Off'}
            </Button>
          </SettingsItem>
          <SettingsItem
            label="Weekly Digest"
            description="Get a summary of your weekly progress every Sunday"
          >
            <Button
              variant={emailPrefs.weekly_digest ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleEmailPrefChange('weekly_digest', !emailPrefs.weekly_digest)}
              disabled={savingPrefs}
              className="w-20"
            >
              {emailPrefs.weekly_digest ? 'On' : 'Off'}
            </Button>
          </SettingsItem>
          {savingPrefs && (
            <div className="pt-2 text-xs text-muted-foreground flex items-center gap-2">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving preferences...
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Referrals Section */}
      <SettingsSection
        title="Referrals"
        description="Invite friends and earn rewards"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
      >
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Refer Friends</p>
            <p className="text-xs text-muted-foreground">
              Share your referral link and earn 100 points for each friend who joins
            </p>
          </div>
          <Link href="/referrals">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              View Referrals
            </Button>
          </Link>
        </div>
      </SettingsSection>

      {/* Your Data Section */}
      <SettingsSection
        title="Your Data"
        description="Download or manage your personal data"
        icon={
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Export My Data</p>
              <p className="text-xs text-muted-foreground">
                Download a ZIP file containing all your data
              </p>
            </div>
            <ExportDataButton />
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">What&apos;s included:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Profile information</li>
              <li>All projects and source code files</li>
              <li>Learning progress and completed lessons</li>
              <li>Achievements earned</li>
              <li>AI tutor conversations</li>
              <li>Bookmarks, notifications, and activities</li>
              <li>Account settings and preferences</li>
            </ul>
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions for your account"
        variant="danger"
        icon={
          <svg
            className="w-5 h-5 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        }
      >
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <DeleteAccountModal userEmail={email} />
        </div>
      </SettingsSection>
    </div>
  );
}
