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

  return (
    <div className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded-md">
      <Link href="/coffee" className="flex items-center">
        <span className="font-medium">{Number(totalInventory).toFixed(1)} kg</span>
        <span className="ml-1">Coffee in Stock</span>
      </Link>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check if user can access the activities page (Admin, Owner, Retailer)
  const canViewActivities = user && ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role);
  
  // Check if user can view coffee inventory in header
  const canViewCoffeeInventory = user && ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role);
  
  // Check if user can access analytics
  const canViewAnalytics = user && ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role);

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
              <nav className="hidden md:flex space-x-8">
                {user && (user.role === 'ADMIN' || user.role === 'OWNER') && (
                <Link href="/dashboard"
                   className={`text-sm ${router.pathname === '/dashboard' ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Dashboard
                </Link>
                )}
                {user && (user.role === 'ADMIN' || user.role === 'OWNER') && (
                <Link href="/users"
                   className={`text-sm ${router.pathname.startsWith('/users') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Users
                </Link>
                )}
                {user && (user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'RETAILER') && (
                <Link href="/shops"
                   className={`text-sm ${router.pathname.startsWith('/shops') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Shops
                </Link>
                )}
                <Link href="/coffee"
                   className={`text-sm ${router.pathname.startsWith('/coffee') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Coffee
                </Link>
                {canViewActivities && (
                  <Link href="/activities"
                     className={`text-sm ${router.pathname.startsWith('/activities') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                    Activities
                  </Link>
                )}
                {/* Orders menu item for all users */}
                <Link href="/orders"
                   className={`text-sm ${router.pathname === '/orders' ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Orders
                </Link>
                {canViewAnalytics && (
                  <Link href="/analytics"
                     className={`text-sm ${router.pathname === '/analytics' ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                    Analytics
                  </Link>
                )}
              </nav>
            </div>
            
            {/* User Info / Logout */}
            <div className="flex items-center space-x-4">
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