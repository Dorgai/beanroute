import { NextResponse } from 'next/server';
import { getUserFromRequest } from './lib/auth';
import { canManageUsers, canManageShops } from './lib/user-service';

// Define public paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/admin/test-db', // Allow db testing
];

// Check if a path is public
const isPublicPath = (path) => {
  return publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '?'));
};

// Check if a path is an API path
const isApiPath = (path) => {
  return path.startsWith('/api/');
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  try {
    // Get user from request (using cookies)
    const user = await getUserFromRequest(request);
    
    // If no user and this is not an API path, redirect to login
    if (!user && !isApiPath(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // If no user and this is an API path, return 401 Unauthorized
    if (!user && isApiPath(pathname)) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check permissions for admin routes
    if (pathname.startsWith('/api/admin/') && user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ message: 'Forbidden: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check permissions for user management routes
    if (pathname.startsWith('/api/users/') && !canManageUsers(user.role)) {
      return new NextResponse(
        JSON.stringify({ message: 'Forbidden: Insufficient permissions to manage users' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check permissions for shop management routes
    if (pathname.startsWith('/api/shops/') && !canManageShops(user.role)) {
      return new NextResponse(
        JSON.stringify({ message: 'Forbidden: Insufficient permissions to manage shops' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Pass user info in headers for API routes
    if (isApiPath(pathname)) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-role', user.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // For any other route, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return appropriate error based on path type
    if (isApiPath(pathname)) {
      return new NextResponse(
        JSON.stringify({ message: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
}

// Specify which paths this middleware should run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 