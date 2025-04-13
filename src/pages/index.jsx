import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  // Server-side rendering - only do client-side redirect
  useEffect(() => {
    // Simple direct redirect to login
    window.location.href = '/login';
  }, []);

  // Simple static page
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Head>
        <title>User Management System</title>
      </Head>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">User Management System</h1>
        <p className="mb-8 text-gray-600">Redirecting to login...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
} 