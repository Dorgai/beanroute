import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Create the authentication context
const AuthContext = createContext();

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/health', '/orders'];

// API routes are handled separately
const apiRoutes = ['/api', '/_next'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from server session on mount
  useEffect(() => {
    console.log('[AuthContext] Starting session fetch...');
    
    const fetchSessionData = async () => {
      try {
        console.log('[AuthContext] Fetching session from /api/auth/session...');
        // Try to get the session from the server
        const response = await fetch('/api/auth/session');
        console.log('[AuthContext] Session API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AuthContext] Session API response data:', data);
          
          if (data && data.user) {
            console.log('[AuthContext] Session loaded from server:', data.user.role);
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            console.log('[AuthContext] No user in server session, falling back to localStorage');
            // Fallback to localStorage if server session not available
            const userData = localStorage.getItem('user');
            if (userData) {
              try {
                const parsedUser = JSON.parse(userData);
                console.log('[AuthContext] Session loaded from localStorage');
                setUser(parsedUser);
              } catch (parseError) {
                console.error('[AuthContext] Error parsing user data from localStorage:', parseError);
                localStorage.removeItem('user'); // Clear invalid data
              }
            } else {
              console.log('[AuthContext] No user data in localStorage either');
            }
          }
        } else {
          console.warn('[AuthContext] Session API returned error:', response.status);
          // Fallback to localStorage if API fails
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              console.log('[AuthContext] Session loaded from localStorage (API error)');
              setUser(parsedUser);
            } catch (parseError) {
              console.error('[AuthContext] Error parsing user data from localStorage:', parseError);
              localStorage.removeItem('user'); // Clear invalid data
            }
          } else {
            console.log('[AuthContext] No user data in localStorage (API error)');
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error fetching session:', error);
        // Fallback to localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            console.log('[AuthContext] Session loaded from localStorage (error fallback)');
            setUser(parsedUser);
          } catch (parseError) {
            console.error('[AuthContext] Error parsing user data from localStorage:', parseError);
            localStorage.removeItem('user'); // Clear invalid data
          }
        } else {
          console.log('[AuthContext] No user data in localStorage (error fallback)');
        }
      } finally {
        console.log('[AuthContext] Setting loading to false, user state:', user ? 'present' : 'null');
        setLoading(false);
      }
    };

    fetchSessionData();
  }, []);

  // Handle route changes
  useEffect(() => {
    console.log('[AuthContext] Route change effect triggered:', {
      loading,
      user: user ? 'present' : 'null',
      path: router.pathname,
      isReady: router.isReady
    });

    // Skip if still loading
    if (loading) {
      console.log('[AuthContext] Still loading, skipping redirect logic');
      return;
    }

    const path = router.pathname;
    
    // Skip redirection for API routes and Next.js internal routes
    if (apiRoutes.some(prefix => path.startsWith(prefix))) {
      console.log('[AuthContext] API route, skipping redirect');
      return;
    }
    
    // Determine if this is a protected route
    const isPublicRoute = publicRoutes.includes(path);
    console.log('[AuthContext] Route analysis:', {
      path,
      isPublicRoute,
      publicRoutes
    });
    
    // If user is not authenticated and route is not public, redirect to login
    if (!user && !isPublicRoute) {
      console.log(`[AuthContext] Unauthenticated access to protected route: ${path}. Redirecting to login...`);
      // Use replace instead of push to avoid back button issues
      router.replace('/login');
      return; // Exit early to prevent further processing
    }
    
    // If user is authenticated and trying to access login page, redirect to orders
    if (user && path === '/login') {
      console.log('[AuthContext] Authenticated user accessing login page. Redirecting to orders...');
      router.replace('/orders');
      return; // Exit early to prevent further processing
    }

    console.log('[AuthContext] No redirect needed for this route');
  }, [user, router.pathname, loading, router]);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include' // Important for cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save user to state and localStorage
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Always redirect to orders page
      const redirectPath = '/orders';
      
      console.log('Login successful, redirecting to orders...');
      router.push(redirectPath);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Important for cookies
      });
      
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem('user');
      
      // Redirect to login page
      console.log('Logout successful, redirecting to login...');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user has permission based on role
  const hasPermission = (requiredRoles) => {
    if (!user) return false;
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    
    return user.role === requiredRoles;
  };

  // Create value object for context
  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component to protect routes
export function withAuth(Component) {
  const AuthenticatedComponent = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        console.log('withAuth: No user found, redirecting to login');
        router.push('/login');
      }
    }, [user, loading]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // If user is authenticated, render the component
    return user ? <Component {...props} /> : null;
  };

  return AuthenticatedComponent;
} 