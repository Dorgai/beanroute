import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
// We'll likely need useAuth later
// import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  // Placeholder content
  // TODO: Fetch and display users
  // TODO: Implement search, filter, pagination
  // TODO: Add create/edit/delete functionality

  return (
    <>
      <Head>
        <title>User Management</title>
      </Head>

      <div className="py-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Users</h1>
              <p className="mt-2 text-sm text-gray-700">
                A list of all the users in the system.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/users/create"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Add user
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  {/* Placeholder for the user table */}
                  <div className="min-w-full divide-y divide-gray-300">
                    <div className="bg-gray-50">
                      {/* Header Row Placeholder */}
                      <div className="flex px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <div className="w-1/4">Username</div>
                        <div className="w-1/4">Email</div>
                        <div className="w-1/4">Role</div>
                        <div className="w-1/4">Status</div>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-200 bg-white">
                      {/* Data Row Placeholder */}
                      <div className="flex px-3 py-4 text-sm text-gray-500">
                        <div className="w-1/4">Loading users...</div>
                        <div className="w-1/4">-</div>
                        <div className="w-1/4">-</div>
                        <div className="w-1/4">-</div>
                      </div>
                    </div>
                  </div>
                  <p className="p-4 text-center text-gray-500">
                    User list functionality will be implemented here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 