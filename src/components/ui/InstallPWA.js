import { useState, useEffect } from 'react';
import { detectMobileOS, getMobileSpecificFeatures } from '../../utils/mobileDetection';

const InstallPWA = () => {
  // Don't render during server-side rendering
  if (typeof window === 'undefined') {
    return null;
  }

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mobileInfo, setMobileInfo] = useState(null);
  const [mobileFeatures, setMobileFeatures] = useState(null);

  useEffect(() => {
    // Detect mobile device and features
    const mobileInfo = detectMobileOS();
    const mobileFeatures = getMobileSpecificFeatures();
    setMobileInfo(mobileInfo);
    setMobileFeatures(mobileFeatures);

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      // Check for iOS PWA installation
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    if (!checkIfInstalled()) {
      // Add event listeners
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      
      // For iOS, show install prompt since beforeinstallprompt doesn't fire
      if (mobileInfo?.os === 'ios') {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Use native install prompt if available
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          setIsInstalled(true);
        } else {
          console.log('[PWA] User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('[PWA] Error showing install prompt:', error);
      }
    } else {
      // Fallback: Show manual instructions
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const instructions = getInstallInstructions();
    alert(instructions);
  };

  const getInstallInstructions = () => {
    if (mobileInfo?.os === 'ios') {
      return `To install BeanRoute on iOS:
1. Tap the Share button (📤) at the bottom of Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to install the app
4. Open the app from your home screen for the best experience!`;
    } else if (mobileInfo?.os === 'android') {
      return `To install BeanRoute on Android:
1. Tap the menu button (⋮) in Chrome
2. Tap "Add to Home screen" or "Install app"
3. Confirm the installation
4. Open the app from your home screen!`;
    } else {
      return `To install BeanRoute:
1. Look for an install icon (⊕) in your browser's address bar
2. Or go to your browser's menu and look for "Install" or "Add to Home Screen"
3. Follow the prompts to install the app
4. You can then access BeanRoute from your desktop or start menu!`;
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show mobile-specific installation instructions
  if (mobileInfo?.isMobile) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">📱</span>
            </div>
            <div>
              <h3 className="font-semibold">Install BeanRoute App</h3>
              <p className="text-sm text-green-100">
                {mobileInfo.os === 'ios' 
                  ? 'Tap Share 📤 → Add to Home Screen'
                  : 'Tap Menu ⋮ → Add to Home Screen'
                }
              </p>
              {mobileInfo.os === 'ios' && (
                <p className="text-xs text-green-200 mt-1">
                  Required for push notifications!
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-sm text-green-200 hover:text-white transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors text-sm"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show Android install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">BR</span>
          </div>
          <div>
            <h3 className="font-semibold">Install BeanRoute</h3>
            <p className="text-sm text-blue-100">
              Add to home screen for quick access
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm text-blue-200 hover:text-white transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
