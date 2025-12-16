export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For now, just accept any registration
  return res.status(200).json({
    active: true,
    message: 'Subscription registered'
  });
}
