import React, { useEffect } from 'react';

// This component will simply redirect to the static HTML login page
export default function StaticRedirect() {
  useEffect(() => {
    // Redirect to static login page
    window.location.href = '/static-login.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium">Redirecting to login...</h2>
        <p className="mt-2">
          If you are not redirected, <a href="/static-login.html" className="text-blue-600 underline">click here</a>.
        </p>
      </div>
    </div>
  );
} 