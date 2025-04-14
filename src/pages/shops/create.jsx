import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
// import { useAuth } from '../../context/AuthContext'; // To check permissions if needed

export default function CreateShopPage() {
  const router = useRouter();
  // const { user } = useAuth(); // Get user if needed for permissions
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [minSmall, setMinSmall] = useState('0');
  const [minLarge, setMinLarge] = useState('0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!name) {
      setError('Shop name is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          address,
          minCoffeeQuantitySmall: parseInt(minSmall, 10),
          minCoffeeQuantityLarge: parseInt(minLarge, 10)
        }),
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }

      // Redirect to shops list on success
      router.push('/shops'); 

    } catch (err) {
      console.error('Create shop error:', err);
      setError(err.message || 'Could not create shop.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create New Shop</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create New Shop</h1>
        </div>

        {error && (
            <div className="p-3 border border-red-300 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Shop Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address (Optional)
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
           <div>
            <label htmlFor="minSmall" className="block text-sm font-medium text-gray-700">
              Min Small Bags (250g)
            </label>
            <input
              type="number"
              id="minSmall"
              value={minSmall}
              onChange={(e) => setMinSmall(e.target.value)}
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
           <div>
            <label htmlFor="minLarge" className="block text-sm font-medium text-gray-700">
              Min Large Bags (1kg)
            </label>
            <input
              type="number"
              id="minLarge"
              value={minLarge}
              onChange={(e) => setMinLarge(e.target.value)}
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Link href="/shops" className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2 px-4 rounded-md border border-gray-300">
                Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`text-sm font-medium text-white py-2 px-4 rounded-md border border-transparent ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
            >
              {loading ? 'Creating...' : 'Create Shop'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 