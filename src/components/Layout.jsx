import React, { useState } from 'react';
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simplified Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="text-blue-600 font-bold text-xl">
                Bean Route
              </Link>
            </div>
            
            {/* User Info / Logout */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700 hidden sm:inline">
                    Welcome, {user?.firstName || user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">Login</Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 