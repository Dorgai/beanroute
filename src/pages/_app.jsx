import React from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';
  const isRootPage = router.pathname === '/';
  
  // Wrap everything in AuthProvider again
  return (
    <AuthProvider>
      {isRootPage || isLoginPage ? (
        // Direct render for root and login pages
        <>
          <Head>
            <title>Bean Route</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Head>
          <Component {...pageProps} />
        </>
      ) : (
        // Use Layout for all other pages
        <>
          <Head>
            <title>User Management System</title>
            <meta name="description" content="User Management System with Authentication and Access Control" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </>
      )}
    </AuthProvider>
  );
} 