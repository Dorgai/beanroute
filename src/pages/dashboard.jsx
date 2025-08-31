import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  
  console.log('[Dashboard] Component rendered:', {
    user: user ? 'present' : 'null',
    authLoading,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  });
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalShops: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authorized to view dashboard (only ADMIN and OWNER)
    if (user && !(user.role === 'ADMIN' || user.role === 'OWNER')) {
      console.log('Unauthorized user trying to access dashboard, redirecting to orders page');
      window.location.href = '/orders';
      return;
    }

    // Fetch dashboard statistics
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats?direct=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const data = await response.json();
        console.log('Dashboard stats:', data);
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  // If authentication is still loading, show loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no user, show redirecting message (this should trigger redirect in AuthContext)
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Only ADMIN and OWNER can access dashboard
  if (user && !(user.role === 'ADMIN' || user.role === 'OWNER')) {
    return null; // This should never render as we redirect in the useEffect
  }

  return (
    <>
      <Head>
        <title>Dashboard - User Management System</title>
      </Head>

      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your user management system
        </p>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Users Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/users" className="font-medium text-blue-600 hover:text-blue-500">
                    View all users
                  </Link>
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Users
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.activeUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/users?status=ACTIVE" className="font-medium text-blue-600 hover:text-blue-500">
                    View active users
                  </Link>
                </div>
              </div>
            </div>

            {/* Inactive Users Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Inactive Users
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.inactiveUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/users?status=INACTIVE" className="font-medium text-blue-600 hover:text-blue-500">
                    View inactive users
                  </Link>
                </div>
              </div>
            </div>

            {/* Shops Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Shops
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalShops || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link href="/shops" className="font-medium text-blue-600 hover:text-blue-500">
                    View all shops
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a new user to the system with appropriate role
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/users/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Create User
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">Inventory Alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage inventory alert settings and view alert history
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/admin/inventory-alerts"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Manage Alerts
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'RETAILER') && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">Create New Shop</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a new coffee shop and set minimum coffee quantities
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/shops/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Create Shop
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">View Your Profile</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check your profile information and activity history
                </p>
                <div className="mt-4">
                  <Link
                    href={`/users/profile/${user?.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard; 