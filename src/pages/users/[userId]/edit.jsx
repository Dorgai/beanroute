import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function EditUser() {
  const router = useRouter();
  const { userId } = router.query;
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    status: ''
  });
  
  // Fetch user data
  useEffect(() => {
    if (!userId) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user data');
          }
        }
        
        const userData = await response.json();
        setUser(userData);
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || '',
          status: userData.status || ''
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Determine which fields to update based on user permissions
      const updateData = { ...formData };
      
      // Only include role and status if the current user can manage users
      if (currentUser?.id === userId || 
          !['ADMIN', 'OWNER'].includes(currentUser?.role)) {
        delete updateData.role;
        delete updateData.status;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      setSuccessMessage('User updated successfully');
      
      // Optional: Redirect back to users list after successful update
      // setTimeout(() => router.push('/users'), 1500);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse">Loading user data...</div>
        </div>
      </Layout>
    );
  }
  
  const isOwnProfile = currentUser?.id === userId;
  const canChangeRoleStatus = ['ADMIN', 'OWNER'].includes(currentUser?.role);
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-normal">{isOwnProfile ? 'Edit Your Profile' : 'Edit User'}</h1>
          <Link href="/users" className="text-sm border border-gray-200 px-4 py-2 rounded hover:bg-gray-50">
            Back to Users
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
            <p className="text-gray-900">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
            <p className="text-gray-900">{successMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-normal text-gray-500 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-normal text-gray-500 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                required
              />
            </div>
            
            <div>
              <label htmlFor="firstName" className="block text-sm font-normal text-gray-500 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-normal text-gray-500 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            
            {canChangeRoleStatus && (
              <>
                <div>
                  <label htmlFor="role" className="block text-sm font-normal text-gray-500 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                    <option value="RETAILER">Retailer</option>
                    <option value="ROASTER">Roaster</option>
                    <option value="BARISTA">Barista</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-normal text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  >
                    <option value="">Select a status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="px-5 py-2 text-sm border border-gray-300 rounded mr-3 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm text-white bg-gray-900 border border-gray-900 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 