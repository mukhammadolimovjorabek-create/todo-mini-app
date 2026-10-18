const ALLOWED_ORIGINS = new Set([
  'https://todo-mini-app-eight.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const LANG_RE = /^[a-z]{2,3}(-[A-Z]{2})?$/;
const rateLimitStore = new Map();

const getClientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const parts = xff.split(',');
    return parts[parts.length - 1].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

const checkRateLimit = (key, limit = 30, windowMs = 60_000) => {
  const now = Date.now();
  const history = (rateLimitStore.get(key) || []).filter((t) => now - t < windowMs);
  if (history.length >= limit) {
    rateLimitStore.set(key, history);
    return false;
  }
  history.push(now);
  rateLimitStore.set(key, history);
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (!v.length || now - v[v.length - 1] >= windowMs) rateLimitStore.delete(k);
    }
  }
  return true;
};

const isAllowedOrigin = (origin, host) => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (host) {
    try {
      const u = new URL(origin);
      if (u.host === host) return true;
    } catch {
      return false;
    }
  }
  return false;
};

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  if (isAllowedOrigin(origin, host)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp, 30, 60_000)) {
    return res.status(429).json({ error: 'Too many TTS requests, please wait a minute' });
  }

  const { text = '', lang = 'en-GB' } = req.query;
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }
  const safeLang = LANG_RE.test(String(lang)) ? String(lang) : 'en-GB';

  try {
    // Replace IELTS acronym with phonetic spelling so TTS pronounces it as a natural single word "Eye-elts" instead of letter by letter
    const clean = String(text)
      .replace(/\bIELTS\b/gi, 'Eye-elts')
      .replace(/[\n\r]+/g, ' ')
      .trim();
    // Google TTS accepts up to 200 chars per call
    const chunk = clean.length > 200 ? clean.substring(0, 197) + '...' : clean;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(safeLang)}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

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
    console.error('Vercel TTS error:', err?.message || err);
    return res.status(500).json({ error: 'TTS generation failed' });
  }
}
