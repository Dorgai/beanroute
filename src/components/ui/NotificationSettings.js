// Notification Settings Management Component
import { useState, useEffect } from 'react';
import { FiBell, FiBellOff, FiCheck, FiX, FiInfo, FiRefreshCw, FiSmartphone } from 'react-icons/fi';
import usePushNotifications from '../../hooks/usePushNotifications';

const NotificationSettings = () => {
  const {
    isSupported,
    isConfigured,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    testNotification,
    checkSubscriptionStatus
  } = usePushNotifications();

  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (isSubscribed) {
      loadSubscriptions();
    }
  }, [isSubscribed]);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/push/user-status');
      const data = await response.json();
      if (data.subscription) {
        setSubscriptions([data.subscription]);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    setTestMessage('');
    
    try {
      await testNotification();
      setTestMessage('Test notification sent! Check your device.');
    } catch (err) {
      setTestMessage(`Failed to send test: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        setTestMessage('Notifications disabled successfully.');
      } else {
        await subscribe();
        setTestMessage('Notifications enabled successfully!');
      }
    } catch (err) {
      setTestMessage(`Error: ${err.message}`);
    }
  };

  const getStatusColor = () => {
    if (!isSupported || !isConfigured) return 'gray';
    if (permission === 'denied') return 'red';
    if (isSubscribed) return 'green';
    return 'yellow';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (!isConfigured) return 'Not Configured';
    if (permission === 'denied') return 'Blocked';
    if (isSubscribed) return 'Enabled';
    if (permission === 'granted') return 'Available';
    return 'Disabled';
  };

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
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              getStatusColor() === 'green' ? 'bg-green-500' :
              getStatusColor() === 'yellow' ? 'bg-yellow-500' :
              getStatusColor() === 'red' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <div>
              <h3 className="font-medium text-gray-900">Notification Status</h3>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
            </div>
          </div>
          
          <button
            onClick={checkSubscriptionStatus}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Refresh Status"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <FiX className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Test Message */}
        {testMessage && (
          <div className={`mt-4 p-3 rounded-lg border ${
            testMessage.includes('Failed') || testMessage.includes('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            <p className="text-sm">{testMessage}</p>
          </div>
        )}
      </div>

      {/* Main Controls */}
      <div className="p-6">
        {!isSupported ? (
          <UnsupportedMessage />
        ) : !isConfigured ? (
          <NotConfiguredMessage />
        ) : permission === 'denied' ? (
          <BlockedMessage />
        ) : (
          <NotificationControls
            isSubscribed={isSubscribed}
            loading={loading}
            onToggle={handleToggleNotifications}
            onTest={handleTestNotification}
            testLoading={testLoading}
          />
        )}
      </div>

      {/* Device List */}
      {isSubscribed && subscriptions.length > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Connected Devices</h3>
          <div className="space-y-3">
            {subscriptions.map((sub, index) => (
              <DeviceCard key={sub.id} subscription={sub} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start">
          <FiInfo className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>What you'll receive notifications for:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Order status updates (confirmed, roasted, dispatched, delivered)</li>
              <li>Inventory alerts (low stock, critical levels)</li>
              <li>New messages and mentions in the message board</li>
              <li>Important system announcements</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              You can disable notifications anytime. Your data is secure and we never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for unsupported browsers
const UnsupportedMessage = () => (
  <div className="text-center py-8">
    <FiBellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Push Notifications Not Supported
    </h3>
    <p className="text-gray-600 mb-4">
      Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
    </p>
  </div>
);

// Component for unconfigured server
const NotConfiguredMessage = () => (
  <div className="text-center py-8">
    <FiInfo className="w-12 h-12 text-blue-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Notifications Not Available
    </h3>
    <p className="text-gray-600 mb-4">
      Push notifications are not configured on this server. Please contact your administrator.
    </p>
  </div>
);

// Component for blocked notifications
const BlockedMessage = () => (
  <div className="text-center py-8">
    <FiX className="w-12 h-12 text-red-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Notifications Blocked
    </h3>
    <p className="text-gray-600 mb-4">
      Notifications are currently blocked in your browser. To enable them:
    </p>
    <div className="text-left bg-gray-50 p-4 rounded-lg mb-4 max-w-md mx-auto">
      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
        <li>Click the lock or info icon in your browser's address bar</li>
        <li>Find "Notifications" and set it to "Allow"</li>
        <li>Refresh this page</li>
      </ol>
    </div>
  </div>
);

// Main notification controls
const NotificationControls = ({ isSubscribed, loading, onToggle, onTest, testLoading }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-gray-900">
          Push Notifications
        </h3>
        <p className="text-sm text-gray-600">
          {isSubscribed 
            ? 'You\'re receiving notifications on this device'
            : 'Enable notifications to stay updated'
          }
        </p>
      </div>
      
      <button
        onClick={onToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isSubscribed ? 'bg-blue-600' : 'bg-gray-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isSubscribed ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>

    {isSubscribed && (
      <button
        onClick={onTest}
        disabled={testLoading}
        className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {testLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Sending Test...
          </>
        ) : (
          <>
            <FiBell className="w-4 h-4 mr-2" />
            Send Test Notification
          </>
        )}
      </button>
    )}
  </div>
);

// Device card component
const DeviceCard = ({ subscription, index }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      return 'Mobile Device';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'iOS Device';
    } else {
      return 'Desktop Browser';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <FiSmartphone className="w-4 h-4 text-gray-500 mr-3" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {getDeviceInfo(subscription.userAgent)}
          </p>
          <p className="text-xs text-gray-500">
            Connected {formatDate(subscription.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Last used {formatDate(subscription.lastUsed)}
      </div>
    </div>
  );
};

export default NotificationSettings;

