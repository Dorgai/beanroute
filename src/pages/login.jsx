import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  // Check if we're already logged in
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        // We have user data, redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Error checking localStorage:', err);
    }
  }, []);

  const addDebug = (message) => {
    setDebugInfo(prev => `${prev}\n${new Date().toISOString().substring(11, 19)}: ${message}`);
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    addDebug(`Login attempt for ${username}`);
    
    try {
      // Direct API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      addDebug(`API response status: ${response.status}`);
      const data = await response.json();
      addDebug(`API response: ${JSON.stringify(data).substring(0, 100)}...`);
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store user data in localStorage
      addDebug('Storing user data in localStorage');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Direct navigation to dashboard
      addDebug('Redirecting to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      addDebug(`Error: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Direct admin login without API (emergency access)
  const handleDirectLogin = () => {
    const userData = {
      id: 'direct-login-user',
      username: username || 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    };
    
    addDebug('Using direct login (emergency access)');
    localStorage.setItem('user', JSON.stringify(userData));
    window.location.href = '/dashboard';
  };

  return (
    <>
      <Head>
        <title>Login - User Management System</title>
      </Head>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
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
          
          <form className="space-y-6" onSubmit={handleLogin}>
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
                placeholder="Username"
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
                placeholder="Password"
                required
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              
              <button
                type="button"
                onClick={handleDirectLogin}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Emergency Access
              </button>
            </div>
          </form>
          
          {/* Debug info - always visible */}
          <div className="mt-4 p-3 bg-gray-100 text-xs text-gray-800 rounded h-40 overflow-y-auto">
            <strong>Debug Info:</strong>
            <pre className="whitespace-pre-wrap">{debugInfo || 'No debug information yet'}</pre>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Having issues? Try the Emergency Access button or clear your browser cache.</p>
          </div>
        </div>
      </div>
    </>
  );
} 