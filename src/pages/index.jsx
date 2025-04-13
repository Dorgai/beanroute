import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in a redirection loop
    if (typeof window !== 'undefined') {
      // We'll use sessionStorage to track redirects to prevent loops
      const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0');
      
      if (redirectCount > 3) {
        console.error('Detected possible redirection loop, stopping redirects');
        sessionStorage.removeItem('redirectCount');
        setLoading(false);
        return;
      }
      
      sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
      
      // Clear the counter after 5 seconds
      setTimeout(() => {
        sessionStorage.removeItem('redirectCount');
      }, 5000);
      
      try {
        console.log('Checking user login state');
        const userData = localStorage.getItem('user');
        
        if (userData) {
          // If logged in, redirect to dashboard
          console.log('User found in localStorage, redirecting to dashboard');
          window.location.href = '/dashboard';
        } else {
          // If not logged in, redirect to login
          console.log('No user found, redirecting to login');
          window.location.href = '/login?redirected=true';
        }
      } catch (err) {
        console.error('Error checking login state:', err);
        // On any error, default to login page
        window.location.href = '/login?redirected=true';
      }
    }
  }, []);

  // Show a simple loading indicator
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Head>
        <title>User Management System</title>
      </Head>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">User Management System</h1>
        <p className="mb-8 text-gray-600">Loading application...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
} 