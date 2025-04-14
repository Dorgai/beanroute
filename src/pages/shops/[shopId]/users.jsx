import { useState, useEffect } from 'react';
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
  
  // Fetch shop details and current shop users
  useEffect(() => {
    if (!shopId) return;
    
    const fetchShopData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch shop details
        const shopResponse = await fetch(`/api/shops/${shopId}`);
        if (!shopResponse.ok) {
          throw new Error(`Failed to fetch shop: ${shopResponse.statusText}`);
        }
        const shopData = await shopResponse.json();
        setShop(shopData);
        
        // Fetch shop users
        const usersResponse = await fetch(`/api/shops/${shopId}/users`);
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch shop users: ${usersResponse.statusText}`);
        }
        const shopUsersData = await usersResponse.json();
        setShopUsers(shopUsersData);
        
        // Fetch all users for assignment
        const allUsersResponse = await fetch('/api/users');
        if (!allUsersResponse.ok) {
          throw new Error(`Failed to fetch users: ${allUsersResponse.statusText}`);
        }
        const allUsersData = await allUsersResponse.json();
        setAllUsers(allUsersData.users);
        
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError(err.message || 'Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [shopId]);
  
  // Handle adding a user to the shop
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user to shop');
      }
      
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
      const response = await fetch(`/api/shops/${shopId}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
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
  const getAvailableUsers = () => {
    if (!allUsers || !shopUsers) return [];
    
    const assignedUserIds = shopUsers.map(shopUser => shopUser.userId);
    return allUsers.filter(user => !assignedUserIds.includes(user.id));
  };
  
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
              {getAvailableUsers().map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.firstName} {user.lastName})
                </option>
              ))}
            </select>
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
            className="btn btn-primary" 
            disabled={loading || !selectedUser}
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
      
      {/* Current shop users */}
      <div className="bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Current Shop Users</h2>
        
        {shopUsers.length === 0 ? (
          <p className="text-gray-500">No users assigned to this shop yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shopUsers.map((shopUser) => (
                  <tr key={shopUser.userId}>
                    <td>{shopUser.user.username}</td>
                    <td>{shopUser.user.firstName} {shopUser.user.lastName}</td>
                    <td>{shopUser.user.email}</td>
                    <td>{shopUser.role}</td>
                    <td>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() => handleRemoveUser(shopUser.userId)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 