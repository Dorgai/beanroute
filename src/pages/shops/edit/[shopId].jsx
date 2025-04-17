import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function EditShopPage() {
  const router = useRouter();
  const { shopId } = router.query; // Get shopId from URL

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [minSmall, setMinSmall] = useState('0');
  const [minLarge, setMinLarge] = useState('0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    minCoffeeQuantitySmall: '0',
    minCoffeeQuantityLarge: '0',
  });

  // Fetch existing shop data
  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/shops/shop-details?id=${shopId}`, { credentials: 'same-origin' });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shop: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Set form values based on fetched shop
        setFormData({
          name: data.name || '',
          address: data.address || '',
          minCoffeeQuantitySmall: data.minCoffeeQuantitySmall?.toString() || '0',
          minCoffeeQuantityLarge: data.minCoffeeQuantityLarge?.toString() || '0',
        });
        
      } catch (error) {
        console.error('Error fetching shop details:', error);
        setError(error.message || 'Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };
    
    if (shopId) {
      fetchShop();
    }
  }, [shopId]);

  // Handle form submission (update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name) {
      setError('Shop name is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/shops/shop-details?id=${shopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Shop updated successfully:', data);
      
      router.push('/shops'); // Redirect on success

    } catch (err) {
      console.error('Update shop error:', err);
      setError(err.message || 'Could not update shop.');
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while fetching initial data
  if (fetchLoading) {
      return (
          <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
          </div>
      );
  }

  return (
    <>
      <Head>
        <title>Edit Shop: {formData.name || '...'}</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Edit Shop</h1>
        </div>

        {error && (
            <div className="p-3 border border-red-300 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
        )}

        {/* Re-use create form structure */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Shop Name</label>
            <input type="text" id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address (Optional)</label>
            <input type="text" id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          {/* Min Small */}
          <div>
            <label htmlFor="minSmall" className="block text-sm font-medium text-gray-700">Min Small Bags (250g)</label>
            <input type="number" id="minSmall" value={formData.minCoffeeQuantitySmall} onChange={(e) => setFormData({ ...formData, minCoffeeQuantitySmall: e.target.value })} min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          {/* Min Large */}
          <div>
            <label htmlFor="minLarge" className="block text-sm font-medium text-gray-700">Min Large Bags (1kg)</label>
            <input type="number" id="minLarge" value={formData.minCoffeeQuantityLarge} onChange={(e) => setFormData({ ...formData, minCoffeeQuantityLarge: e.target.value })} min="0" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Link href="/shops" className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2 px-4 rounded-md border border-gray-300">
                Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`text-sm font-medium text-white py-2 px-4 rounded-md border border-transparent ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 