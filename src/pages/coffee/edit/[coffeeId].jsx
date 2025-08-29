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
    process: '',
    notes: '',
    price: '',
    labelQuantity: 0,
    isEspresso: false,
    isFilter: false,
    isSignature: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [success, setSuccess] = useState('');

  // Check if user has permission to edit coffee
  const canManageCoffee = user && ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);
  // Only allow admin and owner to see price
  const canSeePrice = user && ['ADMIN', 'OWNER'].includes(user.role);

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
          process: data.process || '',
          notes: data.notes || '',
          price: data.price || '',
          labelQuantity: data.labelQuantity || 0,
          isEspresso: data.isEspresso || false,
          isFilter: data.isFilter || false,
          isSignature: data.isSignature || false,
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      
      const requestBody = {
        name: formData.name,
        grade: formData.grade,
        country: formData.country,
        producer: formData.producer,
        process: formData.process,
        notes: formData.notes,
        labelQuantity: parseInt(formData.labelQuantity) || 0,
        isEspresso: formData.isEspresso,
        isFilter: formData.isFilter,
        isSignature: formData.isSignature
      };
      
      // Only include price if user has permission to edit it
      if (canSeePrice) {
        requestBody.price = formData.price ? parseFloat(formData.price) : null;
      }
      
      const response = await fetch(`/api/coffee/${coffeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
                placeholder="e.g., Washed, Natural, Honey"
              />
            </div>

            {/* Label Quantity */}
            <div>
              <label htmlFor="labelQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                Label Quantity
              </label>
              <input
                type="number"
                id="labelQuantity"
                name="labelQuantity"
                value={formData.labelQuantity}
                onChange={handleChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Number of labels for this coffee"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 label is needed per bag (regardless of bag size or type)
              </p>
            </div>
            
            {/* Price - Only visible to admin and owner */}
            {canSeePrice && (
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($/kg)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          {/* Brewing Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brewing Methods *
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isEspresso"
                  checked={formData.isEspresso}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Espresso (E)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isFilter"
                  checked={formData.isFilter}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Filter (F)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isSignature"
                  checked={formData.isSignature}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm">Signature (S)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              At least one brewing method (Espresso or Filter) is required. Signature is optional.
            </p>
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