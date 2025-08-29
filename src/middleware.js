import { NextResponse } from 'next/server';
// Use the new simple token check function
import { getTokenFromRequestCookie } from './lib/auth';
// These permission checks will move to API routes
// import { canManageUsers, canManageShops } from './lib/user-service';

// Keep runtime commented out or remove, it wasn't working anyway
// export const runtime = 'nodejs';

// Define public paths that don't require authentication
export const publicPaths = [
  '/login',
  '/dashboard',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/admin/test-db', // Allow db testing
  '/api/health',
  '/api/health-basic',
  '/api/admin/create-admin',
  '/api/admin/fix-admin', // Add our fix-admin endpoint
  '/api/admin/temp-migration', // TEMPORARY: Allow one-time migration endpoint
  '/api/retail/check-inventory-alerts', // Allow inventory checks with API key
  '/api/public/coffee-inventory-total', // Public coffee inventory endpoint
  '/api/public/create-table', // TEMPORARY: Public migration endpoint
  '/api/debug/check-inventory-table', // TEMPORARY: Debug endpoint
];

// Check if a path is public
const isPublicPath = (path) => {
  return publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '?'));
};

// Check if a path is an API path
const isApiPath = (path) => {
  return path.startsWith('/api/');
};

// Check if the request has direct=true query parameter for specific APIs
const isDirectAccessAPI = (request) => {
  const { pathname, searchParams } = request.nextUrl;
  const isDirect = searchParams.get('direct') === 'true';
  
  // List of API paths that can be accessed directly with direct=true parameter
  const directAccessPaths = [
    '/api/coffee/inventory/total',
    '/api/dashboard/stats',
    '/api/retail/inventory',
    '/api/retail/shops',
    '/api/shops/shop-details'
    // Add other APIs that should support direct mode here
  ];
  
  return isDirect && directAccessPaths.some(path => pathname === path);
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Allow direct access to specific APIs when direct=true is present
  if (isDirectAccessAPI(request)) {
    console.log(`[middleware] Allowing direct access to ${pathname}`);
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