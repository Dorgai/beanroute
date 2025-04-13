import { NextResponse } from 'next/server';
// Use the new simple token check function
import { getTokenFromRequestCookie } from './lib/auth';
// These permission checks will move to API routes
// import { canManageUsers, canManageShops } from './lib/user-service';

// Keep runtime commented out or remove, it wasn't working anyway
// export const runtime = 'nodejs';

// Define public paths that don't require authentication
const publicPaths = [
  '/login',
  '/dashboard',
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
    // Just check if the token cookie exists
    const tokenExists = !!getTokenFromRequestCookie(request);

    // If no token cookie and not an API path, redirect to login
    if (!tokenExists && !isApiPath(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If no token cookie and IS an API path, return 401
    // API routes will do full verification later
    if (!tokenExists && isApiPath(pathname)) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Missing token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If token exists, allow request to proceed.
    // We removed user role checks here - API routes will handle permissions.
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);
    // Simplified error handling
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error in middleware' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
    // Removed previous complex error handling
  }
}

// Specify which paths this middleware should run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 