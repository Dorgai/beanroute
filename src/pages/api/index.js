export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    message: 'User Management System API is running' 
  });
} 