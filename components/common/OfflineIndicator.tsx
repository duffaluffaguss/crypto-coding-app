'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import offlineManager, { OfflineState } from '@/lib/offline';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ 
  className,
  showWhenOnline = false 
}: OfflineIndicatorProps) {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isVisible: true,
    lastSync: Date.now()
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineManager.onStateChange((newState) => {
      if (newState.isOnline !== state.isOnline) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 1000);
      }
      setState(newState);
    });

    // Update pending count
    const updatePendingCount = async () => {
      const count = await offlineManager.getPendingActionsCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [state.isOnline]);

  // Don't show when online unless explicitly requested
  if (state.isOnline && !showWhenOnline && pendingCount === 0) {
    return null;
  }

  const getStatusIcon = () => {
    if (isTransitioning) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (state.isOnline) {
      return pendingCount > 0 ? <Cloud className="h-4 w-4" /> : <Wifi className="h-4 w-4" />;
    }
    
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusMessage = () => {
    if (isTransitioning && state.isOnline) {
      return 'Reconnecting and syncing...';
    }
    
    if (!state.isOnline) {
      return 'You\'re offline - changes will sync when connected';
    }
    
    if (pendingCount > 0) {
      return `Syncing ${pendingCount} offline ${pendingCount === 1 ? 'change' : 'changes'}...`;
    }
    
    const timeSinceSync = Math.floor((Date.now() - state.lastSync) / 1000);
    if (timeSinceSync < 60) {
      return 'All changes synced';
    }
    
    return `Last synced ${Math.floor(timeSinceSync / 60)} minutes ago`;
  };

  const getStatusColor = () => {
    if (!state.isOnline) return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800';
    if (pendingCount > 0 || isTransitioning) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800';
    return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-all duration-300',
        getStatusColor(),
        isTransitioning && 'animate-pulse',
        className
      )}
    >
      {getStatusIcon()}
      <span className="flex-1">{getStatusMessage()}</span>
      
      {/* Connection quality indicator */}
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 h-3 rounded-full transition-colors duration-300',
              state.isOnline
                ? pendingCount > 0
                  ? i < 2 ? 'bg-yellow-400' : 'bg-gray-300'
                  : 'bg-green-400'
                : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Compact version for mobile or space-constrained areas
export function CompactOfflineIndicator({ className }: { className?: string }) {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isVisible: true,
    lastSync: Date.now()
  });

  useEffect(() => {
    return offlineManager.onStateChange(setState);
  }, []);

  if (state.isOnline) return null;

  return (
    <div className={cn('flex items-center gap-1 text-red-600', className)}>
      <CloudOff className="h-3 w-3" />
      <span className="text-xs font-medium">Offline</span>
    </div>
  );
}

// Global banner component for persistent offline status
export function OfflineBanner() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isVisible: true,
    lastSync: Date.now()
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineManager.onStateChange((newState) => {
      setState(newState);
      
      if (!newState.isOnline && !isDismissed) {
        setIsVisible(true);
      } else if (newState.isOnline) {
        setIsDismissed(false);
        setTimeout(() => setIsVisible(false), 3000); // Hide after 3s when back online
      }
    });

    return unsubscribe;
  }, [isDismissed]);

  if (!isVisible || state.isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            You're offline - changes will sync when connected
          </span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setIsDismissed(true);
          }}
          className="text-white/80 hover:text-white text-sm underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default OfflineIndicator;