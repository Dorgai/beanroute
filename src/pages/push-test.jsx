import { useState, useEffect } from 'react';
import usePushNotifications from '../hooks/usePushNotifications';

const PushTestPage = () => {
  const {
    isSupported,
    isConfigured,
    isSubscribed,
    permission,
    loading,
    error,
    subscription,
    subscribe,
    unsubscribe,
    testNotification,
    checkSubscriptionStatus,
    refreshSubscriptionStatus,
    ensureServiceWorkerControl
  } = usePushNotifications();

  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      permission: Notification.permission,
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
  }, []);

  const handleSubscribe = async () => {
    try {
      console.log('Starting subscription...');
      await subscribe();
      console.log('Subscription successful');
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Subscription failed:', error);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      console.log('Starting unsubscription...');
      await unsubscribe();
      console.log('Unsubscription successful');
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Unsubscription failed:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      console.log('Test notification sent');
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const handleSimpleNotification = () => {
    try {
      // Test basic browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Simple Test', {
          body: 'This is a simple browser notification test',
          icon: '/icons/icon-192x192.png',
          tag: 'simple-test'
        });
        
        console.log('Simple notification created:', notification);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      } else {
        console.error('Cannot create simple notification:', {
          supported: 'Notification' in window,
          permission: Notification.permission
        });
      }
    } catch (error) {
      console.error('Simple notification failed:', error);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await refreshSubscriptionStatus();
      console.log('Status refreshed');
    } catch (error) {
      console.error('Status refresh failed:', error);
    }
  };

  const handleEnsureSWControl = async () => {
    try {
      await ensureServiceWorkerControl();
      console.log('Service worker control ensured');
    } catch (error) {
      console.error('Service worker control failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Push Notification Test Page</h1>
        
        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Browser Support:</strong>
              <ul className="mt-2 space-y-1">
                <li>Service Worker: {debugInfo.serviceWorker ? '✅' : '❌'}</li>
                <li>Push Manager: {debugInfo.pushManager ? '✅' : '❌'}</li>
                <li>Notification: {debugInfo.notification ? '✅' : '❌'}</li>
              </ul>
            </div>
            <div>
              <strong>Current State:</strong>
              <ul className="mt-2 space-y-1">
                <li>Permission: {debugInfo.permission}</li>
                <li>Supported: {isSupported ? '✅' : '❌'}</li>
                <li>Configured: {isConfigured ? '✅' : '❌'}</li>
                <li>Subscribed: {isSubscribed ? '✅' : '❌'}</li>
                <li>Loading: {loading ? '🔄' : '⏸️'}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4">
            <strong>User Agent:</strong>
            <p className="text-xs text-gray-600 mt-1 break-all">{debugInfo.userAgent}</p>
          </div>
          
          <div className="mt-4">
            <strong>Timestamp:</strong>
            <p className="text-xs text-gray-600 mt-1">{debugInfo.timestamp}</p>
          </div>
        </div>

        {/* Subscription Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSubscribe}
              disabled={loading || isSubscribed}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Subscribe
            </button>
            
            <button
              onClick={handleUnsubscribe}
              disabled={loading || !isSubscribed}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unsubscribe
            </button>
            
            <button
              onClick={handleTestNotification}
              disabled={loading || !isSubscribed}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test
            </button>
            
            <button
              onClick={handleSimpleNotification}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Simple Test
            </button>
            
            <button
              onClick={handleRefreshStatus}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Refresh Status
            </button>
            
            <button
              onClick={handleEnsureSWControl}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Ensure SW Control
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Subscription Details */}
        {subscription && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
            <div className="text-sm space-y-2">
              <div>
                <strong>Endpoint:</strong>
                <p className="text-gray-600 break-all">{subscription.endpoint}</p>
              </div>
              <div>
                <strong>Keys:</strong>
                <p className="text-gray-600 break-all">
                  p256dh: {subscription.keys?.p256dh}<br/>
                  auth: {subscription.keys?.auth}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Console Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-800 font-medium">Debug Instructions</h3>
          <p className="text-yellow-700 text-sm mt-1">
            Open the browser console (F12) to see detailed logs of the subscription process.
            Look for messages starting with "[Push Hook]" to track what's happening.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PushTestPage;
