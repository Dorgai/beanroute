import React, { useState } from 'react';
import { useSession } from '@/lib/session';
import Layout from '@/components/Layout';

export default function DebugPush() {
  const { session, loading } = useSession();
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
    return <div>Unauthorized - Admin access required</div>;
  }

  const runTest = async (testType) => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/debug-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Push Notification Debug Console
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => runTest('manual_test')}
              disabled={isLoading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Manual Test'}
            </button>

            <button
              onClick={() => runTest('order_status_test')}
              disabled={isLoading}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Order Status Test'}
            </button>

            <button
              onClick={() => runTest('new_order_test')}
              disabled={isLoading}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'New Order Test'}
            </button>
          </div>

          {testResult && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">
                {testResult.success ? '✅ Test Result' : '❌ Test Failed'}
              </h3>
              
              <pre className="bg-white p-4 rounded border text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>

              {testResult.debug && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Debug Information:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Configured:</strong> {testResult.debug.isConfigured ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>Total Subscriptions:</strong> {testResult.debug.totalSubscriptions}
                    </div>
                    <div>
                      <strong>Active Subscriptions:</strong> {testResult.debug.activeSubscriptions}
                    </div>
                  </div>

                  {testResult.debug.userSubscriptions && testResult.debug.userSubscriptions.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold mb-2">User Subscriptions:</h5>
                      <div className="space-y-2">
                        {testResult.debug.userSubscriptions.map((sub, index) => (
                          <div key={index} className="flex items-center space-x-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${sub.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {sub.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span>{sub.username}</span>
                            <span className="text-gray-500">({sub.role})</span>
                            {sub.mobile && <span className="text-blue-600 text-xs">📱 Mobile</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Troubleshooting Tips:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Make sure you've enabled notifications in your browser</li>
              <li>• Check if the app is added to home screen (iOS)</li>
              <li>• Verify you have an active push subscription</li>
              <li>• Test notifications work in the notification settings page</li>
              <li>• Check browser console for any errors</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
