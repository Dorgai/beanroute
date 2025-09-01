import React from 'react';
import { FiBell } from 'react-icons/fi';
import { usePushNotifications } from '../../hooks/usePushNotifications';

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
