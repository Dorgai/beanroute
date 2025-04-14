import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
// We'll likely need useAuth later
// import { useAuth } from '../../context/AuthContext';

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({});
  // const { user: currentUser } = useAuth(); // Uncomment if needed for permissions check

  // TODO: Add state for filters, sorting, search, page

  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Add query parameters based on state
      const response = await fetch('/api/shops', { credentials: 'same-origin' });

      if (!response.ok) {
        let errorMsg = 'Failed to fetch shops';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        throw new Error(`${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      setShops(data.shops || []);
      setMeta(data.meta || {});
    } catch (err) {
      console.error('Fetch shops error:', err);
      setError(err.message || 'Could not load shops.');
      setShops([]); // Clear shops on error
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Handler for deleting a shop
  const handleDeleteShop = async (shopId, shopName) => {
    if (!window.confirm(`Are you sure you want to delete the shop "${shopName}"? This action cannot be undone.`)) {
      return;
    }

    // Optimistically remove shop from list
    const originalShops = [...shops];
    setShops(prevShops => prevShops.filter(s => s.id !== shopId));
    setError(''); // Clear previous errors

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to delete shop';
        try {
          // If API returns JSON error on failure (e.g., 404, 403)
          const errorData = await response.json(); 
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        // Revert optimistic update
        setShops(originalShops);
        setError(`Error: ${response.status} ${errorMsg}`);
        // TODO: Display error more prominently
      }
      // On successful 204, no action needed, shop already removed from state
      // Optionally show a success message: e.g., setSuccess('Shop deleted successfully');
    } catch (err) {
      console.error('Delete shop error:', err);
      setShops(originalShops); // Revert optimistic update
      setError(err.message || 'Could not delete shop.');
    }
  };

  return (
    <>
      <Head>
        <title>Shop Management</title>
      </Head>

      <div className="space-y-6">
        {/* Header + Add Button */}
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-xl font-semibold text-gray-900">Shops</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage shop locations.
            </p>
          </div>
          <div>
            <Link
              href="/shops/create" // This link will 404 until we create the page
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add Shop
            </Link>
          </div>
        </div>

        {/* TODO: Add Filtering/Search UI (Minimal) */}

        {/* Display error message */} 
        {error && (
            <div className="p-3 border border-red-300 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
        )}

        {/* Shop Table */}
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Min Small Bags</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Min Large Bags</th>
                      {/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created By</th> */}
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="whitespace-nowrap py-4 px-3 text-sm text-center text-gray-500">Loading...</td>
                      </tr>
                    ) : shops.length === 0 && !error ? ( // Added !error condition here
                      <tr>
                        <td colSpan="5" className="whitespace-nowrap py-4 px-3 text-sm text-center text-gray-500">No shops found. Use 'Add Shop' to create one.</td>
                      </tr>
                    ) : ( // Removed error check here as it's handled above
                      !loading && !error && shops.map((shop) => ( // Added !loading && !error check
                        <tr key={shop.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{shop.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{shop.address || '-'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{shop.minCoffeeQuantitySmall}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{shop.minCoffeeQuantityLarge}</td>
                          {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{shop.createdBy?.username || '-'}</td> */}
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                            <Link href={`/shops/edit/${shop.id}`} className="text-blue-600 hover:text-blue-800 text-xs">Edit</Link>
                            <Link href={`/shops/${shop.id}/users`} className="text-info-600 hover:text-info-800 text-xs">Manage Users</Link>
                            {/* Delete Button */}
                            {/* Consider adding permission check here if needed: && currentUser?.canDeleteShops */}
                            <button
                              onClick={() => handleDeleteShop(shop.id, shop.name)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
                {/* TODO: Add Pagination UI (Minimal) */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 