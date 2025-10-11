import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { FiArrowLeft } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export default function CoffeeInventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all inventory logs
  const fetchInventoryLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/coffee/inventory/logs?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory logs');
      }
      
      const data = await response.json();
      setInventoryLogs(data.logs || []);
      setTotalPages(data.meta?.pageCount || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching inventory logs:', err);
      setError('Failed to load inventory logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchInventoryLogs(page);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchInventoryLogs(1);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Coffee Inventory Changes</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Track all inventory modifications across all coffees</p>
        </div>
        <Link href="/coffee" className={`flex items-center ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
          <FiArrowLeft className="mr-1" /> Back to Coffee List
        </Link>
      </div>

      {error && (
        <div className={`${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-md mb-4`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading inventory data...</p>
        </div>
      ) : inventoryLogs.length === 0 ? (
        <div className={`text-center py-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No inventory changes have been recorded yet.</p>
        </div>
      ) : (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Date</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Coffee</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Change</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>New Total</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Notes</th>
                </tr>
              </thead>
              <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-600`}>
                {inventoryLogs.map((log) => (
                  <tr key={log.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Link href={`/coffee/${log.coffeeId}`} className="hover:underline">
                          {log.coffee.name}
                        </Link>
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {log.coffee.country ? `${log.coffee.country}` : ''}
                        {log.coffee.producer ? ` • ${log.coffee.producer}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.changeAmount > 0 
                          ? (isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
                          : (isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800')
                      }`}>
                        {log.changeAmount > 0 ? '+' : ''}{log.changeAmount} kg
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.quantity} kg
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.user?.username || 'Unknown'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center py-4 bg-gray-50 border-t border-gray-200">
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 