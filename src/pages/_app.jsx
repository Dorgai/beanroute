import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';
  const [initialAuth, setInitialAuth] = useState(false);
  
  // Check initial auth state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user');
        if (userData && isLoginPage) {
          // Already logged in, redirect to dashboard
          console.log('User already logged in, redirecting to dashboard');
          window.location.replace('/dashboard');
          return;
        }
        
        if (!userData && !isLoginPage) {
          // Not logged in and not on login page, redirect to login
          console.log('User not logged in, redirecting to login');
          window.location.replace('/login');
          return;
        }
        
        setInitialAuth(true);
      } catch (err) {
        console.error('Error checking auth state:', err);
        setInitialAuth(true);
      }
    }
  }, []);
  
  // While checking auth, show loading
  if (!initialAuth && typeof window !== 'undefined') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>User Management System</title>
        <meta name="description" content="User Management System with Authentication and Access Control" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {isLoginPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
} 