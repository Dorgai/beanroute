import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@/lib/session';

export default function RetailInventoryRedirect() {
  const router = useRouter();
  const { session, loading } = useSession();
  
  useEffect(() => {
    // Log the current user session and role for debugging
    if (!loading) {
      if (session) {
        console.log('RetailInventoryRedirect - User session found');
        console.log('User role:', session.user.role);
        console.log('Redirecting to Orders page');
      } else {
        console.log('RetailInventoryRedirect - No user session');
      }
    }
    
    // Redirect to orders page
    router.push('/orders');
  }, [router, session, loading]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirecting to Retail Orders...</p>
    </div>
  );
} 