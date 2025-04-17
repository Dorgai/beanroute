// Cookie configuration for authentication
export const cookieConfig = {
  // In development, use non-secure cookies
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};
