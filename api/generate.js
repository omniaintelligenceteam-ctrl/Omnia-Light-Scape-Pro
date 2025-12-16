export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Securely get the API Key
  const API_KEY = process.env.GOOGLE_AI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { payload } = req.body;

    console.log("Generating with Nano Banana Pro (Gemini 3 Pro Image)...");

    // 3. MODEL SWITCH: 'gemini-3-pro-image-preview'
    // This is the "Nano Banana Pro" model.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    // 4. Error Handling
    if (data.error) {
      console.error("Google API Error:", data.error);
      // If Nano Banana is busy/unavailable, fall back to 1.5 Pro
      if (data.error.code === 404 || data.error.message.includes("not found")) {
         return res.status(400).json({ error: "Nano Banana Pro model not enabled on your API key yet. Try Gemini 1.5 Pro." });
      }
      return res.status(400).json({ error: data.error.message || 'Error from AI Model' });
    }

    // 5. Success
    res.status(200).json(data);

  } catch (error) {
    console.error('Server connection error:', error);
    res.status(500).json({ error: error.message });
  }
}
