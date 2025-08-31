// Notification Status Badge Component
import { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiInfo, FiRefreshCw, FiSettings, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import usePushNotifications from '../../hooks/usePushNotifications';
import PushNotificationDialog from './PushNotificationDialog';

const NotificationStatusBadge = ({ showText = false, size = 'md' }) => {
  const {
    isSupported,
    isConfigured,
    isSubscribed,
    needsPermission,
    permissionDenied,
    loading,
    error,
    subscription,
    permission,
    refreshSubscriptionStatus,
    getDeviceInfo,
    testBasicNotification
  } = usePushNotifications();

  const [showDialog, setShowDialog] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Debug logging for mobile troubleshooting
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log('[NotificationBadge] Debug info:', {
      isSupported,
      isConfigured,
      isSubscribed,
      needsPermission,
      permissionDenied,
      loading,
      isMobile,
      isIOS,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, [isSupported, isConfigured, isSubscribed, needsPermission, permissionDenied, loading]);

  // On mobile, always show the badge for debugging purposes
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Don't show badge if not supported or not configured (except on mobile for debugging)
  if (!isSupported || !isConfigured) {
    if (isMobile) {
      console.log('[NotificationBadge] Mobile device - showing badge for debugging even though:', { isSupported, isConfigured });
    } else {
      console.log('[NotificationBadge] Hidden because:', { isSupported, isConfigured });
      return null;
    }
  }

  const handleClick = () => {
    if (isMobile && (!isSupported || !isConfigured)) {
      // On mobile, show debug info when clicked
      setShowDebugPanel(!showDebugPanel);
      return;
    }
    
    if (needsPermission || !isSubscribed) {
      setShowDialog(true);
    }
  };

  const handleRefresh = async () => {
    try {
      setLastChecked(new Date().toISOString());
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('[NotificationBadge] Error refreshing subscription status:', error);
    }
  };

  const handleTestBasicNotification = async () => {
    try {
      await testBasicNotification();
    } catch (error) {
      console.error('[NotificationBadge] Error testing basic notification:', error);
    }
  };

  const getIcon = () => {
    const iconClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    
    if (permissionDenied) {
      return <FiBellOff className={`${iconClass} text-red-500`} />;
    } else if (isSubscribed) {
      return <FiBell className={`${iconClass} text-green-500`} />;
    } else {
      return <FiBell className={`${iconClass} text-yellow-500`} />;
    }
  };

  const getStatusText = () => {
    if (permissionDenied) return 'Notifications blocked';
    if (isSubscribed) return 'Notifications enabled';
    if (isMobile && (!isSupported || !isConfigured)) return 'Mobile Debug';
    return 'Enable notifications';
  };

  const getTooltip = () => {
    if (permissionDenied) return 'Notifications are blocked in your browser';
    if (isSubscribed) return 'You\'re receiving push notifications';
    if (isMobile && (!isSupported || !isConfigured)) return 'Mobile device - checking support';
    return 'Click to enable push notifications';
  };

  const getBadgeColor = () => {
    if (permissionDenied) return 'bg-red-100 text-red-700 border-red-200';
    if (isSubscribed) return 'bg-green-100 text-green-700 border-green-200';
    if (isMobile && (!isSupported || !isConfigured)) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200';
  };

  const canClick = isMobile ? true : (needsPermission || !isSubscribed);

  if (showText) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClick}
            disabled={loading}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors ${getBadgeColor()} ${
              canClick ? 'cursor-pointer' : 'cursor-default'
            } ${loading ? 'opacity-50' : ''}`}
            title={getTooltip()}
          >
            {getIcon()}
            <span className="ml-2">{getStatusText()}</span>
            {needsPermission && (
              <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                New
              </span>
            )}
          </button>
          
          {/* Refresh button for debugging */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh subscription status"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Debug panel toggle */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Toggle debug panel"
          >
            {showDebugPanel ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm">
            <h4 className="font-semibold mb-2 text-gray-700">Debug Information</h4>
            <div className="space-y-2 text-xs">
              <div><strong>Device:</strong> {isMobile ? 'Mobile' : 'Desktop'}</div>
              <div><strong>Status:</strong> {isSubscribed ? 'Subscribed' : 'Not Subscribed'}</div>
              <div><strong>Permission:</strong> {permission}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
              <div><strong>Last Checked:</strong> {lastChecked || 'Never'}</div>
              <div><strong>Subscription:</strong> {subscription ? 'Present' : 'None'}</div>
              <div><strong>Supported:</strong> {isSupported ? 'Yes' : 'No'}</div>
              <div><strong>Configured:</strong> {isConfigured ? 'Yes' : 'No'}</div>
              <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</div>
            </div>
            
            <div className="mt-3 space-x-2">
              <button
                onClick={handleTestBasicNotification}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Test Basic Notification
              </button>
              <button
                onClick={handleRefresh}
                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              >
                Refresh Status
              </button>
              {isMobile && (
                <button
                  onClick={() => console.log('Device Info:', getDeviceInfo())}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  Log Device Info
                </button>
              )}
            </div>
          </div>
        )}
        
        <PushNotificationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSuccess={() => setShowDialog(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-1">
        <button
          onClick={handleClick}
          disabled={loading}
          className={`relative inline-flex items-center justify-center p-2 rounded-full transition-colors ${
            canClick 
              ? 'hover:bg-gray-100 cursor-pointer' 
              : 'cursor-default'
          } ${loading ? 'opacity-50' : ''}`}
          title={getTooltip()}
        >
          {getIcon()}
          
          {/* Notification dot for available notifications */}
          {needsPermission && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              !
            </span>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
        </button>
        
        {/* Refresh button for debugging */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh subscription status"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Debug panel toggle */}
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Toggle debug panel"
        >
          {showDebugPanel ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Debug Panel for non-text version */}
      {showDebugPanel && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm">
          <h4 className="font-semibold mb-2 text-gray-700">Debug Information</h4>
          <div className="space-y-2 text-xs">
            <div><strong>Device:</strong> {isMobile ? 'Mobile' : 'Desktop'}</div>
            <div><strong>Status:</strong> {isSubscribed ? 'Subscribed' : 'Not Subscribed'}</div>
            <div><strong>Permission:</strong> {permission}</div>
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {error || 'None'}</div>
            <div><strong>Last Checked:</strong> {lastChecked || 'Never'}</div>
            <div><strong>Subscription:</strong> {subscription ? 'Present' : 'None'}</div>
            <div><strong>Supported:</strong> {isSupported ? 'Yes' : 'No'}</div>
            <div><strong>Configured:</strong> {isConfigured ? 'Yes' : 'No'}</div>
            <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</div>
          </div>
          
          <div className="mt-3 space-x-2">
            <button
              onClick={handleTestBasicNotification}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Test Basic Notification
            </button>
            <button
              onClick={handleRefresh}
              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              Refresh Status
            </button>
            {isMobile && (
              <button
                onClick={() => console.log('Device Info:', getDeviceInfo())}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Log Device Info
              </button>
            )}
          </div>
        </div>
      )}
      
      <PushNotificationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={() => setShowDialog(false)}
      />
    </>
  );
};

// Notification banner for prominent placement
export const NotificationBanner = ({ onDismiss }) => {
  const {
    isSupported,
    isConfigured,
    needsPermission,
    permissionDenied
  } = usePushNotifications();

  const [showDialog, setShowDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if not applicable
  if (!isSupported || !isConfigured || permissionDenied || dismissed) {
    return null;
  }

  // Only show for users who need permission
  if (!needsPermission) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleEnable = () => {
    setShowDialog(true);
  };

  return (
    <>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700">
              <strong>Stay updated!</strong> Enable notifications to get instant alerts about orders, inventory, and messages.
            </p>
          </div>
          <div className="ml-4 flex space-x-2">
            <button
              onClick={handleEnable}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-400 hover:text-blue-600 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
      
      <PushNotificationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={() => {
          setShowDialog(false);
          handleDismiss();
        }}
      />
    </>
  );
};

export default NotificationStatusBadge;

