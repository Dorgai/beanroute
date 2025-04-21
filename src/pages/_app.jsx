import React from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../styles/theme';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';
  const isRootPage = router.pathname === '/';
  
  // Add the error page props to Component
  const getLayout = Component.getLayout || ((page) => page);
  
  // Wrap everything in AuthProvider again
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {isRootPage || isLoginPage ? (
            // Direct render for root and login pages
            <>
              <Head>
                <title>Bean Route</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </Head>
              {getLayout(<Component {...pageProps} />)}
            </>
          ) : (
            // Use Layout for all other pages
            <>
              <Head>
                <title>Bean Route</title>
                <meta name="description" content="Coffee Supply Chain Management System" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
              </Head>
              <Layout>
                {getLayout(<Component {...pageProps} />)}
              </Layout>
            </>
          )}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 