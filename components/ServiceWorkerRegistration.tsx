'use client';

import { useEffect, useState } from 'react';
import offlineManager from '@/lib/offline';

export function ServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker in development and production
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        })
        .then((reg) => {
          console.log('Service Worker registered with scope:', reg.scope);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  console.log('New service worker available');
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              console.log('Cache updated:', event.data.payload);
            }
          });

          // Check for updates immediately and then periodically
          reg.update();
          setInterval(() => reg.update(), 60000); // Check every minute
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle service worker controlled event
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        // Optionally reload the page when a new service worker takes control
        if (updateAvailable) {
          window.location.reload();
        }
      });
    }
  }, [updateAvailable]);

  // Handle service worker updates
  const handleUpdate = async () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
    }
  };

  // Show update notification if available
  useEffect(() => {
    if (updateAvailable) {
      // You could show a toast or modal here
      const shouldUpdate = confirm('A new version is available. Update now?');
      if (shouldUpdate) {
        handleUpdate();
      }
    }
  }, [updateAvailable]);

  return null;
}

// Enhanced version with update management
export function ServiceWorkerManager() {
  const [swState, setSwState] = useState({
    isSupported: false,
    isRegistered: false,
    updateAvailable: false,
    isOnline: navigator.onLine
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setSwState(prev => ({ ...prev, isSupported: true }));
      
      registerServiceWorker();
      
      // Listen for online/offline events
      const handleOnline = () => setSwState(prev => ({ ...prev, isOnline: true }));
      const handleOffline = () => setSwState(prev => ({ ...prev, isOnline: false }));
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      setSwState(prev => ({ ...prev, isRegistered: true }));

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setSwState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Sync with offline manager when online
      if (navigator.onLine) {
        offlineManager.syncPendingActions();
      }

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { data } = event;
    
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated for:', data.url);
        break;
      case 'OFFLINE_REQUEST_QUEUED':
        console.log('Request queued for offline sync:', data.request);
        break;
      case 'BACKGROUND_SYNC':
        // Trigger offline manager sync
        offlineManager.syncPendingActions();
        break;
    }
  };

  return null;
}

export default ServiceWorkerRegistration;
