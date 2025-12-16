export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For now, return "active" so the app works
  // Later you can add real subscription checking
  const devBypass = true;

  return res.status(200).json({
    active: devBypass,
    status: 'ACTIVE',
    planKey: 'dev_unlimited',
    creditsTotal: 999,
    creditsUsed: 0,
    creditsRemaining: 999,
  });
}
