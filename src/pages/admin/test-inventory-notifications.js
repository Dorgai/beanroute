import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function TestInventoryNotifications() {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testFetch = async () => {
      try {
        console.log('[test] Starting test fetch...');
        setStatus('Testing direct debug endpoint...');
        
        const response = await fetch('/api/debug/check-inventory-table');
        console.log('[test] Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('[test] Raw response:', result);
          setData(result);
          setStatus('Success! Data fetched.');
        } else {
          const errorText = await response.text();
          console.error('[test] Response error:', errorText);
          setError(`HTTP ${response.status}: ${errorText}`);
          setStatus('Failed to fetch data');
        }
      } catch (err) {
        console.error('[test] Fetch error:', err);
        setError(err.message);
        setStatus('Error occurred');
      }
    };

    testFetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Test Inventory Notifications
        </h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Debug Information</h2>
          
          <div className="space-y-4">
            <div>
              <span className="font-medium">Status: </span>
              <span className={`px-2 py-1 rounded text-sm ${
                status.includes('Success') ? 'bg-green-100 text-green-800' :
                status.includes('Error') || status.includes('Failed') ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <h3 className="font-medium text-red-800">Error:</h3>
                <pre className="text-sm text-red-700 mt-1">{error}</pre>
              </div>
            )}

            {data && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <h3 className="font-medium text-gray-800 mb-2">Response Data:</h3>
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h3 className="font-medium text-gray-800 mb-2">Expected Data Structure:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code>data.success</code> should be true</li>
              <li>• <code>data.shops.data</code> should contain shop array</li>
              <li>• <code>data.notifications.data</code> should contain your notification</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
