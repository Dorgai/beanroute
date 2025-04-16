import { useState, useEffect } from 'react';
import { verifyRequestAndGetUser } from './auth';

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        console.log('Fetching session data...');
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          console.error('Error response from session API:', response.status);
          setSession(null);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        // Debug logging
        console.log('Session API response:', data);
        console.log('Session API response (stringified):', JSON.stringify(data, null, 2));
        
        if (data && data.user) {
          console.log('Session data loaded successfully');
          console.log('User details:', {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            role: data.user.role
          });
          console.log('User role (raw):', data.user.role);
          console.log('User role (type):', typeof data.user.role);
          console.log('Role check - Admin:', data.user.role === 'ADMIN');
          console.log('Role check - Owner:', data.user.role === 'OWNER');
          console.log('Role check - Retailer:', data.user.role === 'RETAILER');
          console.log('Role check - Barista:', data.user.role === 'BARISTA');
          console.log('Role check - Roaster:', data.user.role === 'ROASTER');
          
          setSession(data);
        } else {
          console.log('No session data found or invalid session structure');
          console.log('Session object:', data);
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
    console.log('Getting server session...');
    const user = await verifyRequestAndGetUser(req);
    
    if (!user) {
      console.log('No user found in server session');
      return null;
    }
    
    console.log('Server session user:', {
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    return { user };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
} 