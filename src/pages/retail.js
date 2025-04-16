import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RetailRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/orders');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirecting to Retail Orders...</p>
    </div>
  );
} 