import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import prisma from './prisma';

// JWT secret should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-never-use-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Cookie configuration from environment variables
// Update to be more explicit about production vs development
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false');
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(user) {
  // Don't include sensitive information like password in the token
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export function setAuthCookie(res, token) {
  // Enhanced cookie setup with better logging
  console.log(`[setAuthCookie] Environment: ${process.env.NODE_ENV}`);
  console.log(`[setAuthCookie] Setting auth cookie with secure=${COOKIE_SECURE}, sameSite=${COOKIE_SAMESITE}`);
  
  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
  
  console.log(`[setAuthCookie] Cookie options:`, cookieOptions);
  
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth', token, cookieOptions)
  );
}

export function removeAuthCookie(res) {
  // Use the original NODE_ENV dependent variables
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth', '', {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      maxAge: -1,
      path: '/',
    })
  );
}

// Simple function for middleware to check token presence
export function getTokenFromRequestCookie(req) {
  console.log('[getTokenFromRequestCookie] Checking for auth cookie...');
  try {
    const token = req.cookies?.get('auth')?.value;
    console.log('[getTokenFromRequestCookie] Token found:', token ? '<present>' : '<missing>');
    return token || null;
  } catch (error) {
    console.error('[getTokenFromRequestCookie] Error reading cookie:', error);
    return null;
  }
}

// Function for API routes to use for FULL verification
export async function verifyRequestAndGetUser(req) {
  console.log('[verifyRequestAndGetUser] Verifying request...');
  try {
    // Enhanced cookie reading with better logging
    console.log('[verifyRequestAndGetUser] Request cookies:', req.cookies ? Object.keys(req.cookies) : 'none');
    console.log('[verifyRequestAndGetUser] Cookie headers:', req.headers?.cookie);
    
    // Read cookie directly from the API route's req.cookies object
    const token = req.cookies?.auth; 
    console.log('[verifyRequestAndGetUser] Auth token from req.cookies:', token ? '<present>' : '<missing>');

    if (!token) {
      // Try to parse cookies from headers as fallback
      if (req.headers?.cookie) {
        const cookies = cookie.parse(req.headers.cookie);
        const headerToken = cookies.auth;
        console.log('[verifyRequestAndGetUser] Auth token from headers:', headerToken ? '<present>' : '<missing>');
        
        if (headerToken) {
          // Verify this token from headers
          const decoded = verifyToken(headerToken);
          if (decoded) {
            console.log('[verifyRequestAndGetUser] Token from headers is valid');
            
            // Continue with user lookup using this token
            const user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: {
                id: true, username: true, email: true, firstName: true,
                lastName: true, role: true, status: true,
              },
            });
            
            if (user && user.status === 'ACTIVE') {
              console.log('[verifyRequestAndGetUser] User from header token validated successfully:', { id: user.id });
              return user;
            }
          }
        }
      }
      
      console.log('[verifyRequestAndGetUser] No valid token found, returning null.');
      return null;
    }

    // Perform full verification (runs in Node.js runtime for API routes)
    const decoded = verifyToken(token);
    console.log('[verifyRequestAndGetUser] Token decoded result:', decoded ? { id: decoded.id, role: decoded.role } : null);

    if (!decoded) {
      console.log('[verifyRequestAndGetUser] Token invalid or expired, returning null.');
      return null;
    }

    console.log(`[verifyRequestAndGetUser] Looking up user with ID: ${decoded.id}`);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, username: true, email: true, firstName: true,
        lastName: true, role: true, status: true,
      },
    });
    console.log('[verifyRequestAndGetUser] Prisma user lookup result:', user ? { id: user.id, status: user.status } : null);

    if (!user || user.status !== 'ACTIVE') {
      console.log('[verifyRequestAndGetUser] User not found or not active, returning null.');
      return null;
    }

    console.log('[verifyRequestAndGetUser] User validated successfully:', { id: user.id });
    return user;
  } catch (error) {
    // Log specific errors if needed
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
         console.error('[verifyRequestAndGetUser] Token verification failed:', error.message);
    } else {
         console.error('[verifyRequestAndGetUser] Error during verification:', error);
    }
    return null;
  }
}

export async function createUserSession(userId, token, req) {
  try {
    return await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    });
  } catch (error) {
    console.error('Error creating user session:', error);
    return null;
  }
}

export async function checkPermission(userId, resource, action) {
  try {
    const permission = await prisma.permission.findUnique({
      where: {
        userId_resource_action: {
          userId,
          resource,
          action,
        },
      },
    });

    return !!permission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(userId, action, details = {}, req) {
  try {
    const ipAddress = req?.headers['x-real-ip'] || req?.socket?.remoteAddress || null;
    const userAgent = req?.headers['user-agent'] || null;
    
    try {
      await prisma.userActivity.create({
        data: {
          userId,
          action,
          resource: 'USER',
          details: typeof details === 'string' ? details : JSON.stringify(details),
          ipAddress,
          userAgent
        }
      });
    } catch (schemaError) {
      // Fallback for missing resource field
      if (schemaError.message && (schemaError.message.includes('resource') || schemaError.message.includes('missing'))) {
        console.warn('UserActivity schema missing resource field, using fallback');
        try {
          // Try with empty resource field
          await prisma.userActivity.create({
            data: {
              userId,
              action,
              details: typeof details === 'string' ? details : JSON.stringify(details),
              resource: ''  // Provide empty string for required field
            }
          });
        } catch (secondError) {
          console.warn('Auth fallback with resource failed, trying minimal:', secondError.message);
          try {
            // Final minimal attempt
            await prisma.userActivity.create({
              data: {
                userId,
                action,
                details: typeof details === 'string' ? details : JSON.stringify(details)
              }
            });
          } catch (finalError) {
            console.error('All auth UserActivity attempts failed:', finalError.message);
            // Don't throw, just log and continue
          }
        }
      } else {
        throw schemaError;
      }
    }
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Non-critical error, don't throw
  }
} 