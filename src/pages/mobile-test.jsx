import { useEffect, useState } from 'react';
import { detectMobileOS, getMobileSpecificFeatures } from '../utils/mobileDetection';

export default function MobileTestPage() {
  const [mobileInfo, setMobileInfo] = useState(null);
  const [pwaInfo, setPwaInfo] = useState(null);
  const [notificationInfo, setNotificationInfo] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get mobile detection info
      const mobile = detectMobileOS();
      setMobileInfo(mobile);

      // Get PWA info
      const pwa = {
        isStandalone: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
        isIOSStandalone: window.navigator.standalone === true,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window,
        hasNotification: 'Notification' in window,
        userAgent: navigator.userAgent
      };
      setPwaInfo(pwa);

      // Get notification info
      const notification = {
        permission: 'Notification' in window ? Notification.permission : 'not-supported',
        canRequest: 'Notification' in window && Notification.permission === 'default'
      };
      setNotificationInfo(notification);
    }
  }, []);

  const testNotification = async () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mobile Test', {
        body: 'This is a test notification from BeanRoute mobile test page',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200]
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        testNotification();
      }
    }
  };

  const testVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mobile Compatibility Test</h1>
        
        {/* Mobile Detection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Device Detection</h2>
          {mobileInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Is Mobile:</strong> {mobileInfo.isMobile ? 'Yes' : 'No'}</p>
                <p><strong>OS:</strong> {mobileInfo.os}</p>
                <p><strong>Platform:</strong> {mobileInfo.platform}</p>
              </div>
              <div>
                <p><strong>User Agent:</strong></p>
                <p className="text-sm text-gray-600 break-all">{mobileInfo.userAgent}</p>
              </div>
            </div>
          )}
        </div>

        {/* PWA Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">PWA Support</h2>
          {pwaInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Standalone Mode:</strong> {pwaInfo.isStandalone ? 'Yes' : 'No'}</p>
                <p><strong>iOS Standalone:</strong> {pwaInfo.isIOSStandalone ? 'Yes' : 'No'}</p>
                <p><strong>Service Worker:</strong> {pwaInfo.hasServiceWorker ? 'Supported' : 'Not Supported'}</p>
              </div>
              <div>
                <p><strong>Push Manager:</strong> {pwaInfo.hasPushManager ? 'Supported' : 'Not Supported'}</p>
                <p><strong>Notifications:</strong> {pwaInfo.hasNotification ? 'Supported' : 'Not Supported'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notification Testing */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notification Testing</h2>
          {notificationInfo && (
            <div className="space-y-4">
              <p><strong>Permission:</strong> {notificationInfo.permission}</p>
              <p><strong>Can Request:</strong> {notificationInfo.canRequest ? 'Yes' : 'No'}</p>
              
              <div className="flex space-x-4">
                <button
                  onClick={testNotification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 touch-manipulation"
                >
                  Test Notification
                </button>
                
                <button
                  onClick={testVibration}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 touch-manipulation"
                >
                  Test Vibration
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Installation Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Installation Instructions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">iOS (Safari)</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Tap the Share button (square with arrow pointing up)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">Android (Chrome)</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Tap the menu button (three dots)</li>
                <li>Tap "Add to Home screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Mobile Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Mobile Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Touch Optimizations</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>44px minimum touch targets</li>
                <li>Touch-friendly navigation</li>
                <li>Mobile-optimized tables</li>
                <li>Responsive design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold">PWA Features</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Offline support</li>
                <li>Push notifications</li>
                <li>Home screen installation</li>
                <li>App-like experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
