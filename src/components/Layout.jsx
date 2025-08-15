import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext.js';
import MessageBoard from './MessageBoard';

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
  let bgColor = "bg-green-50";
  let textColor = "text-green-600";
  
  if (inventoryValue < 150) {
    bgColor = "bg-red-50";
    textColor = "text-red-600";
  } else if (inventoryValue < 300) {
    bgColor = "bg-orange-50";
    textColor = "text-orange-600";
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

  // Admin submenu items
  const adminLinks = [
    { href: '/admin/inventory-alerts', label: 'Inventory Alerts', roles: ['ADMIN', 'OWNER'] },
    { href: '/admin/order-email-notifications', label: 'Order Email Notifications', roles: ['ADMIN', 'OWNER'] },
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
                
                {/* Admin Dropdown */}
                {user && ['ADMIN', 'OWNER'].includes(user.role) && (
                  <div className="relative admin-dropdown">
                    <button
                      onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                      className={`text-sm font-normal text-gray-500 hover:text-gray-900 flex items-center ${router.pathname.startsWith('/admin') ? 'font-medium text-gray-900' : ''}`}
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1">
                          {adminLinks.map((adminLink) => (
                            <Link 
                              key={adminLink.href}
                              href={adminLink.href}
                              className={`block px-4 py-2 text-sm hover:bg-gray-100 ${router.pathname === adminLink.href ? 'font-medium text-gray-900 bg-gray-50' : 'text-gray-700'}`}
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

      {/* Message Board - only show for authenticated users */}
      {user && <MessageBoard />}
    </div>
  );
} 