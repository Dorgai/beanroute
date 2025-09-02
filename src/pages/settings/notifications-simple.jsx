// Simplified Notification Settings Page for debugging
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function SimpleNotificationSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        console.log('Fetching session...');
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Session data:', data);
        
        if (data && data.user) {
          setSession(data);
        } else {
          console.log('No user in session, redirecting to login');
          router.push('/login');
        }
      } catch (err) {
        console.error('Session fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Not Logged In</h1>
          <p className="text-gray-600 mb-4">Please log in to access notification settings.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings (Simple)</h1>
            <p className="mt-1 text-sm text-gray-600">
              Debugging version - basic functionality only
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User ID:</strong> {session.user.id}</p>
            <p><strong>Username:</strong> {session.user.username}</p>
            <p><strong>Role:</strong> {session.user.role}</p>
            <p><strong>Browser:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}</p>
            <p><strong>Push Notifications Supported:</strong> {typeof window !== 'undefined' && 'Notification' in window ? 'Yes' : 'No'}</p>
            <p><strong>Service Worker Supported:</strong> {typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Basic Notification Test */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Notification Test</h2>
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  const permission = await Notification.requestPermission();
                  alert(`Permission: ${permission}`);
                } catch (error) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Request Permission
            </button>
            
            <button
              onClick={() => {
                try {
                  new Notification('Test', { body: 'This is a test notification' });
                } catch (error) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ml-2"
            >
              Show Test Notification
            </button>

            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/push/config');
                  const data = await response.json();
                  alert(`VAPID Config: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 ml-2"
            >
              Test VAPID Config
            </button>

            <button
              onClick={async () => {
                try {
                  // Test subscription API directly
                  const mockSubscription = {
                    endpoint: 'test://mock-endpoint',
                    keys: {
                      p256dh: 'test-p256dh-key',
                      auth: 'test-auth-key'
                    }
                  };
                  
                  const response = await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      subscription: mockSubscription,
                      userAgent: navigator.userAgent
                    })
                  });
                  
                  const data = await response.json();
                  if (response.ok) {
                    alert(`Subscription API works: ${JSON.stringify(data, null, 2)}`);
                  } else {
                    alert(`Subscription API error: ${JSON.stringify(data, null, 2)}`);
                  }
                } catch (error) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 ml-2 mt-2"
            >
              Test Subscription API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
