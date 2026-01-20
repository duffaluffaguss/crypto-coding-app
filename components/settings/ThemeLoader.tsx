'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  presetThemes, 
  applyTheme, 
  applyCustomPrimaryColor, 
  getCurrentTheme 
} from '@/lib/themes';

export function ThemeLoader() {
  const { theme: systemTheme, setTheme } = useTheme();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Load theme preference from localStorage
    const { themeId, mode, customPrimary } = getCurrentTheme();
    
    // Find the preset theme
    const presetTheme = presetThemes.find(t => t.id === themeId);
    if (!presetTheme) return;

    // Determine the actual mode to apply
    const actualMode = mode === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

    // Apply the preset theme
    applyTheme(presetTheme, actualMode);

    // Apply custom primary color if it exists and is different from preset
    if (customPrimary && customPrimary !== presetTheme.colors.primary) {
      applyCustomPrimaryColor(customPrimary, actualMode);
    }

    // Set the system theme to match saved preference
    if (systemTheme !== mode) {
      setTheme(mode);
    }

    // Listen for system theme changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        const newMode = e.matches ? 'dark' : 'light';
        applyTheme(presetTheme, newMode);
        
        if (customPrimary && customPrimary !== presetTheme.colors.primary) {
          applyCustomPrimaryColor(customPrimary, newMode);
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [systemTheme, setTheme]);

  // This component doesn't render anything
  return null;
}