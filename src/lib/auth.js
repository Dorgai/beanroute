import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import prisma from './prisma';

// JWT secret should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-never-use-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

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
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // Allow cross-site cookies in production
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  );
}

export function removeAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/',
    })
  );
}

export async function getUserFromRequest(req) {
  try {
    const token = req.cookies?.auth;
    
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting user from request:', error);
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

export async function logUserActivity(userId, action, details = {}, req = null) {
  try {
    return await prisma.userActivity.create({
      data: {
        userId,
        action,
        details,
        ipAddress: req?.headers['x-forwarded-for'] || req?.socket.remoteAddress,
        userAgent: req?.headers['user-agent'],
      },
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
    return null;
  }
} 