// Speech-to-text for speaking exams (Vercel serverless function).
// Receives raw audio (webm/mp4/ogg) in the request body and returns { text }.
// Uses Groq Whisper (free tier) first, then Gemini as a fallback.

export const config = {
  api: { bodyParser: false },
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
};

const extFor = (mime) => {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
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
  if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return String(data.text || '').trim();
};

const transcribeWithGemini = async (audio, mime, apiKey) => {
  const model = process.env.GEMINI_MODEL || process.env.ENGLISH_GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Transcribe this English speaking-exam answer verbatim. Output only the transcript text. If there is no speech, output nothing.' },
          { inline_data: { mime_type: mime.split(';')[0], data: audio.toString('base64') } },
        ],
      }],
      generationConfig: { temperature: 0 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return String(data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '').trim();
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const audio = await readBody(req);
    if (!audio.length) return res.status(400).json({ error: 'Empty audio' });
    if (audio.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'Audio too large' });

    const mime = String(req.headers['content-type'] || 'audio/webm');
    const groqKey = process.env.GROQ_API_KEY || process.env.ENGLISH_GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.ENGLISH_GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return res.status(500).json({ error: 'No transcription API key configured (GROQ_API_KEY or GEMINI_API_KEY)' });
    }

    let text = '';
    let lastError = null;
    if (groqKey) {
      try {
        text = await transcribeWithGroq(audio, mime, groqKey);
      } catch (e) {
        lastError = e;
        console.error('Groq transcription error:', e);
      }
    }
    if (!text && geminiKey && (lastError || !groqKey)) {
      text = await transcribeWithGemini(audio, mime, geminiKey);
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Transcription error:', err);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}
