'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { SettingsSection, SettingsItem } from '@/components/settings/SettingsSection';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SettingsContentProps {
  displayName?: string | null;
  email?: string | null;
}

// localStorage keys
const FONT_SIZE_KEY = 'crypto-app-editor-font-size';
const NOTIFICATIONS_KEY = 'crypto-app-email-notifications';

export function SettingsContent({ displayName, email }: SettingsContentProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    setMounted(true);
    
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }

    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications !== null) {
      setEmailNotifications(savedNotifications === 'true');
    }
  }, []);

  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.min(Math.max(newSize, 10), 24);
    setFontSize(clampedSize);
    localStorage.setItem(FONT_SIZE_KEY, clampedSize.toString());
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setEmailNotifications(enabled);
    localStorage.setItem(NOTIFICATIONS_KEY, enabled.toString());
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

      {/* Preferences Section */}
      <SettingsSection
        title="Preferences"
        description="Customize your experience"
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        }
      >
        <div className="space-y-0">
          <SettingsItem
            label="Theme"
            description="Choose your preferred color scheme"
          >
            <div className="flex gap-1">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="w-20"
              >
                ☀️ Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="w-20"
              >
                🌙 Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="w-24"
              >
                💻 System
              </Button>
            </div>
          </SettingsItem>
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
        title="Notifications"
        description="Manage how we contact you"
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        }
      >
        <div className="space-y-0">
          <SettingsItem
            label="Email Notifications"
            description="Receive updates about new features and achievements"
          >
            <Button
              variant={emailNotifications ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleNotificationsChange(!emailNotifications)}
              className="w-20"
            >
              {emailNotifications ? 'On' : 'Off'}
            </Button>
          </SettingsItem>
          <div className="pt-2 text-xs text-muted-foreground italic">
            Note: Email notifications are coming soon
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
