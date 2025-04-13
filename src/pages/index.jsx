import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by looking for user data in localStorage
    try {
      const userData = localStorage.getItem('user');
      
      if (userData) {
        // If logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If not logged in, redirect to login
        router.push('/login');
      }
    } catch (err) {
      console.error('Error checking login state:', err);
      // On any error, default to login page
      router.push('/login');
    }
  }, [router]);

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