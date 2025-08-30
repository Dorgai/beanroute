// React hook for managing push notifications
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');

  // Check browser support and configuration
  useEffect(() => {
    const checkSupport = async () => {
      setLoading(true);
      
      try {
        // Check browser support
        const supported = 'serviceWorker' in navigator && 
                         'PushManager' in window && 
                         'Notification' in window;
        
        setIsSupported(supported);
        
        if (!supported) {
          setLoading(false);
          return;
        }

        // Check current permission
        setPermission(Notification.permission);

        // Check server configuration
        const configResponse = await fetch('/api/push/config');
        const config = await configResponse.json();
        setIsConfigured(config.configured);

        if (!config.configured) {
          setLoading(false);
          return;
        }

        // Check current subscription status
        if (user) {
          await checkSubscriptionStatus();
        }

      } catch (err) {
        console.error('[Push Hook] Error checking support:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSupport();
  }, [user]);

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user || !isSupported) return;

    try {
      const statusResponse = await fetch('/api/push/user-status');
      const status = await statusResponse.json();
      
      setIsSubscribed(status.subscribed);
      
      // Also check service worker subscription
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const swSubscription = await registration.pushManager.getSubscription();
        setSubscription(swSubscription);
      }
    } catch (err) {
      console.error('[Push Hook] Error checking subscription status:', err);
      setError(err.message);
    }
  }, [user, isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (!isConfigured) {
      throw new Error('Push notifications are not configured on the server');
    }

    try {
      setLoading(true);
      setError(null);

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Permission denied for notifications');
      }

      return permission;
    } catch (err) {
      console.error('[Push Hook] Error requesting permission:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isSupported, isConfigured]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to subscribe');
    }

    if (permission !== 'granted') {
      await requestPermission();
    }

    try {
      setLoading(true);
      setError(null);

      // Get VAPID public key
      const configResponse = await fetch('/api/push/config');
      const config = await configResponse.json();

      if (!config.configured) {
        throw new Error('Push notifications not configured on server');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push manager
      const pushSubscription = await registration.pushManager.subscribe({
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
          subscription: pushSubscription.toJSON(),
          userAgent: navigator.userAgent
        })
      });

      if (!subscribeResponse.ok) {
        const error = await subscribeResponse.json();
        throw new Error(error.error || 'Failed to subscribe');
      }

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      
      console.log('[Push Hook] Successfully subscribed to push notifications');
      return pushSubscription;

    } catch (err) {
      console.error('[Push Hook] Error subscribing:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      setSubscription(null);
      setIsSubscribed(false);
      
      console.log('[Push Hook] Successfully unsubscribed from push notifications');

    } catch (err) {
      console.error('[Push Hook] Error unsubscribing:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Test notification (for testing purposes)
  const testNotification = useCallback(async () => {
    if (!isSubscribed) {
      throw new Error('Not subscribed to notifications');
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [user.id],
          title: 'Test Notification',
          body: 'This is a test notification from BeanRoute!',
          type: 'TEST',
          data: { test: true }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }

      console.log('[Push Hook] Test notification sent');
    } catch (err) {
      console.error('[Push Hook] Error sending test notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isSubscribed, user]);

  return {
    // Status
    isSupported,
    isConfigured,
    isSubscribed,
    permission,
    loading,
    error,
    subscription,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
    checkSubscriptionStatus,
    
    // Computed properties
    canSubscribe: isSupported && isConfigured && permission === 'granted',
    needsPermission: isSupported && isConfigured && permission === 'default',
    permissionDenied: permission === 'denied'
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

export default usePushNotifications;

