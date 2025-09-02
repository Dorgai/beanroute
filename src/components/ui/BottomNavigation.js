import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '../../lib/session';
import {
  Home,
  Inventory,
  ShoppingCart,
  Coffee,
  Settings,
  Dashboard,
  BarChart3
} from 'lucide-react';

export default function BottomNavigation() {
  const router = useRouter();
  const { session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [pressedItem, setPressedItem] = useState(null);
  const [error, setError] = useState(null);

  // Error boundary - if anything goes wrong, don't crash the app
  if (error) {
    console.error('[BottomNavigation] Error:', error);
    return null;
  }

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
      setError(err);
    }
  }, []);

  useEffect(() => {
    try {
      // Show navigation after a short delay to avoid flash
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('[BottomNavigation] Visibility timer error:', err);
      setError(err);
    }
  }, []);

  // Don't show on desktop or when not in PWA mode
  // Also ensure we have a valid session before proceeding
  if (!isPWA || typeof window !== 'undefined' && window.innerWidth > 768 || !session) {
    return null;
  }

  try {
    const user = session?.user;
    const isAdmin = user?.role === 'ADMIN';
    const isOwner = user?.role === 'OWNER';
    const isRoaster = user?.role === 'ROASTER';
    const isRetailer = user?.role === 'RETAILER';
    const isBarista = user?.role === 'BARISTA';

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        label: 'Home',
        icon: Home,
        href: '/dashboard',
        show: true
      }
    ];

    if (isRoaster) {
      // Roaster sees: Orders, Pending Orders Summary
      return [
        ...baseItems,
        {
          label: 'Orders',
          icon: ShoppingCart,
          href: '/orders',
          show: true
        },
        {
          label: 'Pending',
          icon: BarChart3,
          href: '/orders?tab=pending',
          show: true
        },
        {
          label: 'Coffee',
          icon: Coffee,
          href: '/coffee',
          show: true
        }
      ];
    } else if (isRetailer || isBarista) {
      // Retailer/Barista sees: Inventory, Orders, Coffee
      return [
        ...baseItems,
        {
          label: 'Inventory',
          icon: Inventory,
          href: '/orders?tab=inventory',
          show: true
        },
        {
          label: 'Orders',
          icon: ShoppingCart,
          href: '/orders?tab=orders',
          show: true
        },
        {
          label: 'Coffee',
          icon: Coffee,
          href: '/coffee',
          show: true
        }
      ];
    } else if (isAdmin || isOwner) {
      // Admin/Owner sees: Dashboard, Orders, Coffee, Settings
      return [
        ...baseItems,
        {
          label: 'Orders',
          icon: ShoppingCart,
          href: '/orders',
          show: true
        },
        {
          label: 'Coffee',
          icon: Coffee,
          href: '/coffee',
          show: true
        },
        {
          label: 'Settings',
          icon: Settings,
          href: '/settings',
          show: true
        }
      ];
    }

    // Default for unauthenticated users
    return baseItems;
  };

  } catch (err) {
    console.error('[BottomNavigation] Error in navigation logic:', err);
    setError(err);
    return null;
  }

  const navigationItems = getNavigationItems().filter(item => item.show);

  const isActive = (href) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    if (href === '/orders') {
      return router.pathname === '/orders';
    }
    if (href === '/coffee') {
      return router.pathname === '/coffee';
    }
    if (href === '/settings') {
      return router.pathname.startsWith('/settings');
    }
    if (href.includes('?tab=')) {
      const [path, query] = href.split('?');
      const tab = query.split('=')[1];
      return router.pathname === path && router.query.tab === tab;
    }
    return router.pathname === href;
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
      setError(err);
    }
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              onTouchStart={() => setPressedItem(item.href)}
              onTouchEnd={() => setPressedItem(null)}
              onMouseDown={() => setPressedItem(item.href)}
              onMouseUp={() => setPressedItem(null)}
              onMouseLeave={() => setPressedItem(null)}
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
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
              } ${
                pressedItem === item.href ? 'scale-95 bg-gray-100' : ''
              }`}
              style={{ minHeight: '44px' }} // Ensure touch target size
            >
              <IconComponent 
                size={20} 
                className={`mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`}
              />
              <span className={`text-xs font-medium truncate max-w-full px-1 ${
                active ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
