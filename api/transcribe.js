// Speech-to-text for speaking exams (Vercel serverless function).
// Receives raw audio (webm/mp4/ogg) in the request body and returns { text }.
// Uses Groq Whisper (free tier) first, then Gemini as a fallback.

import crypto from 'node:crypto';

export const config = {
  api: { bodyParser: false },
};

const ALLOWED_ORIGINS = new Set([
  'https://todo-mini-app-eight.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const INIT_DATA_MAX_AGE_SEC = 24 * 3600;
const rateLimitStore = new Map();

const getClientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const parts = xff.split(',');
    return parts[parts.length - 1].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

const checkRateLimit = (key, limit = 20, windowMs = 60_000) => {
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

const validateTelegramInitData = (initData, botToken) => {
  if (!initData || typeof initData !== 'string' || initData.length > 4096) return null;
  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash');
    const authDate = Number(params.get('auth_date') || '0');
    const userRaw = params.get('user');
    if (!receivedHash || !/^[0-9a-f]{64}$/i.test(receivedHash)) return null;
    if (!authDate || Math.floor(Date.now() / 1000) - authDate > INIT_DATA_MAX_AGE_SEC) return null;
    if (!userRaw) return null;

    const user = JSON.parse(userRaw);
    if (!user || typeof user.id !== 'number') return null;

    if (botToken) {
      const pairs = [];
      for (const [k, v] of params.entries()) {
        if (k !== 'hash') pairs.push([k, v]);
      }
      pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
      const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n');
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      const a = Buffer.from(calculatedHash, 'hex');
      const b = Buffer.from(receivedHash, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    }
    return user;
  } catch {
    return null;
  }
};

const readBody = async (req) => {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > 4 * 1024 * 1024 + 1024) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
};

const extFor = (mime) => {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
};

const sanitizeMime = (rawMime) => {
  const base = String(rawMime || 'audio/webm').split(';')[0].trim().toLowerCase();
  const allowed = new Set([
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/ogg',
    'audio/wav',
    'audio/mpeg',
  ]);
  return allowed.has(base) ? base : 'audio/webm';
};

const transcribeWithGroq = async (audio, mime, apiKey) => {
  const form = new FormData();
  form.append('file', new Blob([audio], { type: mime }), `answer.${extFor(mime)}`);
  form.append('model', process.env.GROQ_WHISPER_MODEL || process.env.ENGLISH_GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo');
  form.append('language', 'en');
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const data = await r.json();
  return String(data.text || '').trim();
};

const transcribeWithGemini = async (audio, mime, apiKey) => {
  const model = process.env.GEMINI_MODEL || process.env.ENGLISH_GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey.trim(),
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Transcribe this English speaking-exam answer verbatim. Output only the transcript text. If there is no speech, output nothing.' },
          { inline_data: { mime_type: mime, data: audio.toString('base64') } },
        ],
      }],
      generationConfig: { temperature: 0 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const data = await r.json();
  return String(data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '').trim();
};

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  if (isAllowedOrigin(origin, host)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const initData = req.headers['x-telegram-init-data'] || '';
  const botToken = process.env.BOT_TOKEN || '';
  const tgUser = validateTelegramInitData(initData, botToken);
  const referer = req.headers.referer || '';
  let refererOrigin = '';
  try {
    if (referer) refererOrigin = new URL(referer).origin;
  } catch {
    refererOrigin = '';
  }

  const fromTrustedApp = isAllowedOrigin(origin, host) || isAllowedOrigin(refererOrigin, host);
  // Require either verified Telegram initData or a same-origin browser request from our deployed app
  if (!tgUser && (!fromTrustedApp || botToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rateKey = tgUser ? `u:${tgUser.id}` : `ip:${getClientIp(req)}`;
  if (!checkRateLimit(rateKey, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many requests, please wait a minute' });
  }

  try {
    const audio = await readBody(req);
    if (!audio.length) return res.status(400).json({ error: 'Empty audio' });
    if (audio.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'Audio too large' });

    const mime = sanitizeMime(req.headers['content-type']);
    const groqKey = process.env.GROQ_API_KEY || process.env.ENGLISH_GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.ENGLISH_GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return res.status(503).json({ error: 'Transcription service unavailable' });
    }

    let text = '';
    let lastError = null;
    if (groqKey) {
      try {
        text = await transcribeWithGroq(audio, mime, groqKey);
      } catch (e) {
        lastError = e;
        console.error('Groq transcription error:', e?.message || e);
      }
    }
    if (!text && geminiKey && (lastError || !groqKey)) {
      text = await transcribeWithGemini(audio, mime, geminiKey);
    }

    return res.status(200).json({ text });
  } catch (err) {
    if (err?.message === 'PAYLOAD_TOO_LARGE') {
      return res.status(413).json({ error: 'Audio too large' });
    }
    console.error('Transcription error:', err?.message || err);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}
