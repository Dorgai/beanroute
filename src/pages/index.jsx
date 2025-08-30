import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationStatusBadge from '@/components/ui/NotificationStatusBadge';
import InstallPWA from '@/components/ui/InstallPWA';

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Bean Route - Coffee Management System</title>
        <meta name="description" content="Professional coffee management system for cafes and coffee shops" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <img
                    src="/images/sonic-beans-logo.jpg"
                    alt="Sonic Beans"
                    className="h-8 w-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/sonic-beans-logo.svg";
                    }}
                  />
                  <span className="ml-3 text-xl font-bold text-gray-900">Bean Route</span>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium">
                  Home
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium">
                  About
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium">
                  Contact
                </Link>
              </nav>

              {/* Right side - Notification Badge and Auth */}
              <div className="flex items-center space-x-4">
                {/* Notification Badge - Always show for public access */}
                <NotificationStatusBadge size="sm" />
                
                {/* Auth buttons */}
                {user ? (
                  <Link
                    href="/orders"
                    className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Go to Orders
                  </Link>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login"
                      className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Professional Coffee
              <span className="text-orange-600"> Management</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your coffee shop operations with our comprehensive management system. 
              Track inventory, manage orders, and grow your business efficiently.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <Link
                  href="/orders"
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Manage Orders
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="/about"
                    className="border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-100 transition-colors"
                  >
                    Learn More
                  </Link>
                </>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Management</h3>
                <p className="text-gray-600">Efficiently manage coffee orders and track delivery status</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventory Tracking</h3>
                <p className="text-gray-600">Real-time inventory management and stock alerts</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-600">Comprehensive reporting and business insights</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-400">&copy; 2025 Bean Route. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* PWA Install Prompt */}
        <InstallPWA />
      </div>
    </>
  );
} 