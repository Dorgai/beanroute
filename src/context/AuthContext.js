import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Create the authentication context
const AuthContext = createContext();

// Public routes that don't require authentication
const publicRoutes = ['/login', '/dashboard', '/api/health'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Handle route changes
  useEffect(() => {
    // Skip if still loading
    if (loading) return;

    const path = router.pathname;
    
    // If user is not authenticated and route is not public, redirect to login
    if (!user && !publicRoutes.includes(path) && !path.includes('/_next/')) {
      console.log('Unauthenticated access to protected route. Redirecting to login...');
      router.push('/login');
    }
    
    // If user is authenticated and trying to access login page, redirect to dashboard
    if (user && path === '/login') {
      console.log('Authenticated user accessing login page. Redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [user, router.pathname, loading, router]);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save user to state and localStorage
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Use direct window location for more reliable redirection
      console.log('Login successful, redirecting to dashboard...');
      window.location.href = '/dashboard';
      
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
      });
      
      // Clear user from state and localStorage
      setUser(null);
      localStorage.removeItem('user');
      
      // Use direct window location for more reliable redirection
      console.log('Logout successful, redirecting to login...');
      window.location.href = '/login';
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
        // Use direct window location for more reliable redirection
        window.location.href = '/login';
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