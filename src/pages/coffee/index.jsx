import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

export default function CoffeeListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [coffeeList, setCoffeeList] = useState([]);
  const [groupedCoffee, setGroupedCoffee] = useState({});
  const [isGrouped, setIsGrouped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchCoffee = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/coffee?all=true&groupByGrade=true&sortByStock=true${search ? `&search=${search}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coffee data');
      }
      const data = await response.json();
      
      if (data.grouped) {
        setIsGrouped(true);
        setGroupedCoffee(data.coffee);
        // Create a flat list for fallback
        const flatList = Object.values(data.coffee).flat();
        setCoffeeList(flatList);
      } else {
        setIsGrouped(false);
        setCoffeeList(data.coffee);
      }
    } catch (err) {
      console.error('Error fetching coffee:', err);
      setError('Failed to load coffee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCoffee(searchTerm);
  }, []);

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      fetchCoffee(value);
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
      
      // Refresh the list
      fetchCoffee(searchTerm);
    } catch (err) {
      console.error('Error deleting coffee:', err);
      
      // Show a more detailed error message for foreign key constraints
      if (err.message.includes('associated inventory logs') || 
          err.message.includes('retail inventory') ||
          err.message.includes('orders')) {
        // Remove the generic alert and use a more elegant approach
        setError(`Cannot delete "${coffeeName}" because it has been used in inventory logs, shop inventory, or orders. 
                 You should mark it as inactive instead of deleting it.`);
        
        // Scroll to the top where the error message is displayed
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Show generic error message for other issues
        alert(err.message || 'An error occurred while deleting the coffee.');
      }
    }
  };

  // Allow admin, owner and roaster to manage coffee
  const canManageCoffee = user && ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);
  // Only allow admin and owner to add new coffee
  const canAddCoffee = user && ['ADMIN', 'OWNER'].includes(user.role);
  // Only allow admin and owner to see price
  const canSeePrice = user && ['ADMIN', 'OWNER'].includes(user.role);

  // Format grade for display
  const formatGrade = (grade) => {
    if (!grade) return 'Unknown';
    return grade.charAt(0) + grade.slice(1).toLowerCase().replace('_', ' ');
  };

  // Get background color for grade header
  const getGradeHeaderColor = (grade) => {
    switch (grade) {
      case 'SPECIALTY':
        return 'bg-emerald-100 text-emerald-800';
      case 'PREMIUM':
        return 'bg-blue-100 text-blue-800';
      case 'RARITY':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render coffee table rows
  const renderCoffeeRow = (coffee, isLastInSection = false) => (
    <tr key={coffee.id} className={`hover:bg-gray-50 ${coffee.quantity <= 0 ? 'bg-gray-50' : ''} ${isLastInSection ? 'border-b-2 border-gray-300' : ''}`}>
      {canManageCoffee && (
        <td className="px-4 py-2 whitespace-nowrap text-left text-sm">
          <div className="flex space-x-2">
            <Link
              href={`/coffee/${coffee.id}`}
              className="text-blue-600 hover:text-blue-800"
              title="View details"
            >
              View
            </Link>
            <Link
              href={`/coffee/${coffee.id}`}
              className="text-indigo-600 hover:text-indigo-800"
              title="Update inventory"
            >
              Inventory
            </Link>
            {canAddCoffee && (
              <>
                <Link
                  href={`/coffee/edit/${coffee.id}`}
                  className="text-indigo-600 hover:text-indigo-800"
                  title="Edit coffee"
                >
                  <FiEdit2 className="inline" />
                </Link>
                <button
                  onClick={() => handleDeleteCoffee(coffee.id, coffee.name)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete coffee"
                >
                  <FiTrash2 className="inline" />
                </button>
              </>
            )}
          </div>
        </td>
      )}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{coffee.name}</div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className={`text-sm ${coffee.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-500'}`}>
          {coffee.quantity > 0 ? `${parseFloat(coffee.quantity).toFixed(2)} kg` : 'Out of stock'}
        </div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="text-sm text-gray-500">{formatGrade(coffee.grade)}</div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="text-sm text-gray-500">{coffee.process || '-'}</div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="text-sm text-gray-500">{coffee.producer || '-'}</div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="text-sm text-gray-500">{coffee.country || '-'}</div>
      </td>
      {canSeePrice && (
        <td className="px-4 py-2 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {coffee.price ? `$${parseFloat(coffee.price).toFixed(2)}` : '-'}
          </div>
        </td>
      )}
    </tr>
  );

  // Render grade headers and coffee items
  const renderGradeSections = () => {
    return Object.entries(groupedCoffee).map(([grade, coffees], gradeIndex) => (
      <>
        {/* Grade header row */}
        <tr key={`header-${grade}`} className={`${getGradeHeaderColor(grade)}`}>
          <td 
            colSpan={canSeePrice ? 8 : 7} 
            className="px-4 py-1 text-left font-semibold"
          >
            {formatGrade(grade)} ({coffees.length})
          </td>
        </tr>
        
        {/* Coffee rows for this grade */}
        {coffees.map((coffee, index) => renderCoffeeRow(coffee))}
      </>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Coffee Management</h1>
        <div className="flex space-x-2">
          <Link href="/coffee/inventory" className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-md text-sm flex items-center">
            Inventory History
          </Link>
          {canAddCoffee && (
            <Link href="/coffee/create" className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded-md text-sm flex items-center">
              <FiPlus className="mr-1" /> Add Coffee
            </Link>
          )}
        </div>
      </div>

      {/* Search and filter */}
      <div className="mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search coffee by name, country, or producer..."
            className="w-full pl-10 py-2 pr-4 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading coffee data...</p>
        </div>
      ) : coffeeList.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-500 text-sm">No coffee entries found.</p>
          {searchTerm && (
            <p className="mt-2">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  fetchCoffee('');
                }}
                className="text-emerald-600 hover:underline text-sm"
              >
                Clear search
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          {isGrouped ? (
            // Single table with grouped coffee
            <div className="overflow-x-auto bg-white rounded-md border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {canManageCoffee && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country of Origin</th>
                    {canSeePrice && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderGradeSections()}
                </tbody>
              </table>
            </div>
          ) : (
            // Fallback to non-grouped display
            <div className="overflow-x-auto bg-white rounded-md border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {canManageCoffee && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country of Origin</th>
                    {canSeePrice && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coffeeList.map(coffee => renderCoffeeRow(coffee))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
} 