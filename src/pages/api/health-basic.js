// Extremely simple health check with no dependencies
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
} 