// Notification Status Badge Component
import React, { useState } from 'react';
import { FiBell, FiBellOff, FiSettings } from 'react-icons/fi';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function NotificationStatusBadge({ size = 'md' }) {
  const {
    isSupported,
    isConfigured,
    isSubscribed,
    permission,
    loading,
    error,
    canSubscribe,
    needsPermission,
    permissionDenied,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
    testBasicNotification,
    refreshSubscriptionStatus,
    ensureServiceWorkerControl,
    getDeviceInfo
  } = usePushNotifications();

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Get device info for mobile-specific logic
  const deviceInfo = getDeviceInfo();
  const isMobile = deviceInfo.isMobile;
  const isIOS = deviceInfo.isIOS;

  // Determine if the badge should be shown
  const shouldShow = () => {
    // Always show on mobile for debugging purposes
    if (isMobile) {
      return true;
    }
    
    // On desktop, show if supported and configured
    return isSupported && isConfigured;
  };

  // Determine if the badge can be clicked
  const canClick = () => {
    // On mobile, always allow clicking for debugging
    if (isMobile) {
      return true;
    }
    
    // On desktop, only if fully supported
    return isSupported && isConfigured;
  };

  // Get status text
  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (error) return `Error: ${error}`;
    if (!isSupported) return 'Not supported';
    if (!isConfigured) return 'Not configured';
    if (permission === 'denied') return 'Permission denied';
    if (needsPermission) return 'Permission needed';
    if (isSubscribed) return 'Notifications enabled';
    return 'Notifications disabled';
  };

  // Get badge color
  const getBadgeColor = () => {
    if (loading) return 'bg-gray-400';
    if (error) return 'bg-red-500';
    if (!isSupported || !isConfigured) return 'bg-gray-400';
    if (permission === 'denied') return 'bg-red-500';
    if (needsPermission) return 'bg-yellow-500';
    if (isSubscribed) return 'bg-green-500';
    return 'bg-gray-400';
  };

  // Handle badge click
  const handleBadgeClick = () => {
    if (!canClick()) return;
    
    if (isMobile) {
      // On mobile, always show debug panel
      setShowDebugPanel(!showDebugPanel);
    } else {
      // On desktop, handle normal flow
      if (needsPermission) {
        requestPermission();
      } else if (canSubscribe && !isSubscribed) {
        subscribe();
      } else if (isSubscribed) {
        unsubscribe();
      }
    }
  };

  // Handle test notification
  const onTest = async () => {
    try {
      setTestLoading(true);
      await testNotification();
    } catch (error) {
      console.error('Test notification failed:', error);
    } finally {
      setTestLoading(false);
    }
  };

  // Handle basic notification test
  const handleBasicNotificationTest = async () => {
    try {
      setTestLoading(true);
      await testBasicNotification();
    } catch (error) {
      console.error('Basic notification test failed:', error);
    } finally {
      setTestLoading(false);
    }
  };

  // Don't render if we shouldn't show the badge
  if (!shouldShow()) {
    return null;
  }

  // Small badge (for mobile header)
  if (size === 'sm') {
    return (
      <div className="relative">
        <button
          onClick={handleBadgeClick}
          disabled={!canClick()}
          className={`w-8 h-8 rounded-full ${getBadgeColor()} text-white flex items-center justify-center transition-colors ${
            canClick() ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
          title={getStatusText()}
        >
          {isSubscribed ? <FiBell className="w-4 h-4" /> : <FiBellOff className="w-4 h-4" />}
        </button>
        
        {/* Debug panel for mobile */}
        {isMobile && showDebugPanel && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Mobile Debug Panel</h3>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <strong>Device:</strong> {isIOS ? 'iOS' : 'Android'} Mobile
              </div>
              <div>
                <strong>Status:</strong> {getStatusText()}
              </div>
              <div>
                <strong>Permission:</strong> {permission}
              </div>
              <div>
                <strong>Supported:</strong> {isSupported ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Configured:</strong> {isConfigured ? 'Yes' : 'No'}
              </div>
              
              {error && (
                <div className="text-red-600">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              <div className="pt-2 space-y-2">
                <button
                  onClick={refreshSubscriptionStatus}
                  className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                >
                  Refresh Status
                </button>
                
                <button
                  onClick={ensureServiceWorkerControl}
                  className="w-full px-3 py-2 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                >
                  Ensure SW Control
                </button>
                
                {isSubscribed && (
                  <button
                    onClick={onTest}
                    disabled={testLoading}
                    className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
                  >
                    {testLoading ? 'Testing...' : 'Test Notification'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Medium badge (for desktop header)
  return (
    <div className="relative">
      <button
        onClick={handleBadgeClick}
        disabled={!canClick()}
        className={`px-3 py-2 rounded-lg ${getBadgeColor()} text-white flex items-center space-x-2 transition-colors ${
          canClick() ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-50'
        }`}
        title={getStatusText()}
      >
        {isSubscribed ? <FiBell className="w-4 h-4" /> : <FiBellOff className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {isSubscribed ? 'Enabled' : 'Disabled'}
        </span>
      </button>
      
      {/* Debug panel for mobile */}
      {isMobile && showDebugPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Mobile Debug Panel</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3 text-xs">
            <div>
              <strong>Device:</strong> {isIOS ? 'iOS' : 'Android'} Mobile
            </div>
            <div>
              <strong>Status:</strong> {getStatusText()}
            </div>
            <div>
              <strong>Permission:</strong> {permission}
            </div>
            <div>
              <strong>Supported:</strong> {isSupported ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Configured:</strong> {isConfigured ? 'Yes' : 'No'}
            </div>
            
            {error && (
              <div className="text-red-600">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            <div className="pt-2 space-y-2">
              <button
                onClick={refreshSubscriptionStatus}
                className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
              >
                Refresh Status
              </button>
              
              <button
                onClick={ensureServiceWorkerControl}
                className="w-full px-3 py-2 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
              >
                Ensure SW Control
              </button>
              
              {isSubscribed && (
                <button
                  onClick={onTest}
                  disabled={testLoading}
                  className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
                >
                  {testLoading ? 'Testing...' : 'Test Notification'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the banner component as well
export function NotificationBanner() {
  const { isSubscribed, canSubscribe, needsPermission, requestPermission, subscribe } = usePushNotifications();

  if (isSubscribed || !canSubscribe) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FiBell className="w-5 h-5 text-blue-400 mr-2" />
          <p className="text-sm text-blue-700">
            {needsPermission 
              ? 'Enable push notifications to stay updated'
              : 'Stay updated with push notifications'
            }
          </p>
        </div>
        <button
          onClick={needsPermission ? requestPermission : subscribe}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {needsPermission ? 'Enable' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

