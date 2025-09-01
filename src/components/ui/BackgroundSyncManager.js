// Background Sync Manager for mobile background functionality
import { useEffect, useState } from 'react';

const BackgroundSyncManager = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const initializeBackgroundSync = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Check if service worker and background sync are supported
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // Check for background sync support
          if ('sync' in registration) {
            setIsSupported(true);
            console.log('[Background Sync] Background sync supported');
            
            // Register background sync for data updates
            await registration.sync.register('data-sync');
            console.log('[Background Sync] Data sync registered');
          }
          
          // Check for periodic sync support (mainly Android)
          if ('periodicSync' in registration) {
            console.log('[Background Sync] Periodic sync supported');
            
            try {
              // Request permission for background sync
              const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
              
              if (status.state === 'granted') {
                // Register periodic sync for data refresh (every 12 hours)
                await registration.periodicSync.register('data-refresh', {
                  minInterval: 12 * 60 * 60 * 1000 // 12 hours in milliseconds
                });
                
                // Register periodic sync for notification checks (every 30 minutes)
                await registration.periodicSync.register('notification-check', {
                  minInterval: 30 * 60 * 1000 // 30 minutes in milliseconds
                });
                
                // Register periodic sync for inventory updates (every 2 hours)
                await registration.periodicSync.register('inventory-sync', {
                  minInterval: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
                });
                
                setIsRegistered(true);
                console.log('[Background Sync] Periodic sync registered successfully');
              } else {
                console.log('[Background Sync] Periodic sync permission not granted:', status.state);
              }
            } catch (error) {
              console.log('[Background Sync] Periodic sync not supported or failed:', error);
            }
          }
          
          // Listen for visibility changes to trigger sync when app becomes active
          document.addEventListener('visibilitychange', handleVisibilityChange);
          
          // Listen for online/offline events
          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);
          
        } else {
          console.log('[Background Sync] Service workers not supported');
        }
      } catch (error) {
        console.error('[Background Sync] Error initializing background sync:', error);
      }
    };

    const handleVisibilityChange = async () => {
      if (!document.hidden && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            // Trigger background sync when app becomes visible
            await registration.sync.register('data-sync');
            console.log('[Background Sync] Data sync triggered on visibility change');
          }
        } catch (error) {
          console.error('[Background Sync] Error triggering sync on visibility change:', error);
        }
      }
    };

    const handleOnline = async () => {
      console.log('[Background Sync] App came online, triggering sync');
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await registration.sync.register('data-sync');
            await registration.sync.register('notification-update-sync');
          }
        } catch (error) {
          console.error('[Background Sync] Error triggering sync when online:', error);
        }
      }
    };

    const handleOffline = () => {
      console.log('[Background Sync] App went offline');
    };

    initializeBackgroundSync();

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // This component doesn't render anything visible
  // It just manages background sync functionality
  return null;
};

export default BackgroundSyncManager;