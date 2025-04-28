import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

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
        const response = await fetch(`/api/users/${userId}`, {
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          } else {
            const errorText = await response.text();
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(errorData.message || errorData.error || 'Failed to fetch user data');
            } catch (jsonError) {
              throw new Error('Failed to fetch user data: Server returned an invalid response');
            }
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
      // or if it's their own profile and they're an admin
      if ((currentUser?.id === userId && currentUser?.role !== 'ADMIN') || 
          !['ADMIN', 'OWNER'].includes(currentUser?.role)) {
        delete updateData.role;
        delete updateData.status;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateData),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || errorData.error || 'Failed to update user');
        } catch (jsonError) {
          throw new Error('Failed to update user: Server returned an invalid response');
        }
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
      <div className="max-w-3xl mx-auto py-4">
        <div className="flex justify-center items-center h-40">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
          <p className="ml-2 text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  const isOwnProfile = currentUser?.id === userId;
  const canChangeRoleStatus = ['ADMIN', 'OWNER'].includes(currentUser?.role) || 
                            (isOwnProfile && currentUser?.role === 'ADMIN');
  
  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-medium text-gray-800">{isOwnProfile ? 'Edit Your Profile' : 'Edit User'}</h1>
        <Link href="/users" className="inline-flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md">
          <FiArrowLeft className="mr-1" /> Back to Users
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 p-3 border border-red-100 bg-red-50 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 border border-green-100 bg-green-50 rounded-md text-green-700 text-sm">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {canChangeRoleStatus && (
            <>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
        
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <FiSave className="mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 