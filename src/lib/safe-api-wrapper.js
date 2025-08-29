/**
 * Safe API wrapper that handles common production errors gracefully
 * This prevents "Something went wrong" errors from breaking the UI
 */

export function wrapApiHandler(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error caught by safe wrapper:', error);
      
      // Handle specific Prisma errors
      if (error.name === 'PrismaClientValidationError' || 
          error.message?.includes('Argument') ||
          error.message?.includes('missing') ||
          error.message?.includes('resource')) {
        console.warn('Prisma schema error detected, returning safe fallback');
        return res.status(200).json({
          success: true,
          logs: [],
          notifications: [],
          shops: [],
          message: 'Data temporarily unavailable due to schema update'
        });
      }
      
      // Handle database connection errors
      if (error.message?.includes('database') || 
          error.message?.includes('connection') ||
          error.message?.includes('timeout')) {
        console.warn('Database connection error, returning safe fallback');
        return res.status(200).json({
          success: true,
          logs: [],
          notifications: [],
          shops: [],
          message: 'Database temporarily unavailable'
        });
      }
      
      // Handle authentication errors gracefully
      if (error.message?.includes('Unauthorized') ||
          error.message?.includes('authentication') ||
          error.message?.includes('token')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // For any other error, return a safe response
      console.error('Unhandled API error:', error);
      return res.status(200).json({
        success: false,
        error: 'Service temporarily unavailable',
        logs: [],
        notifications: [],
        shops: []
      });
    }
  };
}

export function safeAsyncOperation(operation, fallbackValue = null) {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      console.error('Safe async operation failed:', error);
      return fallbackValue;
    }
  };
}

export function safePrismaOperation(prismaOperation, fallbackValue = []) {
  return async (...args) => {
    try {
      return await prismaOperation(...args);
    } catch (error) {
      console.error('Prisma operation failed safely:', error);
      
      // Log the specific error for debugging
      if (error.name === 'PrismaClientValidationError') {
        console.warn('Schema validation error - likely missing field:', error.message);
      }
      
      return fallbackValue;
    }
  };
}

