'use client';

import { useState, useEffect, ReactNode } from 'react';
import { isFeatureEnabled } from '@/lib/features';
import { createClient } from '@/lib/supabase/client';

interface FeatureFlagProps {
  /** The feature flag key to check */
  name: string;
  /** Children to render when the feature is enabled */
  children: ReactNode;
  /** Optional fallback content to render when feature is disabled */
  fallback?: ReactNode;
  /** Force a specific user ID for the feature check */
  userId?: string;
  /** Show loading state while checking feature flag */
  showLoading?: boolean;
  /** Loading component to show while checking */
  loadingComponent?: ReactNode;
}

/**
 * Feature Flag wrapper component
 * 
 * Conditionally renders children based on feature flag status.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <FeatureFlag name="new_editor">
 *   <NewCodeEditor />
 * </FeatureFlag>
 * 
 * // With fallback
 * <FeatureFlag name="ai_review" fallback={<OldReviewSystem />}>
 *   <NewAIReviewSystem />
 * </FeatureFlag>
 * 
 * // Force specific user
 * <FeatureFlag name="beta_feature" userId="user-123">
 *   <BetaContent />
 * </FeatureFlag>
 * ```
 */
export function FeatureFlag({ 
  name, 
  children, 
  fallback = null, 
  userId,
  showLoading = false,
  loadingComponent = null
}: FeatureFlagProps) {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkFeature = async () => {
      try {
        // Get current user if no userId provided
        let checkUserId = userId;
        
        if (!checkUserId) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            checkUserId = user.id;
            setCurrentUserId(user.id);
          }
        }

        const enabled = await isFeatureEnabled(name, checkUserId || undefined);
        
        if (isMounted) {
          setIsEnabled(enabled);
        }
      } catch (error) {
        console.error(`Error checking feature flag "${name}":`, error);
        if (isMounted) {
          setIsEnabled(false); // Default to disabled on error
        }
      }
    };

    checkFeature();

    return () => {
      isMounted = false;
    };
  }, [name, userId]);

  // Show loading state if requested and still checking
  if (showLoading && isEnabled === null) {
    return loadingComponent || <div>Loading...</div>;
  }

  // If still checking and not showing loading, render nothing
  if (isEnabled === null) {
    return null;
  }

  // Render children if enabled, fallback if disabled
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook version of feature flag checking
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isNewEditorEnabled = useFeatureFlag('new_editor');
 *   
 *   if (isNewEditorEnabled === null) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       {isNewEditorEnabled ? <NewEditor /> : <OldEditor />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlag(flagName: string, userId?: string): boolean | null {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkFeature = async () => {
      try {
        // Get current user if no userId provided
        let checkUserId = userId;
        
        if (!checkUserId) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            checkUserId = user.id;
          }
        }

        const enabled = await isFeatureEnabled(flagName, checkUserId || undefined);
        
        if (isMounted) {
          setIsEnabled(enabled);
        }
      } catch (error) {
        console.error(`Error checking feature flag "${flagName}":`, error);
        if (isMounted) {
          setIsEnabled(false); // Default to disabled on error
        }
      }
    };

    checkFeature();

    return () => {
      isMounted = false;
    };
  }, [flagName, userId]);

  return isEnabled;
}

/**
 * Multiple feature flags hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const flags = useFeatureFlags(['new_editor', 'ai_review', 'dark_mode']);
 *   
 *   if (!flags) {
 *     return <div>Loading feature flags...</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       {flags.new_editor && <NewEditor />}
 *       {flags.ai_review && <AIReview />}
 *       {flags.dark_mode && <DarkModeToggle />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(
  flagNames: string[], 
  userId?: string
): Record<string, boolean> | null {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkFeatures = async () => {
      try {
        // Get current user if no userId provided
        let checkUserId = userId;
        
        if (!checkUserId) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            checkUserId = user.id;
          }
        }

        const results: Record<string, boolean> = {};
        
        // Check all flags
        await Promise.all(
          flagNames.map(async (flagName) => {
            try {
              const enabled = await isFeatureEnabled(flagName, checkUserId || undefined);
              results[flagName] = enabled;
            } catch (error) {
              console.error(`Error checking feature flag "${flagName}":`, error);
              results[flagName] = false;
            }
          })
        );
        
        if (isMounted) {
          setFlags(results);
        }
      } catch (error) {
        console.error('Error checking feature flags:', error);
        if (isMounted) {
          const defaultResults: Record<string, boolean> = {};
          flagNames.forEach(name => {
            defaultResults[name] = false;
          });
          setFlags(defaultResults);
        }
      }
    };

    checkFeatures();

    return () => {
      isMounted = false;
    };
  }, [flagNames.join(','), userId]);

  return flags;
}

export default FeatureFlag;