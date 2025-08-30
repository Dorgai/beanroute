// Notification Status Badge Component
import { useState } from 'react';
import { FiBell, FiBellOff, FiInfo } from 'react-icons/fi';
import usePushNotifications from '../../hooks/usePushNotifications';
import PushNotificationDialog from './PushNotificationDialog';

const NotificationStatusBadge = ({ showText = false, size = 'md' }) => {
  const {
    isSupported,
    isConfigured,
    isSubscribed,
    needsPermission,
    permissionDenied,
    loading
  } = usePushNotifications();

  const [showDialog, setShowDialog] = useState(false);

  // Don't show badge if not supported or not configured
  if (!isSupported || !isConfigured) {
    return null;
  }

  const handleClick = () => {
    if (needsPermission || !isSubscribed) {
      setShowDialog(true);
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
    return 'Enable notifications';
  };

  const getTooltip = () => {
    if (permissionDenied) return 'Notifications are blocked in your browser';
    if (isSubscribed) return 'You\'re receiving push notifications';
    return 'Click to enable push notifications';
  };

  const getBadgeColor = () => {
    if (permissionDenied) return 'bg-red-100 text-red-700 border-red-200';
    if (isSubscribed) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200';
  };

  const canClick = needsPermission || !isSubscribed;

  if (showText) {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={loading || !canClick}
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
      <button
        onClick={handleClick}
        disabled={loading || !canClick}
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

