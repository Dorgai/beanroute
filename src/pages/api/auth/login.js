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

    // Get user by username
    const user = await getUserByUsername(username);

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Account is inactive. Please contact an administrator.' });
    }

    // Compare passwords
    const isValidPassword = await comparePasswords(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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
    return res.status(500).json({ message: 'Internal server error' });
  }
} 