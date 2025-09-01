import { useEffect, useState, useCallback } from 'react';
import { detectMobileOS } from '../../utils/mobileDetection';

const WakeLockManager = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [mobileInfo, setMobileInfo] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mobileInfo = detectMobileOS();
    setMobileInfo(mobileInfo);

    // Check for wake lock support
    const checkWakeLockSupport = () => {
      const hasWakeLock = 'wakeLock' in navigator;
      setIsSupported(hasWakeLock);
      
      if (hasWakeLock) {
        console.log('[WakeLock] Wake lock API supported');
      }
    };

    checkWakeLockSupport();
  }, []);

  // Request wake lock to keep device awake
  const requestWakeLock = useCallback(async () => {
    if (!isSupported || !mobileInfo?.isAndroid) return;

    try {
      console.log('[WakeLock] Requesting wake lock...');
      
      const wakeLock = await navigator.wakeLock.request('screen');
      setWakeLock(wakeLock);
      setIsActive(true);
      
      console.log('[WakeLock] Wake lock acquired successfully');
      
      // Listen for wake lock release
      wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Wake lock was released');
        setIsActive(false);
        setWakeLock(null);
      });
      
      return wakeLock;
    } catch (error) {
      console.error('[WakeLock] Error requesting wake lock:', error);
      setIsActive(false);
      return null;
    }
  }, [isSupported, mobileInfo]);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        setIsActive(false);
        console.log('[WakeLock] Wake lock released');
      } catch (error) {
        console.error('[WakeLock] Error releasing wake lock:', error);
      }
    }
  }, [wakeLock]);

  // Handle visibility change to manage wake lock
  useEffect(() => {
    if (!isSupported || !mobileInfo?.isAndroid) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page is hidden, release wake lock to save battery
        if (wakeLock) {
          console.log('[WakeLock] Page hidden, releasing wake lock');
          await releaseWakeLock();
        }
      } else {
        // Page is visible, request wake lock if needed
        if (!wakeLock && mobileInfo.isAndroid) {
          console.log('[WakeLock] Page visible, requesting wake lock');
          await requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial wake lock request
    if (!document.hidden) {
      requestWakeLock();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Release wake lock when component unmounts
      releaseWakeLock();
    };
  }, [isSupported, mobileInfo, wakeLock, requestWakeLock, releaseWakeLock]);

  // Handle page unload to release wake lock
  useEffect(() => {
    if (!isSupported || !mobileInfo?.isAndroid) return;

    const handleBeforeUnload = () => {
      if (wakeLock) {
        console.log('[WakeLock] Page unloading, releasing wake lock');
        releaseWakeLock();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSupported, mobileInfo, wakeLock, releaseWakeLock]);

  // Don't render anything visible - this is a background component
  return null;
};

export default WakeLockManager;
