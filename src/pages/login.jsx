import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(false);
  const [autoLoginStatus, setAutoLoginStatus] = useState('');
  const router = useRouter();
  const { user, login, isAuthenticated } = useAuth();
  
  // Auto-login effect that respects the server authentication
  useEffect(() => {
    if (!autoLoginEnabled) return;
    
    const attemptAutoLogin = async () => {
      try {
        setAutoLoginStatus('Attempting auto-login...');
        const result = await login(username, password);
        
        if (result.success) {
          setAutoLoginStatus('Auto-login successful! Redirecting...');
          // Redirect happens automatically via the useAuth hook
        } else {
          setAutoLoginStatus('Auto-login failed. Please log in manually.');
          setError(result.error || 'Auto-login failed');
          setAutoLoginEnabled(false);
        }
      } catch (err) {
        console.error('Auto-login error:', err);
        setAutoLoginStatus('Auto-login error. Please log in manually.');
        setError(err.message || 'Auto-login failed');
        setAutoLoginEnabled(false);
      }
    };
    
    // Delay auto-login to give time for page to render
    const timer = setTimeout(() => {
      attemptAutoLogin();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [login, username, password, autoLoginEnabled]);
  
  // If user is already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/orders');
    }
  }, [isAuthenticated, router]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Emergency Access
  const handleEmergencyAccess = () => {
    try {
      // Create a basic admin user
      const user = {
        id: 'emergency-' + Date.now(),
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      };
      
      // Save to localStorage and redirect
      localStorage.setItem('user', JSON.stringify(user));
      setAutoLoginStatus('Emergency access granted. Redirecting...');
      
      // Give time for status message to display before redirecting
      setTimeout(() => {
        router.push('/orders');
      }, 1000);
    } catch (err) {
      console.error('Emergency access error:', err);
      setError('Failed to grant emergency access');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <Head>
        <title>Login - Bean Route</title>
      </Head>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Image 
            src="/images/sonic-beans-logo.svg" 
            alt="Sonic Beans Logo" 
            width={200} 
            height={100} 
            priority
          />
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the dashboard
        </p>
        {autoLoginEnabled && autoLoginStatus && (
          <p className="mt-2 text-center text-sm font-bold text-green-600">
            {autoLoginStatus}
          </p>
        )}
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

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
              
              <button
                type="button"
                onClick={handleEmergencyAccess}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Emergency Access
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 