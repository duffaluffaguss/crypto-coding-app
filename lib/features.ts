import { createClient } from './supabase/client';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: number;
  user_ids: string[];
  created_at: string;
  updated_at: string;
}

// In-memory cache for feature flags
let flagsCache: FeatureFlag[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Browser localStorage cache key
const STORAGE_KEY = 'crypto_coding_feature_flags';
const STORAGE_TIMESTAMP_KEY = 'crypto_coding_feature_flags_timestamp';

/**
 * Get feature flags from cache or fetch from database
 */
async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  
  // Check in-memory cache first
  if (flagsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return flagsCache;
  }

  // Check localStorage cache (browser only)
  if (typeof window !== 'undefined') {
    const storedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    const storedFlags = localStorage.getItem(STORAGE_KEY);
    
    if (storedTimestamp && storedFlags && 
        (now - parseInt(storedTimestamp)) < CACHE_DURATION) {
      try {
        const flags = JSON.parse(storedFlags);
        flagsCache = flags;
        cacheTimestamp = parseInt(storedTimestamp);
        return flags;
      } catch (e) {
        // Invalid JSON, clear storage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    }
  }

  // Fetch from database
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching feature flags:', error);
      return flagsCache || []; // Return cached data if available
    }

    const flags = data || [];
    
    // Update cache
    flagsCache = flags;
    cacheTimestamp = now;

    // Update localStorage (browser only)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, now.toString());
    }

    return flags;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return flagsCache || [];
  }
}

/**
 * Check if a feature flag is enabled for a user
 * @param flagKey - The feature flag key
 * @param userId - Optional user ID for beta list check
 * @returns Promise<boolean> - Whether the feature is enabled
 */
export async function isFeatureEnabled(flagKey: string, userId?: string): Promise<boolean> {
  try {
    const flags = await getFeatureFlags();
    const flag = flags.find(f => f.key === flagKey);

    if (!flag) {
      // Flag doesn't exist, default to false
      return false;
    }

    // If flag is disabled, return false
    if (!flag.enabled) {
      return false;
    }

    // If user is in the beta list, always enable
    if (userId && flag.user_ids.includes(userId)) {
      return true;
    }

    // If rollout is 100%, enable for everyone
    if (flag.rollout_percentage >= 100) {
      return true;
    }

    // If rollout is 0%, disable for everyone (except beta users)
    if (flag.rollout_percentage <= 0) {
      return false;
    }

    // Use deterministic rollout based on userId or sessionId
    let rolloutSeed: string;
    if (userId) {
      rolloutSeed = userId;
    } else {
      // Use session-based rollout for anonymous users
      if (typeof window !== 'undefined') {
        let sessionId = sessionStorage.getItem('feature_rollout_session');
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('feature_rollout_session', sessionId);
        }
        rolloutSeed = sessionId;
      } else {
        // Server-side: always return false for percentage rollout without userId
        return false;
      }
    }

    // Simple hash function for deterministic rollout
    let hash = 0;
    const combined = flagKey + rolloutSeed;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const percentage = Math.abs(hash % 100);
    return percentage < flag.rollout_percentage;
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return false;
  }
}

/**
 * Clear the feature flags cache
 */
export function clearFeatureFlagsCache(): void {
  flagsCache = null;
  cacheTimestamp = 0;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  }
}

/**
 * Get all feature flags (mainly for admin use)
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  return await getFeatureFlags();
}

/**
 * Check multiple feature flags at once
 * @param flagKeys - Array of feature flag keys to check
 * @param userId - Optional user ID
 * @returns Promise<Record<string, boolean>> - Object with flag keys as keys and enabled status as values
 */
export async function checkMultipleFeatures(
  flagKeys: string[], 
  userId?: string
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const key of flagKeys) {
    results[key] = await isFeatureEnabled(key, userId);
  }
  
  return results;
}