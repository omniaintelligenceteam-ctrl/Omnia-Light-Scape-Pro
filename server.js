import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// PUT YOUR GEMINI API KEY HERE:
const API_KEY = 'AIzaSyDqMYOdWHAH2shUysqNluJlOy6GNZjFteA';

const PORT = 3001;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Billing status (DEV mode: always active)
app.post('/api/billing/status', (req, res) => {
  res.json({
    active: true,
    status: 'DEV_BYPASS',
    planKey: 'dev',
    ym: new Date().toISOString().slice(0, 7),
    creditsTotal: 9999,
    creditsUsed: 0,
    creditsRemaining: 9999,
  });
});

// Billing register (stub)
app.post('/api/billing/register', (req, res) => {
  res.json({ ok: true });
});

// PayPal verify (stub)
app.post('/api/paypal/verify-subscription', (req, res) => {
  res.json({ active: true, status: 'ACTIVE' });
});

// Generate image
app.post('/api/generate', async (req, res) => {
  try {
    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(500).json({ error: 'API key not configured in server.js' });
    }

    const { payload } = req.body;
    const model = payload?.model || 'gemini-2.0-flash-exp-image-generation';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: payload?.contents,
          generationConfig: {
            responseModalities: ["image", "text"],
            ...(payload?.config || {}),
          },
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Generation failed' });
    }

    res.json(data);
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
