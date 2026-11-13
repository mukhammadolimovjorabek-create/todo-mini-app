// Official AI Examiner for IELTS Speaking (9.0 Band Scale) & UzBMB Multilevel Speaking (75-Point Scale)
// Evaluates candidate transcripts + acoustic metrics against official Band Descriptors.
// Uses Gemini 2.5 Flash / 2.0 Flash (structured JSON) first, with Groq Llama-3.3-70B fallback.

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

const buildSystemPrompt = (examType, testPart) => {
  if (examType === 'multilevel') {
    return `You are a strict, certified UzBMB (Bilim va malakalarni baholash agentligi) CEFR Multilevel Speaking Examiner.
Evaluate the candidate's ACTUAL spoken answers for Multilevel Speaking (${testPart}) strictly according to official CEFR / UzBMB 75-point Speaking Assessment Criteria.

CRITICAL ANTI-BIAS & HUMAN EXAMINER RULES:
1. NEVER default to a fixed score (like 55 or 60). Score the candidate ONLY on what they actually said.
2. TOPIC RELEVANCE & TOPIC EVASION ("Mavzudan qochish") CHECK:
   - Compare every answer directly against its specific question.
   - If the candidate goes off-topic, evades the question ("mavzuni olib qochsa"), or talks about an unrelated topic, you MUST penalize Fluency & Coherence and Pronunciation & Task Achievement heavily (cap totalScore at <= 32/75) and explicitly state in 'improvements' (in Uzbek) WHICH question they evaded and what they talked about instead.
   - If the candidate simply repeats/reads back the question words without adding their own answer, score totalScore <= 15/75.
   - If the candidate spoke in Uzbek/Russian instead of English or said gibberish, score 0-10/75.
3. DO NOT penalize idioms or common phrases if they fit the context naturally.
4. SHORT / UNDERDEVELOPED ANSWERS:
   - If answers are 1-2 short sentences when a 1-2 minute speech or full explanation was required, Fluency & Coherence and Task scores must be low (B1 or A2 range: 20-42/75).
5. ACOUSTIC & PRONUNCIATION ANALYSIS:
   - Use the provided acoustic metrics (voiced seconds, pauses, speaking rate WPM, fluency ratio) together with transcript clarity to evaluate Pronunciation & Task Achievement (max 15) and Fluency & Coherence (max 20).
6. INDIVIDUALIZED FEEDBACK (IN UZBEK):
   - Every item in 'strengths' and 'improvements' MUST reference the candidate's actual words/mistakes (quote their exact phrase and show the corrected version). Never output generic boilerplate advice.

OFFICIAL 75-POINT SCORING RUBRIC:
- fluencyScore: 0 to 20 (Fluency, coherence, logical development, natural pacing)
- lexicalScore: 0 to 20 (Vocabulary range, precision, topic-specific words)
- grammarScore: 0 to 20 (Grammatical range and accuracy; penalize real grammatical errors found in the transcript)
- pronunciationTaskScore: 0 to 15 (Intelligibility, intonation/flow from acoustic metrics, and direct Task Fulfillment)
- totalScore: sum of the 4 criteria (0 to 75)
  * 65-75: C1 (Oliy daraja)
  * 50-64: B2 (Yuqori daraja)
  * 30-49: B1 (O'rta daraja)
  * 1-29: A2 (Sertifikat berilmaydi)

Return ONLY valid JSON matching this exact structure:
{
  "fluencyScore": number,
  "lexicalScore": number,
  "grammarScore": number,
  "pronunciationTaskScore": number,
  "totalScore": number,
  "cefrLevel": "C1" | "B2" | "B1" | "A2",
  "isOffTopic": boolean,
  "strengths": ["2-3 specific strengths in Uzbek quoting candidate's actual good phrases"],
  "improvements": ["3 specific, actionable corrections in Uzbek quoting candidate's exact mistakes or off-topic parts and how to fix them"],
  "quotes": ["1-2 exact quotes from candidate's speech"],
  "vocabularyHighlights": ["notable words/phrases used by candidate"],
  "grammaticalFeaturesDetected": ["grammar structures or specific grammar errors noticed"]
}`;
  }

  return `You are a strict, certified Cambridge / IDP / British Council IELTS Speaking Examiner.
Evaluate the candidate's ACTUAL spoken answers for IELTS Speaking (${testPart}) strictly according to the Official Public IELTS Speaking Band Descriptors (0.0 to 9.0 in 0.5 steps).

CRITICAL ANTI-BIAS & HUMAN EXAMINER RULES:
1. NEVER default to Band 7.0! Over-scoring is strictly forbidden. Base your scores 100% on the actual evidence in the candidate's transcript and acoustic metrics.
   - 1-2 short/broken sentences or basic vocabulary = Band 3.5 - 4.5.
   - Understandable but simple/repetitive with noticeable grammar errors = Band 5.0 - 5.5.
   - Willing to speak at length, some complex structures but occasional errors or hesitation = Band 6.0 - 6.5.
   - Flexible, error-free sentences, natural collocations, fully developed ideas = Band 7.0 - 8.5.
2. TOPIC RELEVANCE & TOPIC EVASION ("Mavzudan qochish") CHECK:
   - Compare each answer directly against the exact question asked.
   - If the candidate goes off-topic, evades the question ("mavzuni olib qochsa"), or answers a different topic than asked, cap Fluency & Coherence and Lexical Resource at 4.0 - 4.5, and explicitly explain in 'improvements' (in Uzbek) which question they evaded and why it is off-topic.
   - If the candidate merely repeats the question back without answering, score 2.0 - 3.0.
   - If the candidate spoke in Uzbek/Russian or unintelligible words, score 1.0 - 2.0.
3. DO NOT penalize idioms or set phrases if used in context.
4. REAL GRAMMAR & LEXICAL CHECK:
   - Read every sentence carefully. Identify real grammatical errors (wrong tense, subject-verb disagreement, missing articles, awkward phrasing). Quote the exact mistake and give the corrected English phrase inside 'improvements' (explained in Uzbek).
5. ACOUSTIC & PRONUNCIATION ANALYSIS:
   - Use the provided acoustic metrics (voiced duration, speaking rate WPM, pauses, fluencyRatio) and phonetic clarity in the transcript to score Pronunciation (0.0 - 9.0, 0.5 increments).
6. INDIVIDUALIZED FEEDBACK (IN UZBEK):
   - Every item in 'strengths' and 'improvements' MUST be specific to THIS candidate's exact words. Never give generic pre-written templates!

Return ONLY valid JSON matching this exact structure:
{
  "fluencyScore": number (1.0 to 9.0 in 0.5 steps),
  "lexicalScore": number (1.0 to 9.0 in 0.5 steps),
  "grammarScore": number (1.0 to 9.0 in 0.5 steps),
  "pronunciationScore": number (1.0 to 9.0 in 0.5 steps),
  "isOffTopic": boolean,
  "strengths": ["2-3 specific strengths in Uzbek quoting candidate's actual good phrases"],
  "improvements": ["3 specific corrections in Uzbek quoting candidate's exact grammar/lexical errors or off-topic shifts and showing the Band 7.5+ version"],
  "quotes": ["1-2 exact quotes from candidate's speech"],
  "vocabularyHighlights": ["notable words/collocations used by candidate"],
  "grammaticalFeaturesDetected": ["specific grammar structures or errors noticed"]
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
              temperature: 0.2,
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
      if (text) {
        return extractJsonObject(text);
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Gemini evaluation failed');
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
      temperature: 0.2,
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
  if (!checkRateLimit(rateKey, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many requests, please wait a minute' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const examType = body.examType === 'multilevel' ? 'multilevel' : 'ielts';
    const testPart = String(body.testType || 'part1').slice(0, 40);
    const answers = Array.isArray(body.answers) ? body.answers.slice(0, 12) : [];

    if (!answers.length) {
      return res.status(400).json({ error: 'Answers required' });
    }

    const formattedTurns = answers
      .map((item, idx) => {
        const q = String(item?.question || '').slice(0, 500);
        const a = String(item?.answer || '').slice(0, 2000);
        const m = item?.metrics;
        const metricsLine = m
          ? `Acoustic Metrics: duration=${Number(m.durationSec || 0).toFixed(1)}s, voiced=${Number(m.voicedSec || 0).toFixed(1)}s, pauses=${Number(m.pauseCount || 0)}, fluencyRatio=${Math.round(Number(m.fluencyRatio || 0) * 100)}%`
          : 'Acoustic Metrics: not provided';
        return `Turn ${idx + 1}:\nQuestion: ${q}\nCandidate Spoken Transcript: ${a}\n${metricsLine}`;
      })
      .join('\n\n---\n\n');

    const systemPrompt = buildSystemPrompt(examType, testPart);
    const userPayload = `EXAM TYPE: ${examType.toUpperCase()} (${testPart})\n\nCANDIDATE RESPONSES:\n${formattedTurns}`;

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.ENGLISH_GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.ENGLISH_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      return res.status(503).json({ error: 'AI evaluation service not configured' });
    }

    let evaluation = null;
    let lastErr = null;

    if (geminiKey) {
      try {
        evaluation = await evaluateWithGemini(systemPrompt, userPayload, geminiKey);
      } catch (e) {
        lastErr = e;
        console.error('Gemini speaking eval error:', e?.message || e);
      }
    }

    if (!evaluation && groqKey) {
      try {
        evaluation = await evaluateWithGroq(systemPrompt, userPayload, groqKey);
      } catch (e) {
        lastErr = e;
        console.error('Groq speaking eval error:', e?.message || e);
      }
    }

    if (!evaluation) {
      return res.status(502).json({ error: lastErr?.message || 'AI evaluation failed' });
    }

    return res.status(200).json({ evaluation });
  } catch (err) {
    console.error('evaluate_speaking error:', err?.message || err);
    return res.status(500).json({ error: 'Evaluation failed' });
  }
}
