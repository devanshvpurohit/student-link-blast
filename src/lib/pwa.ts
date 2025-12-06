// PWA Installation and Service Worker utilities

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered with scope:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content available, refresh to update');
            // Could trigger a toast/notification here
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Setup install prompt listener
export const setupInstallPrompt = (
  onPromptAvailable?: () => void
): (() => void) => {
  const handler = (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('Install prompt available');
    onPromptAvailable?.();
  };

  window.addEventListener('beforeinstallprompt', handler);

  return () => {
    window.removeEventListener('beforeinstallprompt', handler);
  };
};

// Check if app is installed
export const isAppInstalled = (): boolean => {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check iOS standalone
  if ((navigator as any).standalone === true) {
    return true;
  }

  return false;
};

// Check if install prompt is available
export const canInstall = (): boolean => {
  return deferredPrompt !== null && !isAppInstalled();
};

// Trigger install prompt
export const promptInstall = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.warn('Install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('Install prompt outcome:', outcome);
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error prompting install:', error);
    return false;
  }
};

// Get display mode
export const getDisplayMode = (): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' => {
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  return 'browser';
};

// Check online status
export const isOnline = (): boolean => navigator.onLine;

// Setup online/offline listeners
export const setupOnlineListeners = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = () => {
    console.log('App is online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('App is offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Clear all caches (for debugging/reset)
export const clearCaches = async (): Promise<boolean> => {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};
