// Mobile detection utility for BeanRoute
// Provides comprehensive mobile OS detection and device-specific functionality

export const detectMobileOS = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, os: 'unknown', platform: 'server' };
  }

  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return {
      isMobile: true,
      os: 'ios',
      platform: 'mobile',
      isIOS: true,
      isIPad: /iPad/.test(userAgent),
      isIPhone: /iPhone/.test(userAgent),
      isIPod: /iPod/.test(userAgent)
    };
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return {
      isMobile: true,
      os: 'android',
      platform: 'mobile',
      isAndroid: true,
      version: userAgent.match(/Android\s([0-9.]*)/)?.[1] || 'unknown'
    };
  }
  
  // Windows Mobile detection
  if (/Windows Phone|IEMobile|WPDesktop/.test(userAgent)) {
    return {
      isMobile: true,
      os: 'windows-mobile',
      platform: 'mobile',
      isWindowsMobile: true
    };
  }
  
  // BlackBerry detection
  if (/BlackBerry|BB10|PlayBook/.test(userAgent)) {
    return {
      isMobile: true,
      os: 'blackberry',
      platform: 'mobile',
      isBlackBerry: true
    };
  }
  
  // Mobile detection by screen size and touch capability
  const isMobileBySize = window.innerWidth <= 768;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isMobileBySize && hasTouch) {
    return {
      isMobile: true,
      os: 'unknown-mobile',
      platform: 'mobile',
      isTouchDevice: true
    };
  }
  
  // Desktop detection
  return {
    isMobile: false,
    os: 'desktop',
    platform: 'desktop',
    isDesktop: true
  };
};

export const isMobileDevice = () => {
  return detectMobileOS().isMobile;
};

export const isIOSDevice = () => {
  return detectMobileOS().os === 'ios';
};

export const isAndroidDevice = () => {
  return detectMobileOS().os === 'android';
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getMobileSpecificFeatures = () => {
  const mobileInfo = detectMobileOS();
  
  return {
    // PWA installation support
    supportsPWAInstall: mobileInfo.isMobile && (mobileInfo.isAndroid || mobileInfo.isIOS),
    
    // Push notification support
    supportsPushNotifications: mobileInfo.isMobile && (mobileInfo.isAndroid || mobileInfo.isIOS),
    
    // Service worker support
    supportsServiceWorker: 'serviceWorker' in navigator,
    
    // Background sync support
    supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration,
    
    // Periodic sync support
    supportsPeriodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration,
    
    // Background processing support
    supportsBackgroundProcessing: mobileInfo.isMobile && 'serviceWorker' in navigator,
    
    // Standalone app mode
    supportsStandalone: mobileInfo.isIOS ? 'standalone' in window.navigator : true,
    
    // Touch gestures
    supportsTouch: mobileInfo.isMobile,
    
    // Device orientation
    supportsOrientation: mobileInfo.isMobile && 'orientation' in window,
    
    // Vibration
    supportsVibration: mobileInfo.isMobile && 'vibrate' in navigator,
    
    // Geolocation
    supportsGeolocation: 'geolocation' in navigator,
    
    // Camera access
    supportsCamera: mobileInfo.isMobile && 'getUserMedia' in navigator,
    
    // Mobile-specific optimizations
    needsMobileOptimizations: mobileInfo.isMobile,
    
    // Platform-specific features
    platformFeatures: {
      ios: mobileInfo.isIOS ? {
        supportsSafari: true,
        supportsWebKit: true,
        supportsApplePay: 'ApplePaySession' in window,
        supportsFaceID: 'credentials' in navigator && 'preventExtensions' in navigator.credentials,
        supportsBackgroundAppRefresh: true, // iOS supports background app refresh
        supportsSilentPush: true // iOS supports silent push notifications
      } : {},
      android: mobileInfo.isAndroid ? {
        supportsChrome: true,
        supportsWebView: true,
        supportsGooglePay: 'PaymentRequest' in window,
        supportsFingerprint: 'credentials' in navigator,
        supportsBackgroundSync: true, // Android has better background sync support
        supportsWakeLocks: 'wakeLock' in navigator // Android supports wake locks
      } : {}
    }
  };
};

export const getMobileOptimizationSettings = () => {
  const mobileInfo = detectMobileOS();
  const features = getMobileSpecificFeatures();
  
  return {
    // Touch-friendly UI settings
    touchSettings: {
      minTouchTarget: 44, // iOS/Android recommended minimum touch target size
      touchFeedback: features.supportsTouch,
      swipeGestures: features.supportsTouch,
      longPressDelay: 500
    },
    
    // Performance optimizations
    performance: {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      lowDataMode: window.navigator.connection?.effectiveType === 'slow-2g' || window.navigator.connection?.effectiveType === '2g',
      batteryOptimization: 'getBattery' in navigator
    },
    
    // Display settings
    display: {
      pixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      orientation: window.screen?.orientation?.type || 'portrait',
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },
    
    // Network settings
    network: {
      connectionType: window.navigator.connection?.effectiveType || 'unknown',
      isOnline: navigator.onLine,
      isSlowConnection: window.navigator.connection?.effectiveType === 'slow-2g' || window.navigator.connection?.effectiveType === '2g'
    }
  };
};

export const optimizeForMobile = () => {
  const mobileInfo = detectMobileOS();
  const features = getMobileSpecificFeatures();
  const settings = getMobileOptimizationSettings();
  
  // Apply mobile-specific optimizations
  if (mobileInfo.isMobile) {
    // Set viewport meta tag if not already set
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(viewport);
    }
    
    // Add mobile-specific CSS classes
    document.documentElement.classList.add('mobile-device');
    document.documentElement.classList.add(`os-${mobileInfo.os}`);
    
    // Set mobile-specific CSS variables
    document.documentElement.style.setProperty('--touch-target-size', `${settings.touchSettings.minTouchTarget}px`);
    document.documentElement.style.setProperty('--mobile-optimized', 'true');
    
    // Log mobile detection for debugging
    console.log('[Mobile Detection] Device detected:', mobileInfo);
    console.log('[Mobile Detection] Features available:', features);
    console.log('[Mobile Detection] Optimization settings:', settings);
  }
  
  return {
    mobileInfo,
    features,
    settings
  };
};

export default {
  detectMobileOS,
  isMobileDevice,
  isIOSDevice,
  isAndroidDevice,
  isTouchDevice,
  getMobileSpecificFeatures,
  getMobileOptimizationSettings,
  optimizeForMobile
};
