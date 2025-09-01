// Ultra-Simple Notification Settings Component
import React, { useState, useEffect } from 'react';

const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Simple initialization without any complex logic
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          // Check for iOS device
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
          
          if (isIOS && isSafari) {
            // iOS Safari has limited notification support
            console.log('iOS Safari detected - limited notification support');
            setIsEnabled(false); // iOS Safari doesn't support background notifications
          } else if ('Notification' in window) {
            // Check user's stored preference first
            const storedPreference = localStorage.getItem('notifications-enabled');
            if (storedPreference !== null) {
              // User has a stored preference, use that
              const preferenceEnabled = storedPreference === 'true';
              const browserGranted = Notification.permission === 'granted';
              // Only enable if both user preference AND browser permission are true
              setIsEnabled(preferenceEnabled && browserGranted);
            } else {
              // No stored preference, use browser permission
              const browserEnabled = Notification.permission === 'granted';
              setIsEnabled(browserEnabled);
              // Store initial preference
              localStorage.setItem('notifications-enabled', browserEnabled.toString());
            }
          } else {
            console.log('Notifications not supported in this browser');
          }
        }
      } catch (error) {
        console.error('Error initializing notification settings:', error);
      } finally {
        setLoading(false);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  const handleToggleNotifications = async () => {
    try {
      if (typeof window === 'undefined') {
        setTestMessage('Not available in server-side rendering');
        return;
      }

      // Check for iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isIOS && isSafari) {
        setTestMessage('iOS Safari has limited notification support. Notifications only work when the app is open.');
        return;
      }
      
      if (!('Notification' in window)) {
        setTestMessage('Notifications not supported in this browser');
        return;
      }

      if (isEnabled) {
        // User wants to disable notifications
        setIsEnabled(false);
        localStorage.setItem('notifications-enabled', 'false');
        setTestMessage('Notifications disabled');
      } else {
        // User wants to enable notifications
        if (Notification.permission === 'default') {
          // Need to request permission first
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            setIsEnabled(true);
            localStorage.setItem('notifications-enabled', 'true');
            setTestMessage('Notifications enabled!');
          } else {
            setIsEnabled(false);
            localStorage.setItem('notifications-enabled', 'false');
            setTestMessage('Notifications blocked');
          }
        } else if (Notification.permission === 'granted') {
          // Permission already granted, just enable
          setIsEnabled(true);
          localStorage.setItem('notifications-enabled', 'true');
          setTestMessage('Notifications enabled!');
        } else {
          // Permission denied
          setTestMessage('Notifications are blocked. Please enable them in your browser settings.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setTestMessage('Error: ' + error.message);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    setTestMessage('');
    
    try {
      if (typeof window === 'undefined') {
        setTestMessage('Not available in server-side rendering');
        return;
      }

      // Check for iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      if (isIOS && isSafari) {
        setTestMessage('iOS Safari has limited notification support. Notifications only work when the app is open.');
        return;
      }
      
      if (!('Notification' in window)) {
        setTestMessage('Notifications not supported');
        return;
      }

      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from BeanRoute',
          icon: '/icons/icon-192x192.png'
        });
        setTestMessage('Test notification sent! Check your device.');
      } else {
        setTestMessage('Please enable notifications first');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestMessage('Failed to send test: ' + error.message);
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
            isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        
        {/* iOS-specific message */}
        {(() => {
          if (typeof window !== 'undefined') {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            
            if (isIOS && isSafari) {
              return (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    📱 <strong>iOS Safari detected:</strong> Notifications have limited support and only work when the app is open.
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
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white touch-manipulation ${
                isEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span className="mr-2">{isEnabled ? '🔕' : '🔔'}</span>
              {isEnabled ? 'Disable Notifications' : 'Enable Notifications'}
            </button>

            <button
              onClick={handleTestNotification}
              disabled={!isEnabled || testLoading}
              className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 touch-manipulation ${
                (!isEnabled || testLoading) && 'opacity-50 cursor-not-allowed'
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

