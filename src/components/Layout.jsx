import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

// Component to fetch and display coffee inventory
function CoffeeInventory() {
  const [totalInventory, setTotalInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCoffeeInventory = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // Add cache-busting parameter to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/coffee/inventory/total?_=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }
      
      const data = await response.json();
      setTotalInventory(data.total !== undefined ? data.total : 0);
    } catch (error) {
      console.error('Error fetching coffee inventory:', error);
      setError(true);
      setTotalInventory(0);
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
  }, []);

  if (loading) {
    return <span className="text-sm text-green-600">Loading...</span>;
  }
  
  if (error) {
    return <span className="text-sm text-yellow-600">Inventory unavailable</span>;
  }

  // Determine color based on inventory level
  let bgColor = "bg-green-50";
  let textColor = "text-green-600";
  
  if (totalInventory < 150) {
    bgColor = "bg-red-50";
    textColor = "text-red-600";
  } else if (totalInventory < 300) {
    bgColor = "bg-orange-50";
    textColor = "text-orange-600";
  }

  return (
    <div className={`text-sm px-3 py-1 ${bgColor} ${textColor} rounded-md`}>
      <Link href="/coffee" className="flex items-center">
        <span className="font-medium">{Number(totalInventory).toFixed(1)} kg</span>
        <span className="ml-1">Green Stock</span>
      </Link>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
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
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Minimal Header */}
      <header className="border-b border-gray-200">
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
                        className={`text-sm ${router.pathname === link.href || router.pathname.startsWith(link.href + '/') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return null;
                })}
              </nav>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden flex items-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            
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
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
      <main>
        <div className="mx-auto max-w-6xl py-8 px-4">
          {children}
        </div>
      </main>
    </div>
  );
} 