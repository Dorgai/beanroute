import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by looking for user data in localStorage
    const userData = localStorage.getItem('user');
    
    if (userData) {
      // If logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // If not logged in, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Return empty div while redirecting
  return <div></div>;
} 