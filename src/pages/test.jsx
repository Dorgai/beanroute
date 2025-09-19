import React from 'react';

export default function TestPage() {
  console.log('[TestPage] Rendering test page');
  
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>Test Page</h1>
      <p>This is a minimal test page with no hooks, no contexts, no API calls.</p>
      <p>If this page also reloads infinitely, the issue is with Next.js or React itself.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

