import { useState, useEffect } from 'react';

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.user) {
          setSession(data);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  return {
    session,
    loading,
    setSession
  };
} 