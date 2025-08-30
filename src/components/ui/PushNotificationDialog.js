// Push Notification Permission Dialog
import { useState } from 'react';
import { FiBell, FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import usePushNotifications from '../../hooks/usePushNotifications';

const PushNotificationDialog = ({ isOpen, onClose, onSuccess }) => {
  const {
    isSupported,
    isConfigured,
    needsPermission,
    permissionDenied,
    subscribe,
    loading,
    error
  } = usePushNotifications();

  const [step, setStep] = useState('intro'); // intro, permission, success, error

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    try {
      setStep('permission');
      await subscribe();
      setStep('success');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('intro');
    onClose();
  };

  // Show different content based on support and configuration
  if (!isSupported) {
    return (
      <NotificationDialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Notifications Not Supported"
        icon={<FiAlertCircle className="w-12 h-12 text-red-500" />}
        content={
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your browser doesn't support push notifications. Please try using a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        }
        actions={
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        }
      />
    );
  }

  if (!isConfigured) {
    return (
      <NotificationDialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Notifications Not Available"
        icon={<FiInfo className="w-12 h-12 text-blue-500" />}
        content={
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Push notifications are not configured on this server. Please contact your administrator.
            </p>
          </div>
        }
        actions={
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Got It
          </button>
        }
      />
    );
  }

  if (permissionDenied) {
    return (
      <NotificationDialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Notifications Blocked"
        icon={<FiAlertCircle className="w-12 h-12 text-red-500" />}
        content={
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Notifications are currently blocked. To enable them:
            </p>
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Find "Notifications" and set it to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          </div>
        }
        actions={
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        }
      />
    );
  }

  // Main permission flow
  switch (step) {
    case 'intro':
      return (
        <NotificationDialog
          isOpen={isOpen}
          onClose={handleClose}
          title="Stay Updated with BeanRoute"
          icon={<FiBell className="w-12 h-12 text-blue-500" />}
          content={
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Get instant notifications about your orders, inventory alerts, and important updates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <FeatureCard
                  icon="📦"
                  title="Order Updates"
                  description="Know when orders are confirmed, roasted, and delivered"
                />
                <FeatureCard
                  icon="📊"
                  title="Inventory Alerts"
                  description="Get notified about low stock and critical inventory levels"
                />
                <FeatureCard
                  icon="💬"
                  title="Messages"
                  description="Never miss important team communications"
                />
              </div>
              
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <FiInfo className="inline w-4 h-4 mr-2" />
                You can change your notification preferences anytime in settings.
              </div>
            </div>
          }
          actions={
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting Up...
                  </>
                ) : (
                  <>
                    <FiBell className="w-4 h-4 mr-2" />
                    Enable Notifications
                  </>
                )}
              </button>
            </div>
          }
        />
      );

    case 'permission':
      return (
        <NotificationDialog
          isOpen={isOpen}
          onClose={handleClose}
          title="Permission Required"
          icon={<FiBell className="w-12 h-12 text-blue-500 animate-pulse" />}
          content={
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Your browser will ask for permission to show notifications. Please click "Allow" to continue.
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          }
          actions={
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          }
        />
      );

    case 'success':
      return (
        <NotificationDialog
          isOpen={isOpen}
          onClose={handleClose}
          title="Notifications Enabled!"
          icon={<FiCheck className="w-12 h-12 text-green-500" />}
          content={
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You'll now receive notifications about orders, inventory, and messages.
              </p>
              <div className="text-sm text-gray-500">
                Manage your notification preferences in Settings anytime.
              </div>
            </div>
          }
          actions={
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Great!
            </button>
          }
        />
      );

    case 'error':
      return (
        <NotificationDialog
          isOpen={isOpen}
          onClose={handleClose}
          title="Setup Failed"
          icon={<FiAlertCircle className="w-12 h-12 text-red-500" />}
          content={
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {error || 'Something went wrong while setting up notifications.'}
              </p>
              <div className="text-sm text-gray-500">
                You can try again later from Settings.
              </div>
            </div>
          }
          actions={
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          }
        />
      );

    default:
      return null;
  }
};

// Reusable dialog wrapper
const NotificationDialog = ({ isOpen, onClose, title, icon, content, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 sm:mx-0 sm:h-10 sm:w-10">
                {icon}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                  {title}
                </h3>
                <div className="mt-2">
                  {content}
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="text-2xl mb-2">{icon}</div>
    <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default PushNotificationDialog;

