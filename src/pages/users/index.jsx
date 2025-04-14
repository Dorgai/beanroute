import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({}); // For pagination info
  const { user: currentUser } = useAuth(); // Get the logged-in user

  // TODO: Add state for filters, sorting, search, page

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Add query parameters based on state (page, limit, search, etc.)
      const response = await fetch('/api/users', { credentials: 'same-origin' });

      if (!response.ok) {
        let errorMsg = 'Failed to fetch users';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        throw new Error(`${response.status}: ${errorMsg}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setMeta(data.meta || {});
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Could not load users.');
      setUsers([]); // Clear users on error
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler for updating user status
  const handleUpdateStatus = async (userId, newStatus) => {
    // Find the user in the current list to update UI optimistically
    const originalUsers = [...users];
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u));

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to update status';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        // Revert optimistic update on failure
        setUsers(originalUsers);
        setError(`Error: ${response.status} ${errorMsg}`); 
        // TODO: Display error more prominently (e.g., toast notification)
      }
      // Optionally re-fetch users after success if needed, or rely on optimistic update
      // fetchUsers(); 
    } catch (err) {
      console.error('Update status error:', err);
      setUsers(originalUsers); // Revert optimistic update
      setError(err.message || 'Could not update user status.');
    }
  };

  // Handler for deleting a user
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    // Optimistically remove user from list
    const originalUsers = [...users];
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    setError(''); // Clear previous errors

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to delete user';
        try {
          // If API returns JSON error on failure (e.g., 404, 403)
          const errorData = await response.json(); 
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {}
        // Revert optimistic update
        setUsers(originalUsers);
        setError(`Error: ${response.status} ${errorMsg}`);
        // TODO: Display error more prominently
      }
      // On successful 204, no action needed, user already removed from state
      // Optionally show a success message
    } catch (err) {
      console.error('Delete user error:', err);
      setUsers(originalUsers); // Revert optimistic update
      setError(err.message || 'Could not delete user.');
    }
  };

  // Handler for resetting a user's password
  const handleResetPassword = async (userId, username) => {
    const newPassword = prompt(`Enter new temporary password for user "${username}" (min 8 chars):`);
    if (!newPassword) {
      return; // User cancelled prompt
    }
    if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    setError(''); // Clear previous errors
    // Consider adding a specific loading state for this action

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        credentials: 'same-origin',
      });

      const data = await response.json(); // Get response body for message

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }

      alert(data.message); // Show success message
      // No UI change needed in the list itself

    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Could not reset password.');
      // TODO: Display error more prominently
    }
  };

  return (
    <>
      <Head>
        <title>User Management</title>
      </Head>

      <div className="space-y-6">
        {/* Header + Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="text-2xl font-normal">Users</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage users in the system.
            </p>
          </div>
          <div>
            <Link
              href="/users/create"
              className="text-sm border border-gray-200 px-4 py-2 rounded hover:bg-gray-50"
            >
              Add User
            </Link>
          </div>
        </div>

        {/* Display error message */} 
        {error && (
            <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
              <p className="text-gray-900">{error}</p>
            </div>
        )}

        {/* User Table */}
        <div className="flow-root">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* TODO: Add sorting controls */}
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-normal text-gray-500">Username</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-normal text-gray-500">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-normal text-gray-500">Role</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-normal text-gray-500">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="whitespace-nowrap py-4 px-3 text-sm text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="whitespace-nowrap py-4 px-3 text-sm text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : (
                    !loading && !error && users.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{user.username}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.role}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs ${
                            user.status === 'ACTIVE' 
                              ? 'bg-gray-100' 
                              : user.status === 'INACTIVE' 
                                ? 'bg-gray-50' 
                                : user.status === 'LOCKED' 
                                  ? 'bg-gray-200' 
                                  : 'bg-gray-50'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-3">
                          {/* Edit Button - New addition */}
                          <Link 
                            href={`/users/${user.id}/edit`}
                            className="text-gray-600 hover:text-gray-900 text-xs"
                          >
                            Edit
                          </Link>
                          
                          {/* Activate/Deactivate Buttons */} 
                          {currentUser?.id !== user.id && (
                            user.status === 'ACTIVE' ? (
                              <button 
                                onClick={() => handleUpdateStatus(user.id, 'INACTIVE')}
                                className="text-gray-600 hover:text-gray-900 text-xs"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                                className="text-gray-600 hover:text-gray-900 text-xs"
                              >
                                Activate
                              </button>
                            )
                          )}
                          
                          {/* Reset Password Button */}
                          {currentUser?.id !== user.id && (
                            <button
                              onClick={() => handleResetPassword(user.id, user.username)}
                              className="text-gray-600 hover:text-gray-900 text-xs"
                            >
                              Reset Password
                            </button>
                          )}
                          
                          {/* Delete Button */}
                          {currentUser?.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="text-gray-600 hover:text-gray-900 text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 