import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function TestTheme() {
  const { theme, isDark, toggleTheme, isLoading } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Theme Test Page</h1>
      
      <div className="mb-4">
        <p>Current theme: {theme}</p>
        <p>Is dark: {isDark ? 'Yes' : 'No'}</p>
        <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
      </div>

      <button 
        onClick={toggleTheme}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Toggle Theme
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Light/Dark Container</h2>
          <p className="text-gray-600 dark:text-gray-300">This should change color with theme</p>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Blue Container</h2>
          <p className="text-blue-600 dark:text-blue-300">This should also change with theme</p>
        </div>

        <div className="bg-red-100 dark:bg-red-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Red Container</h2>
          <p className="text-red-600 dark:text-red-300">Red theme test</p>
        </div>

        <div className="bg-green-100 dark:bg-green-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Green Container</h2>
          <p className="text-green-600 dark:text-green-300">Green theme test</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Table Test</h2>
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Name</th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Value</th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test Item 1</td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">100</td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                  Active
                </span>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-600">
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Test Item 2</td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">200</td>
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm">
                  Inactive
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
