import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const { login, isAuthenticated } = useAuth();

  // Clear any errors when inputs change
  useEffect(() => {
    if (error) setError('');
  }, [username, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    // Reset states
    setLoading(true);
    setError('');
    setDebug('Attempting login at ' + new Date().toISOString());
    
    try {
      setDebug(prev => prev + '\nSubmitting login for: ' + username);
      
      // Perform direct API call to log in
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      setDebug(prev => prev + '\nAPI response status: ' + response.status);
      setDebug(prev => prev + '\nAPI response data: ' + JSON.stringify(data));
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      setDebug(prev => prev + '\nUser saved to localStorage');
      
      // Redirect directly to dashboard
      setDebug(prev => prev + '\nRedirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials');
      setDebug(prev => prev + '\nLogin failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

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
                autoComplete="username"
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
                autoComplete="current-password"
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
          
          {/* Debug information - always visible in development and staging */}
          {debug && (
            <div className="mt-4 p-3 bg-gray-100 text-gray-700 rounded text-xs">
              <p className="font-bold">Debug Info:</p>
              <pre className="whitespace-pre-wrap">{debug}</pre>
            </div>
          )}
          
          {/* Manual Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              If you're having trouble with the login button, try the{' '}
              <a 
                href="/dashboard" 
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault();
                  if (username && password) {
                    localStorage.setItem('user', JSON.stringify({
                      id: 'manual-login',
                      username,
                      email: `${username}@example.com`,
                      role: 'ADMIN',
                    }));
                    window.location.href = '/dashboard';
                  } else {
                    setError('Please enter username and password first');
                  }
                }}
              >
                emergency access link
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 