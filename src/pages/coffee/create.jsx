import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function CreateCoffeePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    roaster: '',
    origin: '',
    process: '',
    notes: '',
    grade: 'SPECIALTY',
    quantity: '0',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has permission to create coffee
  const canManageCoffee = user && ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);

  // Redirect if not authorized
  if (!canManageCoffee) {
    // Use useEffect in real component to avoid React hydration issues
    if (typeof window !== 'undefined') {
      router.push('/coffee');
    }
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-red-600">You do not have permission to create coffee entries.</p>
            <Link href="/coffee" className="text-blue-600 hover:underline mt-4 inline-block">
              Back to Coffee List
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coffee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create coffee');
      }

      const coffee = await response.json();
      router.push(`/coffee/${coffee.id}`);
    } catch (err) {
      console.error('Error creating coffee:', err);
      setError(err.message || 'An error occurred while creating the coffee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Add New Coffee</h1>
          <Link href="/coffee" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">
            Cancel
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coffee Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Coffee Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              {/* Coffee Grade */}
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="SPECIALTY">Specialty</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="RARITY">Rarity</option>
                </select>
              </div>

              {/* Roaster */}
              <div>
                <label htmlFor="roaster" className="block text-sm font-medium text-gray-700 mb-1">
                  Roaster/Producer
                </label>
                <input
                  type="text"
                  id="roaster"
                  name="roaster"
                  value={formData.roaster}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              {/* Origin */}
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  id="origin"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              {/* Process */}
              <div>
                <label htmlFor="process" className="block text-sm font-medium text-gray-700 mb-1">
                  Process
                </label>
                <input
                  type="text"
                  id="process"
                  name="process"
                  value={formData.process}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              {/* Initial Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Quantity (kg)
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              {/* Notes (Full width) */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Additional information about this coffee..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/coffee"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
              >
                {loading ? 'Creating...' : 'Create Coffee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 