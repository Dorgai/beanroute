import { comparePasswords, generateToken, setAuthCookie, createUserSession, logUserActivity } from '../../../lib/auth';
import { getUserByUsername, updateLastLogin } from '../../../lib/user-service';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    console.log(`Login attempt for username: ${username}`);

    // Get user by username
    const user = await getUserByUsername(username);

    // Check if user exists
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`User found with role: ${user.role}, status: ${user.status}`);

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      console.log(`Account is inactive: ${username}`);
      return res.status(401).json({ message: 'Account is inactive. Please contact an administrator.' });
    }

    // Compare passwords
    const isValidPassword = await comparePasswords(password, user.password);

    if (!isValidPassword) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`Password validated for user: ${username}`);

    // Generate JWT token
    const token = generateToken(user);

    // Update last login time
    await updateLastLogin(user.id);

    // Create a session record
    await createUserSession(user.id, token, req);

    // Log user activity
    await logUserActivity(user.id, 'login', {}, req);

    // Set the auth cookie
    setAuthCookie(res, token);

    console.log(`Login successful for user: ${username}`);

    // Return user data (excluding sensitive fields)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 