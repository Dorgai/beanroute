import React, { useState, useEffect } from 'react';

export default function DebugSimple() {
  const [status, setStatus] = useState('Loading...');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testFetch = async () => {
      try {
        console.log('[simple-debug] Starting test fetch...');
        setStatus('Testing debug endpoint...');
        
        const response = await fetch('/api/debug/check-inventory-table');
        console.log('[simple-debug] Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('[simple-debug] Raw response:', result);
          setData(result);
          setStatus('Success! Data fetched.');
        } else {
          const errorText = await response.text();
          console.error('[simple-debug] Response error:', errorText);
          setError(`HTTP ${response.status}: ${errorText}`);
          setStatus('Failed to fetch data');
        }
      } catch (err) {
        console.error('[simple-debug] Fetch error:', err);
        setError(err.message);
        setStatus('Error occurred');
      }
    };

    testFetch();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Debug Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status: </strong>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px',
          backgroundColor: status.includes('Success') ? '#d4edda' : 
                          status.includes('Error') || status.includes('Failed') ? '#f8d7da' : '#fff3cd'
        }}>
          {status}
        </span>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          padding: '12px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong>
          <pre style={{ margin: '8px 0 0 0', fontSize: '12px' }}>{error}</pre>
        </div>
      )}

      {data && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          padding: '12px', 
          borderRadius: '4px' 
        }}>
          <strong>Response Data:</strong>
          <pre style={{ 
            fontSize: '12px', 
            overflow: 'auto', 
            margin: '8px 0 0 0',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
        <h3>Expected Data Structure:</h3>
        <ul style={{ fontSize: '14px' }}>
          <li><code>data.success</code> should be true</li>
          <li><code>data.shops.data</code> should contain shop array</li>
          <li><code>data.notifications.data</code> should contain your notification</li>
        </ul>
      </div>
    </div>
  );
}







