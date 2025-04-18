import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function EditCoffeePage() {
  const router = useRouter();
  const { coffeeId } = router.query;
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    grade: 'SPECIALTY',
    country: '',
    producer: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [success, setSuccess] = useState('');

  // Check if user has permission to edit coffee
  const canManageCoffee = user && ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);

  // Fetch coffee data
  useEffect(() => {
    const fetchCoffeeData = async () => {
      if (!coffeeId) return;
      
      setLoading(true);
      setFetchError(null);
      setError(null);
      
      try {
        console.log(`Fetching coffee data for ID: ${coffeeId}`);
        const response = await fetch(`/api/coffee/${coffeeId}`);
        
        if (!response.ok) {
          console.error(`Error response from coffee API: ${response.status}`);
          throw new Error(`Failed to fetch coffee data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Coffee data received:', data);
        
        setFormData({
          name: data.name || '',
          grade: data.grade || 'SPECIALTY',
          country: data.country || '',
          producer: data.producer || '',
          notes: data.notes || '',
        });
      } catch (error) {
        console.error('Error fetching coffee data:', error);
        setFetchError('Failed to load coffee data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (coffeeId) {
      fetchCoffeeData();
    }
  }, [coffeeId]);

  // Redirect if not authorized
  if (!canManageCoffee) {
    // Use useEffect in real component to avoid React hydration issues
    if (typeof window !== 'undefined') {
      router.push('/coffee');
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-red-600">You do not have permission to edit coffee entries.</p>
          <Link href="/coffee" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Coffee List
          </Link>
        </div>
      </div>
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
    setError('');
    setSuccess('');
    
    try {
      console.log(`Submitting update for coffee ID: ${coffeeId}`);
      console.log('Form data:', formData);
      
      const response = await fetch(`/api/coffee/${coffeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          grade: formData.grade,
          country: formData.country,
          producer: formData.producer,
          notes: formData.notes
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update coffee');
      }
      
      const updatedCoffee = await response.json();
      console.log('Update successful:', updatedCoffee);
      
      setSuccess('Coffee updated successfully!');
      // Redirect to coffee details page after 1 second
      setTimeout(() => {
        router.push(`/coffee/${coffeeId}`);
      }, 1000);
    } catch (error) {
      console.error('Error updating coffee:', error);
      setError(error.message || 'Failed to update coffee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">Loading coffee data...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
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
    );
  }

  return (
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

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
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

            {/* Producer */}
            <div>
              <label htmlFor="producer" className="block text-sm font-medium text-gray-700 mb-1">
                Roaster/Producer
              </label>
              <input
                type="text"
                id="producer"
                name="producer"
                value={formData.producer}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country of Origin
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 