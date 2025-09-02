import { useState } from 'react';
import { useSession } from '../../lib/session';

export default function DebugPush() {
  const { session } = useSession();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
    return <div className="p-4">Access denied. Admin/Owner only.</div>;
  }

  const runTest = async (testName, endpoint, method = 'GET', data = null) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: data ? JSON.stringify(data) : undefined
      });
      
      const result = await response.json();
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: response.ok, 
          status: response.status,
          data: result 
        }
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error.message 
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Push Notification Debug Panel</h1>
      
      <div className="grid gap-4">
        {/* VAPID Configuration */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">1. VAPID Configuration</h2>
          <button
            onClick={() => runTest('vapid', '/api/admin/debug-vapid', 'GET')}
            disabled={loading.vapid}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.vapid ? 'Checking...' : 'Check VAPID Keys'}
          </button>
          {results.vapid && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(results.vapid, null, 2)}
            </pre>
          )}
        </div>

        {/* Push Subscriptions */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">2. Active Push Subscriptions</h2>
          <button
            onClick={() => runTest('subscriptions', '/api/admin/debug-push-subscriptions', 'GET')}
            disabled={loading.subscriptions}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading.subscriptions ? 'Fetching...' : 'Check Subscriptions'}
          </button>
          {results.subscriptions && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(results.subscriptions, null, 2)}
            </pre>
          )}
        </div>

        {/* Test Push Notification */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">3. Test Push Notification</h2>
          <button
            onClick={() => runTest('testPush', '/api/push/test', 'POST')}
            disabled={loading.testPush}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading.testPush ? 'Sending...' : 'Send Test Push'}
          </button>
          {results.testPush && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(results.testPush, null, 2)}
            </pre>
          )}
        </div>

        {/* Test Status Change Notification */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">4. Test Status Change Notification</h2>
          <button
            onClick={() => runTest('testStatusPush', '/api/admin/test-status-push', 'POST')}
            disabled={loading.testStatusPush}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading.testStatusPush ? 'Sending...' : 'Send Test Status Change'}
          </button>
          {results.testStatusPush && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(results.testStatusPush, null, 2)}
            </pre>
          )}
        </div>

        {/* Browser Console Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">5. Browser Console Test</h2>
          <button
            onClick={() => {
              console.log('=== PUSH NOTIFICATION DEBUG TEST ===');
              console.log('Service Worker:', 'serviceWorker' in navigator);
              console.log('PushManager:', 'PushManager' in window);
              console.log('Notification:', 'Notification' in window);
              console.log('Permission:', Notification.permission);
              
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  console.log('Service Worker Registration:', registration);
                  console.log('Service Worker Controller:', navigator.serviceWorker.controller);
                  return registration.pushManager.getSubscription();
                }).then(subscription => {
                  console.log('Push Subscription:', subscription);
                  if (subscription) {
                    console.log('Subscription Endpoint:', subscription.endpoint);
                    console.log('Subscription Keys:', subscription.keys);
                  }
                }).catch(error => {
                  console.error('Service Worker Error:', error);
                });
              }
              
              // Test local notification
              if (Notification.permission === 'granted') {
                new Notification('Test Local Notification', {
                  body: 'This is a test notification from the browser console',
                  icon: '/icons/icon-192x192.png'
                });
              }
              
              alert('Check the browser console for detailed push notification debug information');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Run Browser Console Test
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Click this button to test push notification support directly in the browser console.
          </p>
        </div>
      </div>
    </div>
  );
}