import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Debug logging
  console.log('[IndexPage] Auth state:', { user: user ? 'present' : 'null', loading, hasRedirected });

  useEffect(() => {
    // Immediate redirect to login - let the login page handle auth logic
    console.log('Index - Redirecting to login immediately');
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Head>
        <title>Bean Route</title>
      </Head>
      <div className="p-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Bean Route</h1>
        <p className="text-lg mb-4">Coffee management system</p>
        <p className="text-gray-600">
          {loading ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
} 