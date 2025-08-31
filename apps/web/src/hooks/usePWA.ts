'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running as PWA
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
    };

    checkInstalled();
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Service worker registration and update handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'CONTENT_UPDATED') {
              setUpdateAvailable(true);
            }
          });
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  // Install PWA
  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  }, [installPrompt]);

  // Apply update
  const applyUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Listen for controlling service worker change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      });
    }
  }, []);

  // Share content
  const shareContent = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Check if sharing is supported
  const canShare = useCallback((data?: ShareData) => {
    return navigator.share && (!data || navigator.canShare?.(data) !== false);
  }, []);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async () => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersistent = await navigator.storage.persist();
        return isPersistent;
      } catch (error) {
        console.error('Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Get storage estimate
  const getStorageEstimate = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        console.error('Storage estimate failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge.png',
        ...options,
      });
    }
    return null;
  }, []);

  // Add to home screen prompt (for iOS)
  const showIOSInstallPrompt = useCallback(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    return isIOS && isSafari && !isInstalled;
  }, [isInstalled]);

  return {
    // Installation
    isInstalled,
    isInstallable,
    installApp,
    showIOSInstallPrompt: showIOSInstallPrompt(),

    // Network status
    isOnline,

    // Updates
    updateAvailable,
    applyUpdate,

    // Sharing
    shareContent,
    canShare,

    // Storage
    requestPersistentStorage,
    getStorageEstimate,

    // Notifications
    enableNotifications,
    showNotification,

    // Utilities
    isPWA: isInstalled,
    supportsPWA: 'serviceWorker' in navigator,
  };
}

export default usePWA;