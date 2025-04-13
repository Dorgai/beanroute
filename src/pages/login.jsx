import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    
    // Only check login status if we're not already on the login page as a result of a redirect
    if (typeof window !== 'undefined' && !window.location.href.includes('redirected=true')) {
      try {
        const userData = localStorage.getItem('user');
        if (userData && JSON.parse(userData)) {
          // If logged in, redirect to dashboard
          window.location.href = '/dashboard';
          return;
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    }
    
    setCheckingAuth(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Submitting login for:', username);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      console.log('Login successful:', data);
      
      // Store user data in localStorage
      if (isClient && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('User data stored in localStorage');
      }
      
      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while we're checking auth to prevent flashes
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login - User Management System</title>
        <meta name="description" content="Login to User Management System" />
      </Head>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600">User Management</h1>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
            <p className="mt-1 text-sm text-gray-500">
              Demo: username "admin" with password "secret"
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
} 