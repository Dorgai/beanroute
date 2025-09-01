// Notification Settings Management Component
import React, { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiSettings, FiRefreshCw } from 'react-icons/fi';

const NotificationSettings = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const checkNotificationSupport = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          return;
        }

        // Check basic notification support
        const hasNotification = 'Notification' in window;
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasPushManager = 'PushManager' in window;
        
        setIsSupported(hasNotification);
        
        if (hasNotification) {
          const currentPermission = Notification.permission;
          setPermission(currentPermission);
          
          // Check if already subscribed
          if (hasServiceWorker && hasPushManager) {
            try {
              const registration = await navigator.serviceWorker.ready;
              const subscription = await registration.pushManager.getSubscription();
              setIsSubscribed(!!subscription);
            } catch (error) {
              console.log('Service worker check failed:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking notification support:', error);
      } finally {
        setLoading(false);
      }
    };

    checkNotificationSupport();
  }, []);

  const requestPermission = async () => {
    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      setTestMessage(`Permission ${newPermission}`);
    } catch (error) {
      console.error('Error requesting permission:', error);
      setTestMessage('Error requesting permission');
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    setTestMessage('');
    
    try {
      if (permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from BeanRoute',
          icon: '/images/sonic-beans-logo.svg'
        });
        setTestMessage('Test notification sent! Check your device.');
      } else {
        setTestMessage('Please enable notifications first');
      }
    } catch (err) {
      setTestMessage(`Failed to send test: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      if (permission === 'default') {
        await requestPermission();
      } else if (permission === 'granted') {
        setIsSubscribed(!isSubscribed);
        setTestMessage(isSubscribed ? 'Notifications disabled' : 'Notifications enabled');
      }
    } catch (err) {
      setTestMessage(`Error: ${err.message}`);
    }
  };

  const getStatusColor = () => {
    if (!isSupported) return 'gray';
    if (permission === 'denied') return 'red';
    if (isSubscribed) return 'green';
    return 'yellow';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (permission === 'denied') return 'Blocked';
    if (isSubscribed) return 'Enabled';
    if (permission === 'granted') return 'Available';
    return 'Disabled';
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
          <FiBell className="w-6 h-6 text-blue-500 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your notification preferences and devices
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
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor()}-100 text-${getStatusColor()}-800`}>
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleToggleNotifications}
              disabled={!isSupported || permission === 'denied'}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !isSupported || permission === 'denied'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isSubscribed
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubscribed ? (
                <>
                  <FiBellOff className="w-4 h-4 mr-2" />
                  Disable Notifications
                </>
              ) : (
                <>
                  <FiBell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </button>

            <button
              onClick={handleTestNotification}
              disabled={!isSupported || permission !== 'granted' || testLoading}
              className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                (!isSupported || permission !== 'granted' || testLoading) && 'opacity-50 cursor-not-allowed'
              }`}
            >
              {testLoading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FiSettings className="w-4 h-4 mr-2" />
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

