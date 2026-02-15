// Push Notification Utilities for Bazinga PWA

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Send a local notification
export const sendNotification = async (
  title: string,
  message: string,
  options?: Partial<NotificationPayload>
): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return false;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      body: message,
      icon: options?.icon || '/icons/icon-192x192.png',
      badge: options?.badge || '/icons/icon-192x192.png',
      tag: options?.tag || 'bazinga-notification',
      data: {
        url: options?.url || '/',
        dateOfArrival: Date.now()
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Fallback to basic Notification API
    try {
      new Notification(title, {
        body: message,
        icon: options?.icon || '/icons/icon-192x192.png',
        tag: options?.tag || 'bazinga-notification'
      });
      return true;
    } catch (fallbackError) {
      console.error('Fallback notification failed:', fallbackError);
      return false;
    }
  }
};

// Subscribe to push notifications (for server-side push)
export const subscribeToPush = async (vapidPublicKey?: string): Promise<PushSubscription | null> => {
  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistration & { pushManager: PushManager };
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }

    // Create new subscription
    if (vapidPublicKey) {
      const key = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer
      });
    }

    return subscription || null;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistration & { pushManager: PushManager };
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Notification types for the app
export type NotificationType = 
  | 'match' 
  | 'message' 
  | 'like' 
  | 'event' 
  | 'club' 
  | 'connection' 
  | 'general';

// Send typed notifications
export const sendTypedNotification = async (
  type: NotificationType,
  data: { title?: string; message: string; url?: string }
): Promise<boolean> => {
  const titles: Record<NotificationType, string> = {
    match: '💕 New Match!',
    message: '💬 New Message',
    like: '❤️ Someone Likes You!',
    event: '📅 Event Update',
    club: '🎓 Club Activity',
    connection: '🤝 New Connection',
    general: '🔔 Bazinga'
  };

  return sendNotification(
    data.title || titles[type],
    data.message,
    { url: data.url, tag: `bazinga-${type}` }
  );
};
