// React hook for managing push notifications
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../lib/session';

export const usePushNotifications = () => {
  const { session } = useSession();
  const user = session?.user; // Extract user from session
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false); // Start with false, not true
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');
  
  // Use refs to prevent multiple simultaneous API calls
  const hasCheckedConfig = useRef(false);
  const hasCheckedSubscription = useRef(false);
  const isInitialized = useRef(false);
  
  // Don't use early return - it violates React hook rules
  // Instead, we'll use conditional logic throughout the hook
  
  // Helper function to detect mobile devices
  const getDeviceInfo = useCallback(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    return { isMobile, isIOS, isAndroid };
  }, []);

  // Check browser support and configuration
  useEffect(() => {
    // Reset initialization state when user changes
    if (!user && isInitialized.current) {
      console.log('[Push Hook] User logged out, resetting initialization state');
      isInitialized.current = false;
      hasCheckedConfig.current = false;
      hasCheckedSubscription.current = false;
      setIsSupported(false);
      setIsConfigured(false);
      setIsSubscribed(false);
      setSubscription(null);
      setError(null);
      setLoading(false);
      return;
    }
    
    const checkSupport = async () => {
      if (isInitialized.current) return;
      
      // Don't initialize if no user is authenticated
      if (!user) {
        console.log('[Push Hook] No user authenticated, skipping initialization');
        return;
      }
      
      isInitialized.current = true;
      
      setLoading(true);
      
      try {
        // Enhanced browser support check for mobile
        const { isMobile, isIOS, isAndroid } = getDeviceInfo();
        
        console.log('[Push Hook] Device detection:', { isMobile, isIOS, isAndroid, userAgent: navigator.userAgent });
        
        // Check browser support with mobile-specific considerations
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasPushManager = 'PushManager' in window;
        const hasNotification = 'Notification' in window;
        
        // Check if running as PWA (standalone mode)
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        const isPWA = isStandalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
        
        console.log('[Push Hook] PWA detection:', { isStandalone, isPWA, displayMode: window.matchMedia('(display-mode: standalone)').matches });
        
        // More lenient support check for mobile devices and PWA
        let supported = false;
        
        if (isMobile) {
          console.log('[Push Hook] Mobile device detected - using lenient support check');
          
          // Mobile devices need at least basic notifications
          if (hasNotification) {
            supported = true;
            console.log('[Push Hook] Mobile device has basic notification support');
            
            // If they have full push support, that's even better
            if (hasServiceWorker && hasPushManager) {
              console.log('[Push Hook] Mobile device has full push support');
            } else {
              console.log('[Push Hook] Mobile device has basic notification support only');
            }
          }
          
          // PWA installation makes notifications more reliable
          if (isPWA && hasNotification) {
            supported = true;
            console.log('[Push Hook] PWA detected - enabling notification support');
          }
        } else {
          // Desktop devices need full push support
          supported = hasServiceWorker && hasPushManager && hasNotification;
          console.log('[Push Hook] Desktop device - requiring full push support:', supported);
        }
        
        // For iOS, we'll allow basic notifications even if push isn't fully supported
        if (isIOS && hasNotification) {
          console.log('[Push Hook] iOS device - enabling basic notification support');
          supported = true;
          
          // PWA installation on iOS is especially important
          if (isPWA) {
            console.log('[Push Hook] iOS PWA detected - enhanced notification support');
          }
        }
        
        // For Android, PWA installation improves reliability
        if (isAndroid && isPWA && hasNotification) {
          console.log('[Push Hook] Android PWA detected - enhanced notification support');
          supported = true;
        }
        
        console.log('[Push Hook] Final support determination:', { 
          supported, 
          isMobile, 
          isIOS, 
          isAndroid, 
          isPWA, 
          hasNotification, 
          hasServiceWorker, 
          hasPushManager 
        });
        
        setIsSupported(supported);
        
        if (supported) {
          // Check if push notifications are configured on the server
          try {
            const configResponse = await fetch('/api/push/config');
            
            if (!configResponse.ok) {
              if (configResponse.status === 401) {
                console.log('[Push Hook] User not authenticated during config check');
                return;
              }
              throw new Error(`HTTP ${configResponse.status}: ${configResponse.statusText}`);
            }
            
            const config = await configResponse.json();
            const configured = config.configured === true;
            
            console.log('[Push Hook] Server configuration check:', { 
              configured, 
              hasPublicKey: !!config.publicKey,
              response: config 
            });
            
            setIsConfigured(configured);
            hasCheckedConfig.current = true;
            
            // If configured, check current subscription status
            if (configured && !hasCheckedSubscription.current) {
              console.log('[Push Hook] Configuration confirmed, checking subscription status...');
              await checkSubscriptionStatus();
            }
          } catch (configError) {
            console.error('[Push Hook] Error checking server configuration:', configError);
            setError(configError.message);
            setIsConfigured(false);
          }
        } else {
          console.log('[Push Hook] Browser not supported for push notifications');
          setIsConfigured(false);
        }
      } catch (err) {
        console.error('[Push Hook] Error during support check:', err);
        setError(err.message);
        setIsSupported(false);
        setIsConfigured(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkSupport();
  }, [user, getDeviceInfo]);

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    if (!user || !isSupported) {
      console.log('[Push Hook] Skipping subscription check - no user or not supported');
      return;
    }

    try {
      console.log('[Push Hook] Checking subscription status...');
      
      // Check server-side subscription status first (most reliable)
      const statusResponse = await fetch('/api/push/user-status');
      
      if (!statusResponse.ok) {
        if (statusResponse.status === 401) {
          console.log('[Push Hook] User not authenticated, skipping subscription check');
          return;
        }
        throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
      }
      
      const status = await statusResponse.json();
      
      console.log('[Push Hook] Server status:', status);
      
      // Check if we're on a mobile device
      const { isMobile } = getDeviceInfo();
      
      // For mobile devices, prioritize server status over service worker status
      if (isMobile) {
        console.log('[Push Hook] Mobile device - prioritizing server subscription status');
        
        if (status.subscribed) {
          // Server says we're subscribed, so we are
          setIsSubscribed(true);
          
          // Try to get service worker subscription for local state, but don't fail if it's not available
          try {
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              const swSubscription = await registration.pushManager.getSubscription();
              
              if (swSubscription) {
                setSubscription(swSubscription);
                console.log('[Push Hook] Mobile: Service worker subscription found and set');
              } else {
                // Create a mock subscription for mobile devices without service worker
                const mockSubscription = {
                  endpoint: `mobile://${navigator.userAgent}`,
                  keys: { p256dh: 'mobile-basic', auth: 'mobile-basic' },
                  mobile: true,
                  limited: true,
                  toJSON: () => ({
                    endpoint: `mobile://${navigator.userAgent}`,
                    keys: { p256dh: 'mobile-basic', auth: 'mobile-basic' }
                  })
                };
                setSubscription(mockSubscription);
                console.log('[Push Hook] Mobile: Using mock subscription for basic notifications');
              }
            }
          } catch (swError) {
            console.warn('[Push Hook] Mobile: Service worker check failed, but subscription is still active:', swError);
            // Don't fail the subscription check just because service worker is unavailable
          }
          
          console.log('[Push Hook] Mobile: Final subscription state: TRUE (server confirmed)');
          return;
        } else {
          // Server says we're not subscribed
          setIsSubscribed(false);
          setSubscription(null);
          console.log('[Push Hook] Mobile: Final subscription state: FALSE (server confirmed)');
          return;
        }
      }
      
      // For desktop devices, check both server and service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const swSubscription = await registration.pushManager.getSubscription();
        
        console.log('[Push Hook] Desktop: Service worker registration:', registration);
        console.log('[Push Hook] Desktop: Service worker subscription:', swSubscription);
        console.log('[Push Hook] Desktop: Service worker controller:', navigator.serviceWorker.controller);
        
        // Update subscription state
        setSubscription(swSubscription);
        
        // Determine if actually subscribed - require both server and service worker
        const serverSubscribed = Boolean(status.subscribed);
        const hasSWSubscription = Boolean(swSubscription);
        const hasSWController = Boolean(navigator.serviceWorker.controller);
        
        console.log('[Push Hook] Desktop: Subscription components:', {
          serverSubscribed,
          hasSWSubscription,
          hasSWController
        });
        
        // Desktop: require full service worker support
        const actuallySubscribed = serverSubscribed && hasSWSubscription && hasSWController;
        setIsSubscribed(actuallySubscribed);
        
        console.log('[Push Hook] Desktop: Final subscription state:', actuallySubscribed);
      } else {
        // No service worker support
        setIsSubscribed(status.subscribed);
        console.log('[Push Hook] No service worker support, using server status:', status.subscribed);
      }
      
      // Mark that we've checked the subscription status
      hasCheckedSubscription.current = true;
    } catch (err) {
      console.error('[Push Hook] Error checking subscription status:', err);
      setError(err.message);
      setIsSubscribed(false);
    }
  }, [user, isSupported, getDeviceInfo]);

  // Check subscription status when component mounts
  useEffect(() => {
    if (!user || !isSupported || !isConfigured || hasCheckedSubscription.current) {
      return;
    }
    
    console.log('[Push Hook] Component mounted, checking initial subscription status...');
    checkSubscriptionStatus();
  }, [user, isSupported, isConfigured, checkSubscriptionStatus]);

  // Periodic subscription status check
  useEffect(() => {
    if (!user || !isSupported || !isConfigured) {
      console.log('[Push Hook] Skipping periodic status check - missing requirements');
      return;
    }

    console.log('[Push Hook] Setting up periodic subscription status check...');

    // Check subscription status every 30 seconds to ensure it stays in sync
    const intervalId = setInterval(async () => {
      try {
        // Double-check that user is still authenticated before making API call
        if (!user) {
          console.log('[Push Hook] User no longer authenticated, stopping periodic checks');
          clearInterval(intervalId);
          return;
        }
        
        console.log('[Push Hook] Periodic subscription status check...');
        await checkSubscriptionStatus();
      } catch (error) {
        console.warn('[Push Hook] Periodic status check failed:', error);
      }
    }, 30000); // 30 seconds

    return () => {
      console.log('[Push Hook] Cleaning up periodic status check');
      clearInterval(intervalId);
    };
  }, [user, isSupported, isConfigured, checkSubscriptionStatus]);

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

  // Force service worker to take control
  const ensureServiceWorkerControl = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service worker not supported');
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    
    // If service worker is not controlling the page, try to take control
    if (!navigator.serviceWorker.controller) {
      console.log('[Push Hook] Service worker not controlling page, attempting to take control...');
      
      // Try to skip waiting and claim
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Wait a bit for the service worker to take control
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if it's now controlling
      if (!navigator.serviceWorker.controller) {
        console.warn('[Push Hook] Service worker still not controlling page after skip waiting');
        // Force a page reload to ensure service worker takes control
        window.location.reload();
        return;
      }
    }
    
    console.log('[Push Hook] Service worker is controlling the page');
    return registration;
  }, []);

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

      console.log('[Push Hook] Starting subscription process...');

      // Get VAPID public key
      const configResponse = await fetch('/api/push/config');
      const config = await configResponse.json();

      if (!config.configured) {
        throw new Error('Push notifications not configured on server');
      }

      console.log('[Push Hook] VAPID config received:', { 
        configured: config.configured, 
        hasPublicKey: !!config.publicKey 
      });

      // Check if we're on a mobile device
      const { isMobile, isIOS, isAndroid } = getDeviceInfo();
      const isPWA = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      
      console.log('[Push Hook] Device info for subscription:', { isMobile, isIOS, isAndroid, isPWA });
      
      let pushSubscription = null;
      let registration = null;
      
      // For mobile devices, try to get service worker but don't fail if it's not available
      if (isMobile) {
        try {
          if ('serviceWorker' in navigator) {
            registration = await navigator.serviceWorker.ready;
            console.log('[Push Hook] Service worker ready on mobile:', registration);
            
            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
              console.log('[Push Hook] Already subscribed on mobile, updating subscription...');
              await existingSubscription.unsubscribe();
            }
            
            // Try to subscribe to push manager
            try {
              pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(config.publicKey)
              });
              console.log('[Push Hook] Push subscription created on mobile:', pushSubscription);
            } catch (pushError) {
              console.warn('[Push Hook] Push subscription failed on mobile, will use basic notifications:', pushError);
              // For mobile, we'll still mark as subscribed even if push fails
              pushSubscription = { mobile: true, pushFailed: true };
            }
          } else {
            console.log('[Push Hook] No service worker on mobile, will use basic notifications');
            pushSubscription = { mobile: true, noServiceWorker: true };
          }
        } catch (swError) {
          console.warn('[Push Hook] Service worker error on mobile:', swError);
          pushSubscription = { mobile: true, serviceWorkerError: true };
        }
      } else {
        // Desktop: ensure full service worker control
        registration = await ensureServiceWorkerControl();
        console.log('[Push Hook] Service worker ready and controlling on desktop:', registration);
        
        // Check if already subscribed
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('[Push Hook] Already subscribed on desktop, updating subscription...');
          await existingSubscription.unsubscribe();
        }
        
        // Subscribe to push manager with enhanced options
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(config.publicKey)
        });
      }

      console.log('[Push Hook] Push subscription created:', pushSubscription);
      console.log('[Push Hook] Subscription endpoint:', pushSubscription.endpoint);

      // Send subscription to server
      let subscriptionData;
      if (pushSubscription.mobile && (pushSubscription.pushFailed || pushSubscription.noServiceWorker)) {
        // For mobile devices with limited support, send a basic subscription
        subscriptionData = {
          subscription: {
            endpoint: `mobile://${navigator.userAgent}`,
            keys: {
              p256dh: 'mobile-basic',
              auth: 'mobile-basic'
            }
          },
          userAgent: navigator.userAgent,
          mobile: true,
          limited: true,
          pwa: isPWA
        };
      } else {
        // Normal push subscription
        subscriptionData = {
          subscription: pushSubscription.toJSON(),
          userAgent: navigator.userAgent,
          mobile: isMobile,
          pwa: isPWA
        };
      }
      
      console.log('[Push Hook] Sending subscription data to server:', subscriptionData);
      
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!subscribeResponse.ok) {
        const error = await subscribeResponse.json();
        throw new Error(error.error || 'Failed to subscribe');
      }

      const subscribeResult = await subscribeResponse.json();
      console.log('[Push Hook] Server subscription response:', subscribeResult);

      // Update local state
      if (pushSubscription.mobile && (pushSubscription.pushFailed || pushSubscription.noServiceWorker)) {
        // For mobile basic subscriptions, we don't have a real PushSubscription object
        // So we'll create a mock one for local state management
        const mockSubscription = {
          endpoint: `mobile://${navigator.userAgent}`,
          keys: { p256dh: 'mobile-basic', auth: 'mobile-basic' },
          mobile: true,
          limited: true,
          pwa: isPWA,
          toJSON: () => ({
            endpoint: `mobile://${navigator.userAgent}`,
            keys: { p256dh: 'mobile-basic', auth: 'mobile-basic' }
          })
        };
        setSubscription(mockSubscription);
      } else {
        setSubscription(pushSubscription);
      }
      
      setIsSubscribed(true);
      
      // Force a refresh of the subscription status to ensure persistence
      hasCheckedSubscription.current = false;
      
      // Wait a moment for the server to process the subscription, then verify it
      setTimeout(async () => {
        try {
          console.log('[Push Hook] Verifying subscription persistence...');
          await checkSubscriptionStatus();
        } catch (verifyError) {
          console.warn('[Push Hook] Subscription verification failed:', verifyError);
        }
      }, 1000);
      
      console.log('[Push Hook] Successfully subscribed to push notifications');
      return pushSubscription;

    } catch (err) {
      console.error('[Push Hook] Error subscribing:', err);
      console.error('[Push Hook] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        cause: err.cause
      });
      
      // Provide more specific error messages
      let errorMessage = err.message;
      if (err.message.includes('VAPID')) {
        errorMessage = 'VAPID configuration error. Please contact support.';
      } else if (err.message.includes('permission')) {
        errorMessage = 'Notification permission denied. Please enable notifications in your browser settings.';
      } else if (err.message.includes('service worker')) {
        errorMessage = 'Service worker error. Please refresh the page and try again.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (!errorMessage || errorMessage === 'Failed to subscribe') {
        errorMessage = 'Failed to subscribe to push notifications. Please try again or contact support.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, permission, requestPermission, ensureServiceWorkerControl, getDeviceInfo]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Push Hook] Starting unsubscription process...');

      // Unsubscribe from service worker if available
      if ('serviceWorker' in navigator && subscription && !subscription.mobile) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.pushManager.getSubscription().then(sub => {
            if (sub) return sub.unsubscribe();
          });
          console.log('[Push Hook] Service worker unsubscription successful');
        } catch (swError) {
          console.warn('[Push Hook] Service worker unsubscription failed:', swError);
          // Continue with server unsubscription even if service worker fails
        }
      }

      // Unsubscribe from server
      const unsubscribeResponse = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.mobile ? { endpoint: subscription.endpoint } : subscription.toJSON()
        })
      });

      if (!unsubscribeResponse.ok) {
        const error = await unsubscribeResponse.json();
        throw new Error(error.error || 'Failed to unsubscribe');
      }

      console.log('[Push Hook] Server unsubscription successful');

      // Update local state
      setIsSubscribed(false);
      setSubscription(null);
      
      // Force a refresh of the subscription status
      hasCheckedSubscription.current = false;
      
      console.log('[Push Hook] Successfully unsubscribed from push notifications');

    } catch (err) {
      console.error('[Push Hook] Error unsubscribing:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Send test notification
  const testNotification = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to send test notifications');
    }

    if (!isSubscribed) {
      throw new Error('Must be subscribed to send test notifications');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Push Hook] Sending test notification...');

      // Get device info for mobile-specific optimizations
      const { isMobile, isIOS } = getDeviceInfo();

      // Enhanced test notification payload with mobile-specific options
      const testPayload = {
        title: 'Test Notification',
        body: 'This is a test notification from BeanRoute',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
        data: {
          url: '/orders',
          timestamp: Date.now(),
          type: 'test'
        },
        // Mobile-specific enhancements
        dir: 'auto',
        lang: 'en',
        renotify: true,
        sticky: false,
        // Mobile vibration patterns
        vibrate: isMobile ? [200, 100, 200, 100, 200] : [200, 100, 200],
        // Mobile notification center optimization
        requireInteraction: false,
        silent: false,
        timestamp: Date.now()
      };

      console.log('[Push Hook] Sending test notification with mobile optimizations:', { isMobile, isIOS, payload: testPayload });

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testPayload.title,
          body: testPayload.body,
          target: '1 users', // Send to current user
          data: testPayload.data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test notification');
      }

      const result = await response.json();
      console.log('[Push Hook] Test notification sent:', result);

      return result;

    } catch (err) {
      console.error('[Push Hook] Error sending test notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isSubscribed, getDeviceInfo]);

  // Test basic browser notification (bypasses push API)
  const testBasicNotification = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to test notifications');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Push Hook] Testing basic browser notification...');

      // Get device info for mobile-specific optimizations
      const { isMobile, isIOS } = getDeviceInfo();

      // Create notification with mobile-specific options
      const notificationOptions = {
        body: 'This is a basic test notification from BeanRoute',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'basic-test',
        data: {
          url: '/orders',
          timestamp: Date.now(),
          type: 'basic-test'
        },
        // Mobile-specific enhancements
        dir: 'auto',
        lang: 'en',
        renotify: true,
        sticky: false,
        // Mobile vibration patterns
        vibrate: isMobile ? [200, 100, 200, 100, 200] : [200, 100, 200],
        // Mobile notification center optimization
        requireInteraction: false,
        silent: false,
        timestamp: Date.now()
      };

      console.log('[Push Hook] Creating basic notification with mobile options:', { isMobile, isIOS, options: notificationOptions });

      // Create and show the notification
      const notification = new Notification('Basic Test Notification', notificationOptions);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('[Push Hook] Basic notification created and displayed');

      return notification;

    } catch (err) {
      console.error('[Push Hook] Error creating basic notification:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, getDeviceInfo]);

  // Refresh subscription status manually
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to refresh subscription status');
    }

    console.log('[Push Hook] Manually refreshing subscription status...');
    
    // Reset the check flag to force a fresh check
    hasCheckedSubscription.current = false;
    
    // Perform the check
    await checkSubscriptionStatus();
  }, [user, checkSubscriptionStatus]);

  // Debug function to get device info
  const getDeviceInfoForDebug = useCallback(() => {
    const { isMobile, isIOS, isAndroid } = getDeviceInfo();
    
    return {
      isMobile,
      isIOS,
      isAndroid,
      userAgent: navigator.userAgent,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: 'PushManager' in window,
      hasNotification: 'Notification' in window,
      serviceWorkerController: navigator.serviceWorker?.controller?.state || 'none'
    };
  }, [getDeviceInfo]);

  // Utility function to convert VAPID public key
  const urlB64ToUint8Array = (base64String) => {
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
  };

  // Conditional wrapper functions to ensure user authentication
  const conditionalRequestPermission = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return requestPermission();
  }, [user, requestPermission]);

  const conditionalSubscribe = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return subscribe();
  }, [user, subscribe]);

  const conditionalUnsubscribe = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return unsubscribe();
  }, [user, unsubscribe]);

  const conditionalTestNotification = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return testNotification();
  }, [user, testNotification]);

  const conditionalTestBasicNotification = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return testBasicNotification();
  }, [user, testBasicNotification]);

  const conditionalCheckSubscriptionStatus = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return checkSubscriptionStatus();
  }, [user, checkSubscriptionStatus]);

  const conditionalRefreshSubscriptionStatus = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return refreshSubscriptionStatus();
  }, [user, refreshSubscriptionStatus]);

  const conditionalEnsureServiceWorkerControl = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return ensureServiceWorkerControl();
  }, [user, ensureServiceWorkerControl]);

  // Return the hook's public interface
  return {
    // Status (conditional based on user authentication)
    isSupported: user ? isSupported : false,
    isConfigured: user ? isConfigured : false,
    isSubscribed: user ? isSubscribed : false,
    permission: user ? permission : 'default',
    loading: user ? loading : false,
    error: user ? error : null,
    subscription: user ? subscription : null,
    
    // Actions (conditional based on user authentication)
    requestPermission: conditionalRequestPermission,
    subscribe: conditionalSubscribe,
    unsubscribe: conditionalUnsubscribe,
    testNotification: conditionalTestNotification,
    testBasicNotification: conditionalTestBasicNotification,
    checkSubscriptionStatus: conditionalCheckSubscriptionStatus,
    refreshSubscriptionStatus: conditionalRefreshSubscriptionStatus,
    ensureServiceWorkerControl: conditionalEnsureServiceWorkerControl,
    
    // Debugging
    getDeviceInfo: user ? getDeviceInfoForDebug : (() => ({ isMobile: false, isIOS: false, isAndroid: false })),
    
    // Computed properties (conditional based on user authentication)
    canSubscribe: user ? (isSupported && isConfigured && permission === 'granted') : false,
    needsPermission: user ? (isSupported && isConfigured && permission === 'default') : false,
    permissionDenied: user ? (permission === 'denied') : false
  };
};

