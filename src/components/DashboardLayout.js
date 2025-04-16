import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/session';

export default function DashboardLayout({ children }) {
  const { session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session) {
      console.log('Current user role:', session.user.role);
      console.log('Full session object:', JSON.stringify(session, null, 2));
    }
  }, [session]);

  if (!session) {
    return null; // Don't render anything if not authenticated
  }

  // Create navigation items
  const commonNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Users', href: '/users' },
    { name: 'Shops', href: '/shops' },
    { name: 'Coffee', href: '/coffee' },
    { name: 'Activities', href: '/activities' },
  ];

  // TEMPORARY FIX: Always add Retail Orders for debugging
  // Skip all conditional logic for now
  let navigation = [
    ...commonNavItems,
    { name: 'Retail Orders', href: '/orders' }
  ];
  
  // Debug logging
  console.log('FORCING Retail Orders menu item visible for all users');
  console.log('User role:', session.user.role);
  console.log('Navigation items:', navigation.map(item => item.name));

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/dashboard" className="flex items-center">
                  <img 
                    src="/images/sonic-beans-logo.png"
                    alt="Sonic Beans"
                    className="h-8 invert"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/sonic-beans-logo.svg";
                    }}
                  />
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        router.pathname === item.href
                          ? 'bg-blue-700 text-white'
                          : 'text-white hover:bg-blue-500'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="text-white">{session.user.username}</div>
                <Link
                  href="/logout"
                  className="ml-4 text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </Link>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  router.pathname === item.href
                    ? 'bg-blue-700 text-white'
                    : 'text-white hover:bg-blue-500'
                } block px-3 py-2 rounded-md text-base font-medium`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/logout"
              className="block text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-base font-medium"
            >
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 