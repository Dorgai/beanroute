import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ShopUsers() {
  const router = useRouter();
  const { shopId } = router.query;
  const { user } = useAuth();
  
  const [shop, setShop] = useState(null);
  const [shopUsers, setShopUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('BARISTA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debug, setDebug] = useState({});
  
  // Fetch shop details and current shop users
  useEffect(() => {
    if (!shopId) {
      console.log("[shop-users] No shop ID available yet, waiting...");
      return;
    }
    
    console.log(`[shop-users] Fetching data for shop ID: ${shopId}`);
    setError('');
    
    const fetchShopData = async () => {
      setLoading(true);
      
      try {
        // Fetch shop details
        console.log(`[shop-users] Making API request to /api/shops/${shopId}`);
        const shopResponse = await fetch(`/api/shops/${shopId}`);
        
        if (!shopResponse.ok) {
          console.error(`[shop-users] Shop API response status: ${shopResponse.status}`);
          throw new Error(`Failed to fetch shop: ${shopResponse.statusText || shopResponse.status}`);
        }
        
        const shopData = await shopResponse.json();
        console.log("[shop-users] Shop data:", shopData);
        setShop(shopData);
        
        // Fetch shop users
        console.log(`[shop-users] Making API request to /api/shops/${shopId}/users`);
        const usersResponse = await fetch(`/api/shops/${shopId}/users`);
        
        if (!usersResponse.ok) {
          console.error(`[shop-users] Shop users API response status: ${usersResponse.status}`);
          throw new Error(`Failed to fetch shop users: ${usersResponse.statusText || usersResponse.status}`);
        }
        
        const shopUsersData = await usersResponse.json();
        console.log(`[shop-users] Found ${shopUsersData.length} shop users`);
        setShopUsers(shopUsersData);
        
        // Fetch all users for assignment
        console.log("[shop-users] Making API request to /api/users");
        const allUsersResponse = await fetch('/api/users');
        
        if (!allUsersResponse.ok) {
          console.error(`[shop-users] All users API response status: ${allUsersResponse.status}`);
          throw new Error(`Failed to fetch users: ${allUsersResponse.statusText || allUsersResponse.status}`);
        }
        
        const allUsersData = await allUsersResponse.json();
        const usersList = allUsersData.users || [];
        console.log(`[shop-users] Found ${usersList.length} total users`);
        setAllUsers(usersList);
        
        // Compute available users
        const shopUserIds = shopUsersData.map(su => su.userId);
        console.log(`[shop-users] Shop user IDs:`, shopUserIds);
        
        const availableUsersList = usersList.filter(user => !shopUserIds.includes(user.id));
        console.log(`[shop-users] Available users (${availableUsersList.length}):`, 
          availableUsersList.map(u => u.username));
        
        // Set debug info
        setDebug({
          shopId,
          shopLoaded: !!shopData,
          shopName: shopData.name,
          allUsersCount: usersList.length,
          shopUsersCount: shopUsersData.length,
          availableUsersCount: availableUsersList.length,
          availableUsers: availableUsersList.map(u => u.username),
          shopUserIds,
        });
        
      } catch (err) {
        console.error('[shop-users] Error fetching shop data:', err);
        setError(err.message || 'Failed to load shop data');
        setDebug(prev => ({ 
          ...prev, 
          error: err.message, 
          errorStack: err.stack 
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [shopId]);
  
  // Handle adding a user to the shop
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user to add');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      console.log(`Adding user ${selectedUser} to shop ${shopId} with role ${selectedRole}`);
      const response = await fetch(`/api/shops/${shopId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          role: selectedRole
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add user to shop');
      }
      
      console.log('User added successfully:', responseData);
      
      // Refresh the user list
      const refreshResponse = await fetch(`/api/shops/${shopId}/users`);
      const refreshedData = await refreshResponse.json();
      setShopUsers(refreshedData);
      
      setSuccessMessage('User added to shop successfully');
      setSelectedUser('');
    } catch (err) {
      console.error('Error adding user to shop:', err);
      setError(err.message || 'Failed to add user to shop');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle removing a user from the shop
  const handleRemoveUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user from the shop?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch(`/api/shops/${shopId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove user from shop');
      }
      
      // Update the UI by removing the user from the list
      setShopUsers(shopUsers.filter(shopUser => shopUser.userId !== userId));
      setSuccessMessage('User removed from shop successfully');
    } catch (err) {
      console.error('Error removing user from shop:', err);
      setError(err.message || 'Failed to remove user from shop');
    } finally {
      setLoading(false);
    }
  };
  
  // Get available users (users not already assigned to the shop)
  const getAvailableUsers = (users = [], shopUsersList = []) => {
    if (!users || !users.length) {
      console.log('[shop-users] No users available to filter');
      return [];
    }
    
    if (!shopUsersList || !shopUsersList.length) {
      console.log('[shop-users] No shop users assigned yet - all users available');
      return users;
    }
    
    console.log(`[shop-users] Computing available users: ${users.length} total users, ${shopUsersList.length} shop users`);
    
    // Get array of just the user IDs that are assigned to this shop
    const assignedUserIds = shopUsersList.map(shopUser => shopUser.userId);
    console.log('[shop-users] Assigned user IDs:', assignedUserIds);
    
    // Filter the all users list to exclude those that are already assigned
    const availableUsers = users.filter(user => !assignedUserIds.includes(user.id));
    console.log(`[shop-users] Found ${availableUsers.length} available users`);
    
    return availableUsers;
  };
  
  // Make available users available for the UI
  const availableUsers = useMemo(() => {
    return getAvailableUsers(allUsers, shopUsers);
  }, [allUsers, shopUsers]);
  
  if (loading && !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Loading shop users...</h1>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {shop ? `Users for ${shop.name}` : 'Shop Users'}
        </h1>
        <Link href="/shops" className="btn btn-secondary">
          Back to Shops
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-error mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success mb-4">
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Add user form */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add User to Shop</h2>
        <form onSubmit={handleAddUser} className="flex flex-wrap gap-2 items-end">
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Select User</span>
            </label>
            <select 
              className="select select-bordered"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="">Select a user</option>
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.firstName} {user.lastName})
                  </option>
                ))
              ) : (
                <option value="" disabled>No available users</option>
              )}
            </select>
            {availableUsers.length === 0 && !loading && (
              <p className="text-amber-600 text-sm mt-1">
                No available users to add. All users may already be assigned to this shop.
              </p>
            )}
          </div>
          
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Role in Shop</span>
            </label>
            <select 
              className="select select-bordered"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="BARISTA">Barista</option>
              <option value="ROASTER">Roaster</option>
              <option value="RETAILER">Retailer</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
            disabled={loading || !selectedUser}
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
      
      {/* Current shop users */}
      <div className="bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Current Users</h2>
        
        {loading ? (
          <p>Loading users...</p>
        ) : shopUsers && shopUsers.length > 0 ? (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Username</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shopUsers.map((shopUser) => (
                <tr key={shopUser.userId} className="border-b">
                  <td className="py-2">{shopUser.user?.username || 'Unknown'}</td>
                  <td className="py-2">
                    {shopUser.user?.firstName 
                      ? `${shopUser.user.firstName} ${shopUser.user.lastName || ''}` 
                      : 'N/A'}
                  </td>
                  <td className="py-2">{shopUser.role}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleRemoveUser(shopUser.userId)}
                      className="btn btn-sm btn-error"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users assigned to this shop yet.</p>
        )}
      </div>
      
      {/* Debug information (only in development) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              shopId,
              shopLoaded: !!shop,
              shopName: shop?.name,
              allUsersCount: allUsers?.length,
              availableUsersCount: availableUsers?.length,
              shopUsersCount: shopUsers?.length,
              ...debug
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 