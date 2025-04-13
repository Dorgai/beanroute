import React, { useState } from 'react';
import Head from 'next/head';

export default function SimpleLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Simple direct login that bypasses API
  const handleDirectLogin = (e) => {
    e.preventDefault();
    
    try {
      setMessage('Using direct login...');
      
      // Create a basic user object
      const user = {
        id: 'direct-' + Date.now(),
        username: username || 'admin',
        email: (username || 'admin') + '@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      setMessage('User data saved to localStorage');
      
      // Use direct window location change
      window.location.assign('/dashboard');
    } catch (err) {
      setError('Login error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Login</title>
      </Head>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Bean Route
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          User Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleDirectLogin}>
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
                  placeholder="admin"
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
                  placeholder="secret"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Demo credentials
                </span>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm">
              <p>Username: <strong>admin</strong></p>
              <p>Password: <strong>secret</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 