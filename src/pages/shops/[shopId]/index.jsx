import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ShopDetails() {
  const router = useRouter();
  const { shopId } = router.query;
  const { user } = useAuth();
  
  const [shop, setShop] = useState(null);
  const [shopUsers, setShopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch shop details and current shop users
  useEffect(() => {
    if (!shopId) return;
    
    const fetchShopData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch shop details
        const shopResponse = await fetch(`/api/shops/${shopId}`);
        if (!shopResponse.ok) {
          throw new Error(`Failed to fetch shop: ${shopResponse.statusText}`);
        }
        const shopData = await shopResponse.json();
        setShop(shopData);
        
        // Fetch shop users
        const usersResponse = await fetch(`/api/shops/${shopId}/users`);
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch shop users: ${usersResponse.statusText}`);
        }
        const shopUsersData = await usersResponse.json();
        setShopUsers(shopUsersData);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError(err.message || 'Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [shopId]);
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Loading shop details...</h1>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error mb-4">
            <p>{error}</p>
          </div>
          <Link href="/shops" className="btn btn-secondary">
            Back to Shops
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {shop ? shop.name : 'Shop Details'}
          </h1>
          <div className="flex space-x-2">
            <Link href={`/shops/${shopId}/users`} className="btn btn-primary">
              Manage Users
            </Link>
            <Link href={`/shops/edit/${shopId}`} className="btn btn-secondary">
              Edit Shop
            </Link>
            <Link href="/shops" className="btn btn-outline">
              Back to Shops
            </Link>
          </div>
        </div>
        
        {shop && (
          <div className="bg-white shadow-md rounded p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Shop Details</h2>
                <p><span className="font-medium">Name:</span> {shop.name}</p>
                <p><span className="font-medium">Address:</span> {shop.address || 'No address specified'}</p>
                <p><span className="font-medium">Min Coffee (Small Bags):</span> {shop.minCoffeeQuantitySmall}</p>
                <p><span className="font-medium">Min Coffee (Large Bags):</span> {shop.minCoffeeQuantityLarge}</p>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Users Summary</h2>
                <p><span className="font-medium">Total Users:</span> {shopUsers.length}</p>
                <p><span className="font-medium">Owners:</span> {shopUsers.filter(u => u.role === 'OWNER').length}</p>
                <p><span className="font-medium">Baristas:</span> {shopUsers.filter(u => u.role === 'BARISTA').length}</p>
                <p><span className="font-medium">Roasters:</span> {shopUsers.filter(u => u.role === 'ROASTER').length}</p>
                <p><span className="font-medium">Retailers:</span> {shopUsers.filter(u => u.role === 'RETAILER').length}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Shop Users Section */}
        <div className="bg-white shadow-md rounded p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Shop Users ({shopUsers.length})</h2>
            <Link href={`/shops/${shopId}/users`} className="btn btn-sm btn-primary">
              Manage Users
            </Link>
          </div>
          
          {shopUsers.length === 0 ? (
            <p className="text-gray-500">No users assigned to this shop yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {shopUsers.slice(0, 5).map((shopUser) => (
                    <tr key={shopUser.userId}>
                      <td>{shopUser.user.username}</td>
                      <td>{shopUser.user.firstName} {shopUser.user.lastName}</td>
                      <td>{shopUser.user.email}</td>
                      <td>{shopUser.role}</td>
                    </tr>
                  ))}
                  {shopUsers.length > 5 && (
                    <tr>
                      <td colSpan="4" className="text-center">
                        <Link href={`/shops/${shopId}/users`} className="text-blue-600 hover:underline">
                          View all {shopUsers.length} users...
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 