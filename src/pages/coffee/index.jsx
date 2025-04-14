import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';

export default function CoffeeListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [coffeeList, setCoffeeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchCoffee = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/coffee?page=${page}&pageSize=10${search ? `&search=${search}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coffee data');
      }
      const data = await response.json();
      setCoffeeList(data.coffee);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching coffee:', err);
      setError('Failed to load coffee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCoffee(1, searchTerm);
  }, []);

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      fetchCoffee(1, value);
    }, 500);
    
    setSearchTimeout(timeoutId);
  };

  const handleDeleteCoffee = async (coffeeId, coffeeName) => {
    if (!confirm(`Are you sure you want to delete "${coffeeName}"?`)) {
      return;
    }

    try {
      // Optimistic update
      const originalCoffeeList = [...coffeeList];
      setCoffeeList(coffeeList.filter(coffee => coffee.id !== coffeeId));
      
      const response = await fetch(`/api/coffee/${coffeeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Revert optimistic update on failure
        setCoffeeList(originalCoffeeList);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete coffee');
      }
      
      // Show success message
      alert(`Coffee "${coffeeName}" has been deleted successfully.`);
      
      // Refresh the list if we deleted the last item on a page
      if (coffeeList.length === 1 && currentPage > 1) {
        fetchCoffee(currentPage - 1, searchTerm);
      } else {
        fetchCoffee(currentPage, searchTerm);
      }
    } catch (err) {
      console.error('Error deleting coffee:', err);
      alert(err.message || 'An error occurred while deleting the coffee.');
    }
  };

  const canManageCoffee = user && ['ADMIN', 'OWNER'].includes(user.role);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coffee Management</h1>
          {canManageCoffee && (
            <Link href="/coffee/create" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
              Add New Coffee
            </Link>
          )}
        </div>

        {/* Search and filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search coffee by name, roaster, or origin..."
            className="w-full p-2 border border-gray-300 rounded"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading coffee data...</div>
        ) : coffeeList.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-gray-500">No coffee entries found.</p>
            {searchTerm && (
              <p className="mt-2">
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    fetchCoffee(1, '');
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Clear search
                </button>
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roaster</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    {canManageCoffee && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coffeeList.map((coffee) => (
                    <tr key={coffee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{coffee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{coffee.roaster || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{coffee.origin || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{coffee.process || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {coffee.price ? `$${parseFloat(coffee.price).toFixed(2)}` : '-'}
                        </div>
                      </td>
                      {canManageCoffee && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/coffee/${coffee.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </Link>
                          <Link
                            href={`/coffee/edit/${coffee.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteCoffee(coffee.id, coffee.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center">
                  <button
                    onClick={() => fetchCoffee(currentPage - 1, searchTerm)}
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
                      onClick={() => fetchCoffee(page + 1, searchTerm)}
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
                    onClick={() => fetchCoffee(currentPage + 1, searchTerm)}
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
          </>
        )}
      </div>
    </Layout>
  );
} 