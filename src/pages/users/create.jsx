import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function CreateUser() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'BARISTA',
    status: 'ACTIVE'
  });
  
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
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      // Redirect to users list after successful creation
      router.push('/users');
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
      setLoading(false);
    }
  };
  
  // Only users with ADMIN or OWNER role can create new users
  if (!currentUser || !['ADMIN', 'OWNER'].includes(currentUser.role)) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="p-4 border border-gray-300 bg-gray-50">
            <p className="text-gray-900">You don't have permission to create new users.</p>
          </div>
          <div className="mt-4">
            <Link href="/users" className="text-sm border border-gray-200 px-4 py-2 rounded hover:bg-gray-50">
              Back to Users
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-normal">Create New User</h1>
          <Link href="/users" className="text-sm border border-gray-200 px-4 py-2 rounded hover:bg-gray-50">
            Back to Users
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
            <p className="text-gray-900">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-normal text-gray-500 mb-1">
                Username <span className="text-gray-400">(required)</span>
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
                Email <span className="text-gray-400">(required)</span>
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
              <label htmlFor="password" className="block text-sm font-normal text-gray-500 mb-1">
                Password <span className="text-gray-400">(required, min 8 chars)</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                required
              />
            </div>
            
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
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
                <option value="RETAILER">Retailer</option>
                <option value="ROASTER">Roaster</option>
                <option value="BARISTA">Barista</option>
              </select>
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
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
              disabled={loading}
              className="px-5 py-2 text-sm text-white bg-gray-900 border border-gray-900 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 