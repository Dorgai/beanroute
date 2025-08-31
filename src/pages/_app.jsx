import React, { useEffect } from 'react';
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
  
  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      console.log('[PWA] Device detection:', { isMobile, isIOS, userAgent: navigator.userAgent });
      
      // For iOS, we need to be more careful with service worker registration
      if (isIOS) {
        console.log('[PWA] iOS device detected - limited PWA support');
        // iOS Safari has limited service worker support, but we'll try anyway
      }
      
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        })
        .then((registration) => {
          console.log('[PWA] Service worker registered successfully:', registration);
          
          // Force the service worker to take control immediately
          if (registration.waiting) {
            console.log('[PWA] Service worker waiting, attempting to activate...');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content is available; please refresh.');
                }
              });
            }
          });
          
          // Check if service worker is controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('[PWA] Service worker is controlling the page');
          } else {
            console.log('[PWA] Service worker is not yet controlling the page');
            // Force a reload to ensure service worker takes control
            setTimeout(() => {
              if (!navigator.serviceWorker.controller) {
                console.log('[PWA] Forcing page reload to activate service worker');
                window.location.reload();
              }
            }, 2000);
          }
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
          
          // On mobile, some browsers might fail silently
          if (isMobile) {
            console.log('[PWA] Mobile device - service worker registration failed, but continuing...');
          }
        });
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[PWA] Message from service worker:', event.data);
        
        // Handle service worker messages
        if (event.data && event.data.type === 'RELOAD_PAGE') {
          window.location.reload();
        }
      });
      
      // Listen for service worker controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed');
      });
    }
  }, []);
  
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