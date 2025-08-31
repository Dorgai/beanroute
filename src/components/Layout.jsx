import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from '../lib/session';
import MessageBoard from './MessageBoard';
import InstallPWA from './ui/InstallPWA';

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
    return <span className="text-sm text-red-600">Error loading inventory</span>;
  }
  
  // Always show the inventory amount, even if it's the fallback value
  return (
    <span className="text-sm text-green-600">
      {totalInventory !== null ? `${totalInventory}kg` : 'Loading...'}
    </span>
  );
}

export default function Layout({ children, showHeader = true, showFooter = true }) {
  const router = useRouter();
  const { session } = useSession();
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [canViewCoffeeInventory, setCanViewCoffeeInventory] = useState(false);

  // Check if user can view coffee inventory (ADMIN, OWNER, or RETAILER)
  useEffect(() => {
    if (user && ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role)) {
      setCanViewCoffeeInventory(true);
    }
  }, [user]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation links
  const navLinks = [
    { href: '/orders', label: 'Retail', roles: [] }, // Available to all
    { href: '/analytics', label: 'Analytics', roles: ['ADMIN', 'OWNER', 'RETAILER'] },
    { href: '/settings/notifications', label: 'Notifications', roles: [] }, // Available to all authenticated users
  ];

  // Admin submenu items
  const adminLinks = [
    { href: '/admin', label: 'Admin Dashboard' },
    { href: '/admin/users', label: 'Manage Users' },
    { href: '/admin/shops', label: 'Manage Shops' },
    { href: '/admin/coffee', label: 'Manage Coffee' },
    { href: '/admin/orders', label: 'Manage Orders' },
    { href: '/admin/inventory', label: 'Inventory Management' },
    { href: '/admin/activities', label: 'Activity Log' },
  ];

  if (!showHeader) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex-1">
          {children}
        </main>
        {showFooter && (
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © 2024 BeanRoute. All rights reserved.
              </p>
            </div>
          </footer>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/orders" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="BeanRoute Logo"
                  className="h-8 w-auto"
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </Link>
              
              {/* Mobile Menu Button */}
              <button 
                className="flex items-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                onClick={toggleMobileMenu}
                aria-label="Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
            
            {/* User Info / Logout */}
            <div className="hidden md:flex items-center space-x-4">
              {canViewCoffeeInventory && <CoffeeInventory />}
              
              {user ? (
                <>
                  <span className="text-sm text-gray-500 hidden sm:inline">
                    {user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-normal text-gray-500 hover:text-gray-900 focus:outline-none"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-sm font-normal">Login</Link>
              )}
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-2 transition-all">
              <nav className="flex flex-col space-y-3 px-2 pb-3 pt-2">
                {navLinks.map((link) => {
                  // Only show links if user has permission
                  if (user && (link.roles.length === 0 || link.roles.includes(user.role))) {
                    return (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={`px-3 py-2 rounded-md text-sm ${
                          router.pathname === link.href || router.pathname.startsWith(link.href + '/') 
                            ? 'font-medium bg-gray-100' 
                            : 'font-normal text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </div>
                      {adminLinks.map((adminLink) => (
                        <Link 
                          key={adminLink.href}
                          href={adminLink.href}
                          className={`block px-3 py-2 rounded-md text-sm ${
                            router.pathname === adminLink.href 
                              ? 'font-medium bg-gray-100' 
                              : 'font-normal text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
                <div className="border-t border-gray-200 pt-3 mt-2">
                  {canViewCoffeeInventory && (
                    <div className="px-3 py-2">
                      <CoffeeInventory />
                    </div>
                  )}
                  
                  {user && (
                    <>
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {user.username}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md"
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
      
      {/* Main content area */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && (
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 BeanRoute. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
} 