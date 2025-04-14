import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function CoffeeDetailPage() {
  const router = useRouter();
  const { coffeeId } = router.query;
  const { user } = useAuth();
  
  const [coffee, setCoffee] = useState(null);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form state for inventory update
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // Fetch coffee data and inventory logs
  const fetchCoffeeData = async () => {
    if (!coffeeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch coffee details
      const response = await fetch(`/api/coffee/${coffeeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coffee data');
      }
      
      const data = await response.json();
      setCoffee(data);
      
      // Fetch inventory logs
      const logsResponse = await fetch(`/api/coffee/${coffeeId}/inventory?page=${currentPage}`);
      
      if (!logsResponse.ok) {
        throw new Error('Failed to fetch inventory logs');
      }
      
      const logsData = await logsResponse.json();
      setInventoryLogs(logsData.logs || []);
      setTotalPages(logsData.meta?.pageCount || 1);
    } catch (err) {
      console.error('Error fetching coffee data:', err);
      setError('Failed to load coffee data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle inventory page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle inventory update submission
  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    
    try {
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount)) {
        throw new Error('Please enter a valid number for amount');
      }
      
      const response = await fetch(`/api/coffee/${coffeeId}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parsedAmount,
          notes,
        }),
      });
      
      if (!response.ok) {
        // Check content type to handle different error formats
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update inventory');
        } else {
          // Handle non-JSON responses (like HTML error pages)
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      // Safely parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      // Update coffee with new quantity
      setCoffee(prev => ({
        ...prev,
        quantity: data.coffee.quantity
      }));
      
      // Broadcast inventory update event so header component can update
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('coffeeInventoryUpdated', { 
          detail: { timestamp: new Date().getTime() } 
        });
        window.dispatchEvent(event);
      }
      
      // Clear form
      setAmount('');
      setNotes('');
      
      // Show success message
      setUpdateSuccess(data.message || 'Inventory updated successfully');
      
      // Refresh inventory logs
      fetchCoffeeData();
    } catch (err) {
      console.error('Error updating inventory:', err);
      setUpdateError(err.message || 'An error occurred while updating inventory');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Fetch data when component mounts or coffeeId changes
  useEffect(() => {
    fetchCoffeeData();
  }, [coffeeId, currentPage]);

  // Check if user can manage coffee (add/update inventory)
  const canManageCoffee = user && ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);

  if (loading && !coffee) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">Loading coffee details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/coffee" className="text-blue-600 hover:underline">
            Back to Coffee List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{coffee?.name || 'Coffee Details'}</h1>
          <p className="text-gray-600">
            {coffee?.grade} • {coffee?.quantity ? `${coffee.quantity} kg in stock` : 'Out of stock'}
          </p>
        </div>
        <div className="space-x-2">
          <Link href="/coffee" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">
            Back to List
          </Link>
          {canManageCoffee && (
            <Link 
              href={`/coffee/edit/${coffeeId}`} 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Edit Coffee
            </Link>
          )}
        </div>
      </div>

      {/* Coffee details */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Coffee Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{coffee?.name || '-'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Current Stock</p>
            <p className="font-medium">{coffee?.quantity ? `${coffee.quantity} kg` : 'None'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Origin</p>
            <p className="font-medium">{coffee?.country || '-'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Roaster/Producer</p>
            <p className="font-medium">{coffee?.producer || '-'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Grade</p>
            <p className="font-medium">{coffee?.grade || '-'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Added By</p>
            <p className="font-medium">{coffee?.createdBy?.username || '-'}</p>
          </div>
          
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="font-medium">{coffee?.notes || 'No notes available'}</p>
          </div>
        </div>
      </div>

      {/* Inventory management section (for authorized users) */}
      {canManageCoffee && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Update Inventory</h2>
          
          {updateSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {updateSuccess}
            </div>
          )}
          
          {updateError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {updateError}
            </div>
          )}
          
          <form onSubmit={handleUpdateInventory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (kg)
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter positive or negative value"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add, negative to remove
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this inventory change"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={updateLoading}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                {updateLoading ? 'Updating...' : 'Update Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory logs */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory History</h2>
        
        {inventoryLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No inventory changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user?.username || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${log.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.changeAmount > 0 ? '+' : ''}{log.changeAmount} kg
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.quantity} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handlePageChange(page + 1)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === page + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 