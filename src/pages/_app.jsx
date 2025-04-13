import React, { useEffect, useState } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Keep track of redirect state in a module-level variable to prevent infinite loops
let redirecting = false;

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';
  const [ready, setReady] = useState(false);
  
  // Check initial auth state
  useEffect(() => {
    // If already redirecting, skip this effect
    if (redirecting) return;
    
    if (typeof window !== 'undefined') {
      try {
        // Safely check localStorage
        let userData = null;
        try {
          userData = localStorage.getItem('user');
        } catch (e) {
          console.error('Error reading from localStorage:', e);
        }
        
        if (userData && isLoginPage) {
          // Already logged in, redirect to dashboard
          console.log('User already logged in, redirecting to dashboard');
          redirecting = true;
          window.location.href = '/dashboard';
          return;
        }
        
        if (!userData && !isLoginPage) {
          // Not logged in and not on login page, redirect to login
          console.log('User not logged in, redirecting to login');
          redirecting = true;
          window.location.href = '/login';
          return;
        }
      } catch (err) {
        console.error('Error in auth check:', err);
      } finally {
        // Always set ready to true, even if there was an error
        setReady(true);
      }
    }
  }, [isLoginPage]);
  
  // In SSR or while checking auth, render minimum content
  if (typeof window === 'undefined' || !ready) {
    return (
      <>
        <Head>
          <title>User Management System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
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