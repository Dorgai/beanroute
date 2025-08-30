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
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  // Show mobile-specific installation instructions
  if (mobileInfo?.isMobile && !deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">📱</span>
            </div>
            <div>
              <h3 className="font-semibold">Add to Home Screen</h3>
              <p className="text-sm text-green-100">
                {mobileInfo.os === 'ios' 
                  ? 'Tap Share → Add to Home Screen'
                  : 'Tap Menu → Add to Home Screen'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm text-green-200 hover:text-white transition-colors"
          >
            Got it
          </button>
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
