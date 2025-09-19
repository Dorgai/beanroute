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
  const [zeroStockCoffee, setZeroStockCoffee] = useState([]);
  const [stockSummaries, setStockSummaries] = useState({});
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
        
        // Separate zero-stock coffees and calculate summaries
        const { groupedWithStock, zeroStock, summaries } = processCoffeeData(data.coffee);
        
        setGroupedCoffee(groupedWithStock);
        setZeroStockCoffee(zeroStock);
        setStockSummaries(summaries);
        
        // Create a flat list for fallback
        const flatList = Object.values(groupedWithStock).flat();
        setCoffeeList(flatList);
      } else {
        setIsGrouped(false);
        setCoffeeList(data.coffee);
        setZeroStockCoffee([]);
        setStockSummaries({});
      }
    } catch (err) {
      console.error('Error fetching coffee:', err);
      setError('Failed to load coffee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process coffee data and separate zero-stock items
  const processCoffeeData = (groupedData) => {
    const groupedWithStock = {};
    const zeroStock = [];
    const summaries = {};

    Object.entries(groupedData).forEach(([grade, coffees]) => {
      const stockCoffees = [];
      let totalStock = 0;

      coffees.forEach(coffee => {
        const stock = coffee.quantity || 0;
        if (stock > 0) {
          stockCoffees.push(coffee);
          totalStock += stock;
        } else {
          zeroStock.push({ ...coffee, grade });
        }
      });

      if (stockCoffees.length > 0) {
        groupedWithStock[grade] = stockCoffees;
        summaries[grade] = {
          count: stockCoffees.length,
          totalStock: totalStock.toFixed(2)
        };
      }
    });

    return { groupedWithStock, zeroStock, summaries };
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

  // Get background color for grade header - standardized for all grades
  const getGradeHeaderColor = (grade) => {
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  // Render coffee table rows
  const renderCoffeeRow = (coffee, isLastInSection = false) => (
    <tr key={coffee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      {canManageCoffee && (
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex space-x-1">
            <Link href={`/coffee/${coffee.id}`} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300">
              <FiEdit2 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDeleteCoffee(coffee.id, coffee.name)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{coffee.name}</div>
          {coffee.country && (
            <div className="text-sm text-gray-500 dark:text-gray-400">{coffee.country}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          coffee.quantity > 0 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {coffee.quantity.toFixed(2)} kg
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          (coffee.labelQuantity || 0) < 15 
            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        }`}>
          {coffee.labelQuantity || 0} labels
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeHeaderColor(coffee.grade)}`}>
          {formatGrade(coffee.grade)}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex space-x-1">
          {coffee.isEspresso && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
              E
            </span>
          )}
          {coffee.isFilter && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              F
            </span>
          )}
          {coffee.isSignature && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              S
            </span>
          )}
          {!coffee.isEspresso && !coffee.isFilter && !coffee.isSignature && (
            <span className="text-gray-400 dark:text-gray-500 text-xs">Not set</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {coffee.producer || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {coffee.process || '-'}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {coffee.country || '-'}
      </td>
      {canSeePrice && (
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {coffee.price ? `$${parseFloat(coffee.price).toFixed(2)}` : '-'}
          </div>
        </td>
      )}
    </tr>
  );

  // Render individual grade tables
  const renderGradeTables = () => {
    const gradeOrder = ['SPECIALTY', 'PREMIUM', 'RARITY'];
    
    return gradeOrder.map((grade) => {
      const coffees = groupedCoffee[grade] || [];
      const summary = stockSummaries[grade];
      
      if (coffees.length === 0) {
        return null; // Don't render empty tables
      }
      
      return (
        <div key={grade} className="mb-8">
          {/* Grade header */}
          <div className={`${getGradeHeaderColor(grade)} px-4 py-3 rounded-t-md`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {formatGrade(grade)} Grade Coffee
              </h3>
              <div className="text-sm">
                <span className="font-medium">{summary?.count || coffees.length} coffees</span>
                <span className="ml-4">Total Stock: {summary?.totalStock || '0.00'} kg</span>
              </div>
            </div>
          </div>
          
          {/* Grade table */}
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-b-md border border-gray-200 dark:border-gray-600 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {canManageCoffee && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Labels</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brewing Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Process</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country of Origin</th>
                  {canSeePrice && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {coffees.map((coffee) => renderCoffeeRow(coffee))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }).filter(Boolean); // Remove null entries
  };

  return (
    <div className="container mx-auto px-4 py-4 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Coffee Management</h1>
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
            className="w-full pl-10 py-2 pr-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading coffee data...</p>
        </div>
      ) : coffeeList.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No coffee entries found.</p>
          {searchTerm && (
            <p className="mt-2">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  fetchCoffee('');
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm"
              >
                Clear search
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          {isGrouped ? (
            // Separate tables for each grade
            <div className="space-y-6">
              {renderGradeTables()}
            </div>
          ) : (
            // Fallback to non-grouped display
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {canManageCoffee && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Labels</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brewing Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Process</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country of Origin</th>
                    {canSeePrice && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {coffeeList.map(coffee => renderCoffeeRow(coffee))}
                </tbody>
              </table>
            </div>
          )}

          {/* Zero Stock Section */}
          {isGrouped && zeroStockCoffee.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Zero Stock Coffee</h3>
              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {canManageCoffee && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brewing Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Process</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Country of Origin</th>
                      {canSeePrice && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {zeroStockCoffee.map(coffee => renderCoffeeRow(coffee))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 