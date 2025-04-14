import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

export default function EditCoffeePage() {
  const router = useRouter();
  const { coffeeId } = router.query;
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    roaster: '',
    origin: '',
    process: '',
    notes: '',
    grade: 'SPECIALTY',
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Check if user has permission to edit coffee
  const canManageCoffee = user && ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);

  // Fetch coffee data
  useEffect(() => {
    if (!coffeeId) return;
    
    const fetchCoffee = async () => {
      try {
        const response = await fetch(`/api/coffee/${coffeeId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch coffee data');
        }
        
        const coffee = await response.json();
        
        // Map the coffee data to form fields
        setFormData({
          name: coffee.name || '',
          roaster: coffee.producer || '', // Map producer to roaster
          origin: coffee.country || '',   // Map country to origin
          process: coffee.process || '',
          notes: coffee.notes || '',
          grade: coffee.grade || 'SPECIALTY',
        });
      } catch (err) {
        console.error('Error fetching coffee:', err);
        setFetchError('Failed to load coffee data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoffee();
  }, [coffeeId]);

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
            <p className="text-red-600">You do not have permission to edit coffee entries.</p>
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
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/coffee/${coffeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update coffee');
      }

      // Redirect to coffee details page
      router.push(`/coffee/${coffeeId}`);
    } catch (err) {
      console.error('Error updating coffee:', err);
      setError(err.message || 'An error occurred while updating the coffee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">Loading coffee data...</div>
        </div>
      </Layout>
    );
  }

  if (fetchError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {fetchError}
          </div>
          <div className="mt-4">
            <Link href="/coffee" className="text-blue-600 hover:underline">
              Back to Coffee List
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Coffee</h1>
          <div className="space-x-2">
            <Link href={`/coffee/${coffeeId}`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">
              Cancel
            </Link>
          </div>
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

              {/* Empty space to balance grid */}
              <div></div>

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
                href={`/coffee/${coffeeId}`}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 