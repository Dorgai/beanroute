import { NextResponse } from 'next/server';
import { getUserFromRequest, checkPermission } from './lib/auth';

export async function middleware(req) {
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api/auth/login', 
    '/api/auth/register',
    '/api/health', // Allow health check
    '/api/admin/seed-db' // Allow seeding
  ];
  
  const { pathname } = req.nextUrl;
  
  // Skip middleware for public paths
  if (publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }
  
  // Check for authentication
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      // Redirect to login for page requests
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      // Return 401 for API requests
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // For admin pages/routes, check if user is an admin
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (user.role !== 'ADMIN') {
        // Redirect to dashboard for page requests
        if (!pathname.startsWith('/api/')) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        // Return 403 for API requests
        return new NextResponse(
          JSON.stringify({ message: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // For API routes that start with /api/users or /api/teams, check appropriate permissions
    if (pathname.startsWith('/api/users')) {
      const action = getActionFromMethod(req.method);
      const hasPermission = await checkPermission(user.id, 'user', action);
      
      if (!hasPermission && user.role !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ message: 'Forbidden - Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (pathname.startsWith('/api/teams')) {
      const action = getActionFromMethod(req.method);
      const hasPermission = await checkPermission(user.id, 'team', action);
      
      if (!hasPermission && user.role !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ message: 'Forbidden - Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In case of error, continue to login for non-API routes
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // For API routes, return an error
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error in middleware' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Helper function to convert HTTP method to action
function getActionFromMethod(method) {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

// Configure the middleware to run for specific paths
export const config = {
  matcher: [
    // Match all routes except for static files
    '/((?!_next/static|favicon.ico|robots.txt).*)',
  ],
}; 