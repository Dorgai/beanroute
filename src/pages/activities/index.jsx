import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withAuth } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';

function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    fromDate: '',
    toDate: ''
  });
  
  // Constants for filter options
  const actionTypes = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'RESET_PASSWORD'];
  const resourceTypes = ['USER', 'SHOP', 'COFFEE'];
  
  useEffect(() => {
    fetchActivities();
  }, [page]);
  
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 20);
      
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.resource) queryParams.append('resource', filters.resource);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      
      const res = await fetch(`/api/activities?${queryParams.toString()}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      const data = await res.json();
      setActivities(data.activities);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchActivities();
  };
  
  const resetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resource: '',
      fromDate: '',
      toDate: ''
    });
    setPage(1);
    fetchActivities();
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Get readable action description
  const getActionDescription = (activity) => {
    const { action, resource, resourceId, details } = activity;
    
    let description = `${action} ${resource}`;
    if (resourceId) {
      description += ` (ID: ${resourceId})`;
    }
    
    if (details) {
      description += `: ${details}`;
    }
    
    return description;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Activity Logs</h1>
        <p className="text-gray-600">Track and monitor user activities within the system</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Filters</h2>
        <form onSubmit={applyFilters} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <select
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
              <select
                name="resource"
                value={filters.resource}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All Resources</option>
                {resourceTypes.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                placeholder="Filter by User ID"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-primary rounded"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Activity Logs Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 bg-white rounded shadow">
          No activity logs found.
        </div>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(activity.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {activity.user ? (
                        <div>
                          <div className="font-medium text-gray-900">{activity.user.username}</div>
                          <div className="text-gray-500">{activity.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown user</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        activity.action === 'LOGIN' || activity.action === 'LOGOUT' ? 'bg-blue-100 text-blue-800' : 
                        activity.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        activity.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                        activity.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.resource}
                      {activity.resourceId && (
                        <span className="ml-1 text-xs text-gray-400">
                          (ID: {activity.resourceId})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {activity.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-700">
                Showing page {page} of {totalPages} ({totalCount} total logs)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${
                    page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-gray-100'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${
                    page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:bg-gray-100'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default withAuth(ActivitiesPage); 