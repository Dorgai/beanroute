// Simplified Push Notifications Hook
// This version focuses on reliability and stability
import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../lib/session';

export const usePushNotificationsSimple = () => {
  const { session } = useSession();
  const user = session?.user;
  
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSupport = () => {
      const hasNotification = 'Notification' in window;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      
      const supported = hasNotification && hasServiceWorker && hasPushManager;
      setIsSupported(supported);
      
      if (hasNotification) {
        setPermission(Notification.permission);
      }
    };
    
    checkSupport();
  }, []);

  // Check subscription status
  useEffect(() => {
    if (!user || !isSupported) return;
    
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
        setIsSubscribed(false);
      }
    };
    
    checkSubscription();
  }, [user, isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user || !isSupported) {
      throw new Error('Push notifications not supported or user not logged in');
    }

    setLoading(true);
    setError(null);

    try {
      // Request permission
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const configResponse = await fetch('/api/push/config');
      const config = await configResponse.json();
      
      if (!config.configured) {
        throw new Error('Push notifications not configured on server');
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(config.publicKey)
      });

      // Send subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: navigator.userAgent
        }),
        credentials: 'same-origin'
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to subscribe on server');
      }

      setIsSubscribed(true);
      console.log('[Push] Successfully subscribed to push notifications');
      
    } catch (error) {
      console.error('[Push] Subscription error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      setIsSubscribed(false);
      console.log('[Push] Successfully unsubscribed from push notifications');
      
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Test notification
  const testNotification = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use the simple test endpoint that doesn't require authentication
      const response = await fetch('/api/push/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }

      console.log('[Push] Test notification sent:', result);
      return result;
      
    } catch (error) {
      console.error('[Push] Test error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    loading,
    error,
    permission,
    subscribe,
    unsubscribe,
    testNotification
  };
};

// Helper function to convert VAPID key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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
