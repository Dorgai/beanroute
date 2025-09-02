// Ultra-Simple Notification Settings Component
import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const NotificationSettings = () => {
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  
  // Use the proper push notifications hook
  const {
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    permission
  } = usePushNotifications();

  // Clear any error messages when subscription state changes
  useEffect(() => {
    if (error) {
      setTestMessage(`Error: ${error}`);
    }
  }, [error]);

  const handleToggleNotifications = async () => {
    try {
      setTestMessage('');
      
      if (!isSupported) {
        // Check if this is a mobile device with limited support
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isPWA = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        
        if (isMobile) {
          if (isIOS) {
            if (isPWA) {
              setTestMessage('⚠️ iOS PWA detected but notifications still not supported. This is a known iOS limitation. You can still receive email notifications for order updates.');
            } else {
              setTestMessage('⚠️ iOS Safari doesn\'t support push notifications. Please add this app to your home screen first, then try enabling notifications from the installed app.');
            }
          } else {
            if (isPWA) {
              setTestMessage('⚠️ Android PWA detected but notifications still not supported. Try refreshing the page or check your browser settings.');
            } else {
              setTestMessage('⚠️ Your mobile browser has limited push notification support. Try using Chrome or Firefox, or add this app to your home screen.');
            }
          }
          return;
        }
        
        setTestMessage('Push notifications are not supported in this browser');
        return;
      }

      // Check for iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && isSafari && !isStandalone) {
        setTestMessage('⚠️ Please add this app to your home screen first, then try enabling notifications from the installed app.');
        return;
      }

      if (isSubscribed) {
        // User wants to disable notifications
        console.log('[NotificationSettings] Unsubscribing from push notifications...');
        await unsubscribe();
        setTestMessage('Push notifications disabled');
      } else {
        // User wants to enable notifications
        console.log('[NotificationSettings] Subscribing to push notifications...');
        await subscribe();
        setTestMessage('Push notifications enabled! You will receive notifications for order updates.');
      }
    } catch (error) {
      console.error('[NotificationSettings] Error toggling notifications:', error);
      setTestMessage('Error: ' + error.message);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    setTestMessage('');
    
    try {
      if (!isSubscribed) {
        setTestMessage('Please enable push notifications first');
        return;
      }

      // Check for iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && isSafari && !isStandalone) {
        setTestMessage('⚠️ Please add this app to your home screen first, then try testing notifications from the installed app.');
        return;
      }

      // Send test notification via API
      console.log('[NotificationSettings] Sending test push notification...');
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test notification');
      }

      const result = await response.json();
      console.log('[NotificationSettings] Test notification result:', result);
      
      setTestMessage('Test push notification sent! Check your device notification center.');
    } catch (error) {
      console.error('[NotificationSettings] Error sending test notification:', error);
      setTestMessage('Failed to send test notification: ' + error.message);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-6 h-6 text-blue-500 mr-3 text-center text-xl">🔔</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your notification preferences
            </p>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Status</h3>
            <p className="text-sm text-gray-600">Current notification state</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isSubscribed ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        
        {/* iOS-specific message */}
        {(() => {
          if (typeof window !== 'undefined') {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
            const isPWA = isStandalone || window.matchMedia('(display-mode: standalone)').matches;
            
            if (isIOS && isSafari) {
              if (!isStandalone) {
                return (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">📱</div>
                      <div>
                        <p className="text-sm font-medium text-amber-800 mb-2">
                          <strong>iOS Safari:</strong> Add to Home Screen Required
                        </p>
                        <p className="text-sm text-amber-700 mb-3">
                          To enable push notifications on iOS, you must first add this app to your home screen:
                        </p>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                          <li>Tap the Share button <span className="inline-block">📤</span> at the bottom of Safari</li>
                          <li>Select "Add to Home Screen"</li>
                          <li>Tap "Add" to install the app</li>
                          <li>Open the app from your home screen</li>
                          <li>Return here to enable notifications</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✅ <strong>iOS PWA detected:</strong> Push notifications are now available! You can enable them below.
                    </p>
                  </div>
                );
              }
            }
            
            // Show PWA status for all devices
            if (isPWA) {
              return (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    📱 <strong>PWA Mode:</strong> You're running BeanRoute as an installed app. This provides the best experience for notifications.
                  </p>
                </div>
              );
            }
          }
          return null;
        })()}
      </div>

      {/* Actions Section */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleToggleNotifications}
              disabled={loading}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white touch-manipulation ${
                isSubscribed
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="mr-2">{isSubscribed ? '🔕' : '🔔'}</span>
              {loading 
                ? (isSubscribed ? 'Disabling...' : 'Enabling...') 
                : (isSubscribed ? 'Disable Notifications' : 'Enable Notifications')
              }
            </button>

            <button
              onClick={handleTestNotification}
              disabled={!isSubscribed || testLoading || loading}
              className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 touch-manipulation ${
                (!isSubscribed || testLoading || loading) && 'opacity-50 cursor-not-allowed'
              }`}
            >
              {testLoading ? (
                <>
                  <span className="mr-2">⏳</span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="mr-2">⚙️</span>
                  Send Test Notification
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {testMessage && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">{testMessage}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Make sure notifications are enabled in your browser settings</li>
            <li>• Try refreshing the page if notifications aren't working</li>
            <li>• Check your device's notification center</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

