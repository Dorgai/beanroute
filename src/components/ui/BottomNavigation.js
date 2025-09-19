import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '../../lib/session';

export default function BottomNavigation() {
  const router = useRouter();
  const { session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    try {
      // Check if running as PWA
      const checkPWA = () => {
        try {
          const isStandalone = window.navigator.standalone || 
            window.matchMedia('(display-mode: standalone)').matches;
          setIsPWA(isStandalone);
        } catch (err) {
          console.warn('[BottomNavigation] PWA check failed:', err);
          setIsPWA(false);
        }
      };

      checkPWA();
      window.addEventListener('resize', checkPWA);
      return () => window.removeEventListener('resize', checkPWA);
    } catch (err) {
      console.error('[BottomNavigation] useEffect error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    try {
      // Show navigation after a short delay to avoid flash
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('[BottomNavigation] Visibility timer error:', err);
      return null;
    }
  }, []);

  // Don't show on desktop or when not in PWA mode
  // Also ensure we have a valid session before proceeding
  if (!isPWA || typeof window !== 'undefined' && window.innerWidth > 768 || !session) {
    return null;
  }

  // Define navigation items based on user role
  const getNavigationItems = () => {
    try {
      const user = session?.user;
      const isAdmin = user?.role === 'ADMIN';
      const isOwner = user?.role === 'OWNER';
      const isRoaster = user?.role === 'ROASTER';
      const isRetailer = user?.role === 'RETAILER';
      const isBarista = user?.role === 'BARISTA';

      const baseItems = [
        {
          label: 'Home',
          href: '/dashboard',
          show: true
        }
      ];

      if (isRoaster) {
        // Roaster sees: Retail, Pending Orders Summary, Green Coffee
        return [
          ...baseItems,
          {
            label: 'Retail',
            href: '/orders',
            show: true
          },
          {
            label: 'Pending',
            href: '/orders?tab=pending',
            show: true
          },
          {
            label: 'Green Coffee',
            href: '/coffee',
            show: true
          }
        ];
      } else if (isRetailer || isBarista) {
        // Retailer/Barista sees: Inventory, Retail, Green Coffee
        return [
          ...baseItems,
          {
            label: 'Inventory',
            href: '/orders?tab=inventory',
            show: true
          },
          {
            label: 'Retail',
            href: '/orders?tab=orders',
            show: true
          },
          {
            label: 'Green Coffee',
            href: '/coffee',
            show: true
          }
        ];
      } else if (isAdmin || isOwner) {
        // Admin/Owner sees: Dashboard, Retail, Green Coffee, Analytics, Settings
        return [
          ...baseItems,
          {
            label: 'Retail',
            href: '/orders',
            show: true
          },
          {
            label: 'Green Coffee',
            href: '/coffee',
            show: true
          },
          {
            label: 'Analytics',
            href: '/analytics',
            show: true
          },
          {
            label: 'Settings',
            href: '/settings/notifications',
            show: true
          }
        ];
      }

      // Default for unauthenticated users
      return baseItems;
    } catch (err) {
      console.error('[BottomNavigation] Error in navigation logic:', err);
      return [];
    }
  };

  const navigationItems = getNavigationItems().filter(item => item.show);

  const isActive = (href) => {
    try {
      if (href === '/dashboard') {
        return router.pathname === '/dashboard';
      }
      if (href === '/orders') {
        return router.pathname === '/orders';
      }
      if (href === '/coffee') {
        return router.pathname === '/coffee';
      }
      if (href === '/settings/notifications') {
        return router.pathname.startsWith('/settings');
      }
      if (href.includes('?tab=')) {
        const [path, query] = href.split('?');
        const tab = query.split('=')[1];
        return router.pathname === path && router.query.tab === tab;
      }
      return router.pathname === href;
    } catch (err) {
      console.error('[BottomNavigation] Error in isActive:', err);
      return false;
    }
  };

  const handleNavigation = (href) => {
    try {
      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      if (href.includes('?tab=')) {
        const [path, query] = href.split('?');
        const tab = query.split('=')[1];
        router.push({
          pathname: path,
          query: { tab }
        });
      } else {
        router.push(href);
      }
    } catch (err) {
      console.error('[BottomNavigation] Navigation error:', err);
    }
  };

  // Minimalist SVG icons
  const getIcon = (label) => {
    switch (label) {
      case 'Home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'Inventory':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'Retail':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'Green Coffee':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'Settings':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'Pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'Analytics':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  try {
    return (
      <nav 
        className={`fixed bottom-0 left-0 right-0 bg-gray-800 dark:bg-gray-800 border-t border-gray-600 dark:border-gray-600 z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)'
        }}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                onTouchStart={() => {}}
                onTouchEnd={() => {}}
                onMouseDown={() => {}}
                onMouseUp={() => {}}
                onMouseLeave={() => {}}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigation(item.href);
                  }
                }}
                aria-label={`Navigate to ${item.label}`}
                aria-current={active ? 'page' : undefined}
                role="tab"
                tabIndex={0}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  active 
                    ? 'text-blue-400 bg-gray-700 dark:bg-gray-700' 
                    : 'text-gray-300 dark:text-gray-300 hover:text-blue-400 hover:bg-gray-700 dark:hover:bg-gray-700'
                }`}
                style={{ minHeight: '44px' }} // Ensure touch target size
              >
                <span className="mb-1">
                  {getIcon(item.label)}
                </span>
                <span className={`text-xs font-medium truncate max-w-full px-1 ${
                  active ? 'text-blue-400' : 'text-gray-300'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  } catch (err) {
    console.error('[BottomNavigation] Error rendering navigation:', err);
    return null;
  }
}
