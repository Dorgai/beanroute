import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../contexts/ThemeContext';
import MessageBoard from './MessageBoard';
import InstallPWA from './ui/InstallPWA';
import BackgroundSyncManager from './ui/BackgroundSyncManager';
import WakeLockManager from './ui/WakeLockManager';
import BottomNavigation from './ui/BottomNavigation';
import ThemeToggle from './ThemeToggle';
// import { NotificationBanner } from './ui/NotificationBanner';


// Component to fetch and display coffee inventory
function CoffeeInventory() {
  const [totalInventory, setTotalInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [apiAttempts, setApiAttempts] = useState(0);

  // Fallback inventory amount for production use when API fails
  const FALLBACK_INVENTORY = 180; // Fallback to 180kg when API is unavailable

  const fetchCoffeeInventory = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // First try the public endpoint
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/public/coffee-inventory-total?_=${timestamp}`);
      
      if (!response.ok) {
        // Fallback to original endpoint with direct=true
        const fallbackResponse = await fetch(`/api/coffee/inventory/total?direct=true&_=${timestamp}`);
        if (!fallbackResponse.ok) {
          throw new Error(`Both API endpoints failed`);
        }
        
        const data = await fallbackResponse.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setTotalInventory(data.total !== undefined ? data.total : FALLBACK_INVENTORY);
        return;
      }
      
      const data = await response.json();
      
      if (data.error) {
        setApiAttempts(prev => prev + 1);
        if (apiAttempts > 2) {
          // After 3 failed attempts, use the fallback value
          console.log('Using fallback inventory value after repeated failures');
          setTotalInventory(FALLBACK_INVENTORY);
        } else {
          throw new Error(data.error);
        }
      } else {
        // Reset counter on success
        setApiAttempts(0);
        setTotalInventory(data.total !== undefined ? data.total : FALLBACK_INVENTORY);
      }
    } catch (error) {
      console.error('Error fetching coffee inventory:', error);
      setError(true);
      setApiAttempts(prev => prev + 1);
      
      // After 3 failed attempts, use the fallback value
      if (apiAttempts > 2) {
        console.log('Using fallback inventory value after repeated failures');
        setTotalInventory(FALLBACK_INVENTORY);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoffeeInventory();
    
    // Setup refresh interval every 15 seconds
    const intervalId = setInterval(fetchCoffeeInventory, 15000);
    
    // Listen for inventory update events
    const handleInventoryUpdate = () => {
      fetchCoffeeInventory();
    };
    
    window.addEventListener('coffeeInventoryUpdated', handleInventoryUpdate);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('coffeeInventoryUpdated', handleInventoryUpdate);
    };
  }, [apiAttempts]);

  if (loading && !totalInventory) {
    return <span className="text-sm text-green-600">Loading...</span>;
  }
  
  if (error && !totalInventory) {
    // If in error state but we still don't have a fallback value
    return <span className="text-sm text-yellow-600">Inventory unavailable</span>;
  }

  // Use the fetched value or the fallback
  const inventoryValue = totalInventory || FALLBACK_INVENTORY;

  // Determine color based on inventory level
  let bgColor = "bg-green-50 dark:bg-green-900";
  let textColor = "text-green-600 dark:text-green-300";
  
  if (inventoryValue < 150) {
    bgColor = "bg-red-50 dark:bg-red-900";
    textColor = "text-red-600 dark:text-red-300";
  } else if (inventoryValue < 300) {
    bgColor = "bg-orange-50 dark:bg-orange-900";
    textColor = "text-orange-600 dark:text-orange-300";
  }

  return (
    <div className={`text-sm px-3 py-1 ${bgColor} ${textColor} rounded-md`}>
      <Link href="/coffee" className="flex items-center">
        <span className="font-medium">{Number(inventoryValue).toFixed(1)} kg</span>
        <span className="ml-1">Green Stock</span>
      </Link>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close admin dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminDropdownOpen && !event.target.closest('.admin-dropdown')) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminDropdownOpen]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${isDark ? 'border-white' : 'border-gray-900'}`}></div>
      </div>
    );
  }

  // Check if user can access the activities page (Admin, Owner, Retailer)
  const canViewActivities = user && ['ADMIN', 'OWNER'].includes(user.role);
  
  // Check if user can view coffee inventory in header
  const canViewCoffeeInventory = user && ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role);
  
  // Check if user can access analytics
  const canViewAnalytics = user && ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role);

  // Navigation links array for reuse in both desktop and mobile menus
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'OWNER'] },
    { href: '/users', label: 'Users', roles: ['ADMIN', 'OWNER'] },
    { href: '/shops', label: 'Shops', roles: ['ADMIN', 'OWNER', 'RETAILER'] },
    { href: '/coffee', label: 'Green Coffee', roles: [] }, // Empty array means available to all authenticated users
    { href: '/activities', label: 'Activities', roles: ['ADMIN', 'OWNER'] },
    { href: '/orders', label: 'Retail', roles: [] }, // Available to all
    { href: '/analytics', label: 'Analytics', roles: ['ADMIN', 'OWNER', 'RETAILER'] },
    { href: '/settings/notifications', label: 'Notifications', roles: [] }, // Available to all authenticated users
  ];

  // Admin submenu items
  const adminLinks = [
    { href: '/admin/inventory-alerts', label: 'Inventory Alerts', roles: ['ADMIN', 'OWNER'] },
    { href: '/admin/order-email-notifications', label: 'Order Email Notifications', roles: ['ADMIN', 'OWNER'] },
    { href: '/admin/haircut-settings', label: 'Haircut Settings', roles: ['ADMIN', 'OWNER'] },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Minimal Header */}
      <header className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pwa-header`}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Nav */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center">
                <img 
                  src="/images/sonic-beans-logo.jpg"
                  alt="Sonic Beans"
                  className="h-8"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/sonic-beans-logo.svg";
                  }}
                />
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                {navLinks.map((link) => {
                  // Only show links if user has permission
                  if (user && (link.roles.length === 0 || link.roles.includes(user.role))) {
                    return (
                      <Link 
                        key={link.href}
                        href={link.href}
                        className={`text-sm ${router.pathname === link.href || router.pathname.startsWith(link.href + '/') ? 'font-medium' : `font-normal ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}`}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return null;
                })}
                
                {/* Admin Dropdown */}
                {user && ['ADMIN', 'OWNER'].includes(user.role) && (
                  <div className="relative admin-dropdown">
                    <button
                      onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                      className={`text-sm font-normal ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} flex items-center ${router.pathname.startsWith('/admin') ? `font-medium ${isDark ? 'text-white' : 'text-gray-900'}` : ''}`}
                    >
                      Admin
                      <svg 
                        className={`ml-1 h-4 w-4 transform transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {adminDropdownOpen && (
                      <div className={`absolute right-0 mt-2 w-56 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50`}>
                        <div className="py-1">
                          {adminLinks.map((adminLink) => (
                            <Link 
                              key={adminLink.href}
                              href={adminLink.href}
                              className={`block px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${router.pathname === adminLink.href ? `font-medium ${isDark ? 'text-white bg-gray-700' : 'text-gray-900 bg-gray-50'}` : `${isDark ? 'text-gray-300' : 'text-gray-700'}`}`}
                              onClick={() => setAdminDropdownOpen(false)}
                            >
                              {adminLink.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className={`md:hidden flex items-center p-3 rounded-md ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none touch-manipulation`}
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            
            {/* User Info / Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              {canViewCoffeeInventory && <CoffeeInventory />}
              
              {user ? (
                <>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} hidden sm:inline`}>
                    {user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`text-sm font-normal ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} focus:outline-none`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className={`text-sm font-normal ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Login</Link>
              )}
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-2 transition-all ios-safe-area`}>
              <nav className="flex flex-col space-y-3 px-2 pb-3 pt-2">
                {navLinks.map((link) => {
                  // Only show links if user has permission
                  if (user && (link.roles.length === 0 || link.roles.includes(user.role))) {
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={`px-4 py-3 rounded-md text-sm touch-manipulation ${
                          router.pathname === link.href || router.pathname.startsWith(link.href + '/') 
                            ? `font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}` 
                            : `font-normal ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return null;
                })}

                {/* Admin Section for Mobile */}
                {user && ['ADMIN', 'OWNER'].includes(user.role) && (
                  <>
                    <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-2 mt-2`}>
                      <div className={`px-3 py-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                        Admin
                      </div>
                      {adminLinks.map((adminLink) => (
                        <Link 
                          key={adminLink.href}
                          href={adminLink.href}
                          className={`block px-4 py-3 rounded-md text-sm touch-manipulation ${
                            router.pathname === adminLink.href 
                              ? `font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}` 
                              : `font-normal ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {adminLink.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Mobile user info and logout */}
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-3 mt-2`}>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Theme</span>
                    <ThemeToggle />
                  </div>
                  {canViewCoffeeInventory && (
                    <div className="px-3 py-2">
                      <CoffeeInventory />
                    </div>
                  )}
                  
                  {user && (
                    <>
                      <div className={`px-3 py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.username}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-md text-sm ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} touch-manipulation`}
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      {/* Notification Banner - temporarily disabled */}
      {/* {user && <NotificationBanner />} */}
      
      {/* Main content area */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl py-4 md:py-8 px-4 ios-safe-area pb-safe">
          {children}
        </div>
      </main>

      {/* Message Board - only show for authenticated users */}
      {user && <MessageBoard />}
      
          {/* PWA Install Prompt */}
    <InstallPWA />
    
    {/* Background Sync Manager for mobile background processing */}
    <BackgroundSyncManager />
    
    {/* Wake Lock Manager for Android devices */}
    <WakeLockManager />
    
    {/* Bottom Navigation for Mobile PWA */}
    {(() => {
      try {
        return <BottomNavigation />;
      } catch (error) {
        console.error('[Layout] Error rendering BottomNavigation:', error);
        return null;
      }
    })()}
  </div>
);
} 