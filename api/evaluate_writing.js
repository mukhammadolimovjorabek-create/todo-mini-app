// Official AI Examiner for IELTS Writing (Band 0-9.0) & UzBMB Multilevel Writing (75-Point Scale)
// Evaluates candidate essays/letters strictly across the 4 official criteria, extracts sentence-level fixes,
// and generates a Band 8.0+ / C1 upgraded rewrite. Uses Gemini 2.5/2.0 Flash first with Groq fallback.

import crypto from 'node:crypto';

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

const checkRateLimit = (key, limit = 15, windowMs = 60_000) => {
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
  try {
    const u = new URL(origin);
    if (host && u.host === host) return true;
    if (u.hostname.endsWith('.vercel.app') || u.hostname.endsWith('.telegram.org')) return true;
  } catch {
    return false;
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

const buildWritingPrompt = (examType, taskType) => {
  if (examType === 'multilevel') {
    return `You are a strict, certified UzBMB (Bilim va malakalarni baholash agentligi) CEFR Multilevel Writing Examiner.
Evaluate the candidate's response for Multilevel Writing (${taskType}) using the official 75-point rubric.

STRICT RULES:
1. Never give inflated scores! Check actual grammar accuracy, task fulfillment, register (informal letter for Task 1.1, formal letter/complaint/application for Task 1.2, academic essay for Task 2), coherence, and vocabulary.
2. Underlength penalty: Task 1.1 requires ~50+ words, Task 1.2 requires ~120+ words, Task 2 requires ~180+ words. If way below target, penalize Task Fulfillment.
3. Off-topic check: If the candidate wrote about an unrelated topic or memorized template unrelated to the prompt, set isOffTopic=true and cap totalScore <= 28.
4. All feedback ('strengths', 'improvements', 'sentenceCorrections[].reasonUz') MUST be written in natural Uzbek and quote exact phrases from the candidate's essay.
5. Also rewrite the candidate's essay/letter preserving their main ideas at a polished **CEFR C1 (68-75 ball)** level inside 'rewrittenSample'.

RUBRIC (Total 0-75):
- taskResponse: 0 to 20
- coherenceCohesion: 0 to 20
- lexicalResource: 0 to 20
- grammaticalRange: 0 to 15
- totalScore: exact sum of the 4 criteria (0 to 75)
- cefrLevel: "C1" (65-75) | "B2" (50-64) | "B1" (30-49) | "A2" (0-29)

Return ONLY valid JSON:
{
  "taskResponse": number,
  "coherenceCohesion": number,
  "lexicalResource": number,
  "grammaticalRange": number,
  "totalScore": number,
  "cefrLevel": "C1" | "B2" | "B1" | "A2",
  "isOffTopic": boolean,
  "weakSkillTag": "task" | "coherence" | "lexical" | "grammar",
  "strengths": ["2-3 specific strengths in Uzbek quoting candidate text"],
  "improvements": ["3 specific corrections/advice in Uzbek"],
  "sentenceCorrections": [
    { "original": "exact weak/incorrect sentence from student", "corrected": "improved natural C1 sentence", "reasonUz": "why & grammar rule in Uzbek" }
  ],
  "rewrittenSample": "Complete upgraded CEFR C1 version preserving candidate's ideas",
  "detectedAcademicWords": ["advanced words used by candidate"],
  "recommendedVocabulary": [
    { "word": "word/collocation", "meaning": "Uzbek meaning", "example": "Natural example sentence" }
  ]
}`;
  }

  return `You are a strict, certified Cambridge / IDP / British Council IELTS Writing Examiner.
Evaluate the candidate's IELTS Writing (${taskType}) using Official Public IELTS Band Descriptors (0.0 to 9.0 in 0.5 steps).

STRICT RULES:
1. NEVER default to Band 6.5/7.0. Penalize real grammar mistakes (articles, tense, S-V agreement, run-on sentences), weak coherence, informal tone in Academic essays, and off-topic arguments.
2. Underlength penalty: Task 1 requires min 150 words; Task 2 requires min 250 words. Significantly short essays cannot exceed Task score 5.0.
3. Off-topic check: If unrelated to the prompt, set isOffTopic=true and cap Task score at 4.0.
4. All feedback ('strengths', 'improvements', 'sentenceCorrections[].reasonUz') MUST be written in clear Uzbek quoting the student's actual sentences/mistakes.
5. Provide a full **Band 8.0+ Upgraded Version** of the student's response in 'rewrittenSample' keeping their core arguments.

Return ONLY valid JSON:
{
  "taskResponse": number (0.0 to 9.0, 0.5 steps),
  "coherenceCohesion": number (0.0 to 9.0, 0.5 steps),
  "lexicalResource": number (0.0 to 9.0, 0.5 steps),
  "grammaticalRange": number (0.0 to 9.0, 0.5 steps),
  "overallBand": number (0.0 to 9.0, rounded to nearest 0.5),
  "isOffTopic": boolean,
  "weakSkillTag": "task" | "coherence" | "lexical" | "grammar",
  "strengths": ["2-3 specific strengths in Uzbek"],
  "improvements": ["3 specific actionable corrections in Uzbek"],
  "sentenceCorrections": [
    { "original": "exact student sentence", "corrected": "Band 8.0 corrected sentence", "reasonUz": "Uzbek explanation" }
  ],
  "rewrittenSample": "Full Band 8.0+ rewrite of the student's essay/report",
  "detectedAcademicWords": ["academic words actually used"],
  "recommendedVocabulary": [
    { "word": "Band 8 collocation", "meaning": "Uzbek translation", "example": "Academic example" }
  ]
}`;
};

const extractJsonObject = (rawText) => {
  const cleaned = String(rawText || '').trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : cleaned;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  }
  return JSON.parse(candidate);
};

const evaluateWithGemini = async (systemPrompt, userPayload, apiKey) => {
  const models = [
    process.env.GEMINI_MODEL,
    process.env.ENGLISH_GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter(Boolean);

  let lastErr = null;
  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey.trim(),
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPayload }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      if (!r.ok) {
        lastErr = new Error(`Gemini ${model} ${r.status}`);
        continue;
      }
      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (text) return extractJsonObject(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Gemini writing evaluation failed');
};

const evaluateWithGroq = async (systemPrompt, userPayload, apiKey) => {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPayload },
      ],
      temperature: 0.25,
      response_format: { type: 'json_object' },
    }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return extractJsonObject(content);
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

  const fromTrustedApp = isAllowedOrigin(origin, host) || isAllowedOrigin(refererOrigin, host) || Boolean(host);
  if (!tgUser && !fromTrustedApp) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rateKey = tgUser ? `u:${tgUser.id}` : `ip:${getClientIp(req)}`;
  if (!checkRateLimit(rateKey, 15, 60_000)) {
    return res.status(429).json({ error: 'Too many requests, please wait a minute' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const examType = body.examType === 'multilevel' ? 'multilevel' : 'ielts';
    const taskType = String(body.taskType || 'task2').slice(0, 30);
    const prompt = String(body.prompt || '').slice(0, 1500);
    const essayText = String(body.essayText || '').trim().slice(0, 8000);

    if (!essayText) {
      return res.status(400).json({ error: 'Essay text required' });
    }

    const wordCount = essayText.split(/\s+/).filter(Boolean).length;
    const systemPrompt = buildWritingPrompt(examType, taskType);
    const userPayload = `EXAM: ${examType.toUpperCase()} (${taskType})\nWORD COUNT: ${wordCount}\nTASK PROMPT:\n${prompt}\n\nCANDIDATE WRITING:\n${essayText}`;

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.ENGLISH_GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.ENGLISH_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return res.status(503).json({ error: 'AI writing service not configured' });
    }

    let evaluation = null;
    let lastErr = null;

    if (geminiKey) {
      try {
        evaluation = await evaluateWithGemini(systemPrompt, userPayload, geminiKey);
      } catch (e) {
        lastErr = e;
        console.error('Gemini writing eval error:', e?.message || e);
      }
    }

    if (!evaluation && groqKey) {
      try {
        evaluation = await evaluateWithGroq(systemPrompt, userPayload, groqKey);
      } catch (e) {
        lastErr = e;
        console.error('Groq writing eval error:', e?.message || e);
      }
    }

    if (!evaluation) {
      return res.status(502).json({ error: lastErr?.message || 'AI evaluation failed' });
    }

    return res.status(200).json({ evaluation });
  } catch (err) {
    console.error('evaluate_writing error:', err?.message || err);
    return res.status(500).json({ error: 'Evaluation failed' });
  }
}
