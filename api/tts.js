export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { text = '', lang = 'en-GB' } = req.query;
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }

  try {
    const clean = String(text).replace(/[\n\r]+/g, ' ').trim();
    // Google TTS accepts up to 200 chars per call
    const chunk = clean.length > 200 ? clean.substring(0, 197) + '...' : clean;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`TTS upstream error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.send(buffer);
  } catch (err) {
    console.error('Vercel TTS error:', err);
    return res.status(500).json({ error: 'TTS generation failed' });
  }
}
