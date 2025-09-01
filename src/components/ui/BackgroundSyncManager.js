import { useEffect, useState, useCallback } from 'react';
import { detectMobileOS } from '../../utils/mobileDetection';

const BackgroundSyncManager = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [mobileInfo, setMobileInfo] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mobileInfo = detectMobileOS();
    setMobileInfo(mobileInfo);

    // Check for background sync support
    const checkSupport = () => {
      const hasBackgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration;
      const hasPeriodicSync = 'periodicSync' in window.ServiceWorkerRegistration;
      const hasNotifications = 'Notification' in window;
      
      setIsSupported(hasBackgroundSync || hasPeriodicSync || hasNotifications);
      
      if (hasBackgroundSync || hasPeriodicSync) {
        console.log('[BackgroundSync] Background sync supported');
      }
      
      if (hasPeriodicSync) {
        console.log('[BackgroundSync] Periodic sync supported');
      }
      
      if (hasNotifications) {
        console.log('[BackgroundSync] Notifications supported');
      }
    };

    checkSupport();
  }, []);

  // Register periodic sync for background data updates
  const registerPeriodicSync = useCallback(async () => {
    if (!('periodicSync' in window.ServiceWorkerRegistration)) {
      console.log('[BackgroundSync] Periodic sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request permission for periodic sync
      const status = await registration.periodicSync.getStatus();
      
      if (status === 'denied') {
        console.log('[BackgroundSync] Periodic sync permission denied');
        return false;
      }

      // Register periodic sync for data refresh
      await registration.periodicSync.register('data-refresh', {
        minInterval: 24 * 60 * 60 * 1000, // Minimum 24 hours
        maxInterval: 7 * 24 * 60 * 60 * 1000, // Maximum 7 days
      });

      console.log('[BackgroundSync] Periodic sync registered successfully');
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Error registering periodic sync:', error);
      return false;
    }
  }, []);

  // Register background sync for immediate operations
  const registerBackgroundSync = useCallback(async (tag, options = {}) => {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration)) {
      console.log('[BackgroundSync] Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Register background sync
      await registration.sync.register(tag, options);
      
      console.log(`[BackgroundSync] Background sync registered for tag: ${tag}`);
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Error registering background sync:', error);
      return false;
    }
  }, []);

  // Keep the app alive with periodic heartbeats
  const startHeartbeat = useCallback(() => {
    if (!mobileInfo?.isMobile) return;

    console.log('[BackgroundSync] Starting heartbeat for mobile device');
    
    // Send periodic heartbeat to keep service worker active
    const heartbeat = setInterval(async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // Send heartbeat message to service worker
          registration.active?.postMessage({
            type: 'HEARTBEAT',
            timestamp: Date.now()
          });
          
          // Also trigger a background sync to keep the connection alive
          await registerBackgroundSync('heartbeat-sync');
        }
      } catch (error) {
        console.error('[BackgroundSync] Heartbeat error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(heartbeat);
  }, [mobileInfo, registerBackgroundSync]);

  // Initialize background sync when component mounts
  useEffect(() => {
    if (!isSupported) return;

    const initializeBackgroundSync = async () => {
      try {
        setSyncStatus('initializing');
        
        // Register periodic sync for background data updates
        const periodicSyncRegistered = await registerPeriodicSync();
        
        // Register initial background sync
        const backgroundSyncRegistered = await registerBackgroundSync('initial-sync');
        
        if (periodicSyncRegistered || backgroundSyncRegistered) {
          setIsRegistered(true);
          setSyncStatus('active');
          
          // Start heartbeat for mobile devices
          if (mobileInfo?.isMobile) {
            startHeartbeat();
          }
        } else {
          setSyncStatus('failed');
        }
      } catch (error) {
        console.error('[BackgroundSync] Initialization error:', error);
        setSyncStatus('error');
      }
    };

    initializeBackgroundSync();
  }, [isSupported, registerPeriodicSync, registerBackgroundSync, startHeartbeat, mobileInfo]);

  // Request notification permission for better background operation
  useEffect(() => {
    if (!isSupported || !mobileInfo?.isMobile) return;

    const requestNotificationPermission = async () => {
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('[BackgroundSync] Notification permission granted');
          }
        }
      } catch (error) {
        console.error('[BackgroundSync] Error requesting notification permission:', error);
      }
    };

    requestNotificationPermission();
  }, [isSupported, mobileInfo]);

  // Handle visibility change to trigger sync when app becomes visible
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && isRegistered) {
        console.log('[BackgroundSync] App became visible, triggering sync');
        registerBackgroundSync('visibility-sync');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSupported, isRegistered, registerBackgroundSync]);

  // Handle online/offline events
  useEffect(() => {
    if (!isSupported) return;

    const handleOnline = () => {
      console.log('[BackgroundSync] Device came online, syncing data');
      registerBackgroundSync('online-sync');
    };

    const handleOffline = () => {
      console.log('[BackgroundSync] Device went offline');
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSupported, registerBackgroundSync]);

  // Don't render anything visible - this is a background component
  return null;
};

export default BackgroundSyncManager;
