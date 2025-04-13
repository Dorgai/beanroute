import React, { useEffect } from 'react';

export default function Logout() {
  useEffect(() => {
    // Clear all related authentication data
    try {
      console.log('Logging out user...');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Also make a request to the logout API endpoint
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => {
        console.error('Error calling logout API:', err);
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.replace('/login');
      }, 200);
    } catch (err) {
      console.error('Error during logout:', err);
      // Force redirect even if there was an error
      window.location.replace('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-medium text-gray-900">Logging out...</h2>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <p className="mt-4 text-gray-600">
          You will be redirected to the login page.
        </p>
      </div>
    </div>
  );
} 