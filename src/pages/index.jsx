import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/session';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading) {
      if (session) {
        console.log('Index - User session found, redirecting to orders');
        router.push('/orders');
      } else {
        console.log('Index - No user session, redirecting to login');
        router.push('/login');
      }
    }
  }, [router, session, loading]);

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