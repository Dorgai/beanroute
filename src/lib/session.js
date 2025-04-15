import { useState, useEffect } from 'react';
import { verifyRequestAndGetUser } from './auth';

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

export async function getServerSession(req, res) {
  try {
    const user = await verifyRequestAndGetUser(req);
    if (!user) return null;
    return { user };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
} 