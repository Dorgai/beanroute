import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Minimal Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Nav */}
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="font-normal text-lg tracking-tight">
                BeanRoute
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link href="/dashboard"
                   className={`text-sm ${router.pathname === '/dashboard' ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Dashboard
                </Link>
                <Link href="/users"
                   className={`text-sm ${router.pathname.startsWith('/users') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Users
                </Link>
                <Link href="/shops"
                   className={`text-sm ${router.pathname.startsWith('/shops') ? 'font-medium' : 'font-normal text-gray-500 hover:text-gray-900'}`}>
                  Shops
                </Link>
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
              </nav>
            </div>
            
            {/* User Info / Logout */}
            <div className="flex items-center space-x-6">
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