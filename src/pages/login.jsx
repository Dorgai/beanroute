import React, { useState } from 'react';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('secret');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  
  const addDebug = (message) => {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    setDebug(prev => `${prev}\n${time}: ${message}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    addDebug(`Attempting login with username: ${username}`);
    
    try {
      // Call the login API directly
      addDebug('Sending API request to /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      addDebug(`API response status: ${response.status}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save user data to localStorage
      addDebug('Storing user data in localStorage');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      addDebug('Login successful, redirecting to dashboard...');
      window.location.replace('/dashboard');
      
    } catch (err) {
      addDebug(`Error: ${err.message || 'Unknown error'}`);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <Head>
        <title>Login - Bean Route</title>
      </Head>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Bean Route</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 rounded-md bg-gray-50 p-4">
            <div className="text-sm">
              <h3 className="font-medium text-gray-900">Debug Information</h3>
              <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap h-32 overflow-y-auto">{debug || 'No logs yet'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 