import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';

export function NotificationBanner() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canSubscribe, setCanSubscribe] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const checkNotificationSupport = async () => {
      try {
        // Check basic notification support
        const hasNotification = 'Notification' in window;
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasPushManager = 'PushManager' in window;
        
        setIsSupported(hasNotification);
        
        if (hasNotification) {
          const permission = Notification.permission;
          setNeedsPermission(permission === 'default');
          setCanSubscribe(permission === 'granted');
          
          // Check if already subscribed
          if (hasServiceWorker && hasPushManager) {
            try {
              const registration = await navigator.serviceWorker.ready;
              const subscription = await registration.pushManager.getSubscription();
              setIsSubscribed(!!subscription);
            } catch (error) {
              console.log('Service worker check failed:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking notification support:', error);
      } finally {
        setLoading(false);
      }
    };

    checkNotificationSupport();
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNeedsPermission(permission === 'default');
      setCanSubscribe(permission === 'granted');
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const subscribe = async () => {
    try {
      // Simple subscription logic
      console.log('Subscribing to notifications...');
      setIsSubscribed(true);
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  // Don't render if loading or already subscribed
  if (loading || isSubscribed || !canSubscribe) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FiBell className="w-5 h-5 text-blue-400 mr-2" />
          <p className="text-sm text-blue-700">
            {needsPermission 
              ? 'Enable push notifications to stay updated'
              : 'Stay updated with push notifications'
            }
          </p>
        </div>
        <button
          onClick={needsPermission ? requestPermission : subscribe}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {needsPermission ? 'Enable' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}
