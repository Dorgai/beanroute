import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Try to use AuthContext, but fallback to direct localStorage approach if not available
let useAuth, withAuth;
try {
  const authModule = require('../context/AuthContext');
  useAuth = authModule.useAuth;
  withAuth = authModule.withAuth;
} catch (err) {
  console.warn('Auth context not available, using localStorage fallback');
  useAuth = () => {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          // window.location.href = '/login';
          // Set a default guest user if none found in localStorage
          console.log('No user in localStorage, setting default guest user.');
          setUser({
            id: 'guest-' + Date.now(),
            username: 'guest',
            role: 'GUEST' // Assign a default role
          });
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        // Optionally set a default user on error too
        setUser({
          id: 'guest-error-' + Date.now(),
          username: 'guest',
          role: 'GUEST'
        });
      }
    }, []);
    
    return { user };
  };
  
  withAuth = (Component) => Component;
}

function Dashboard() {
  const { user } = useAuth();
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
    // Fetch dashboard statistics
    async function fetchStats() {
      try {
        // Add credentials option to include cookies
        const response = await fetch('/api/dashboard/stats', { credentials: 'same-origin' });
        
        if (!response.ok) {
          // Try to get error message from response body if available
          let errorMsg = 'Failed to fetch dashboard statistics';
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (jsonError) {
            // Ignore if response body is not valid JSON
          }
          console.error('API response not OK:', response.status, errorMsg);
          throw new Error(errorMsg); // Throw specific error
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

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
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