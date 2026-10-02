import type { ChatMessage } from './aiService';
import { loadTasks, getLast7Days, today } from './storage';
import type { Task } from '../types';

// ────────── helpers ──────────

const pct = (done: number, total: number) =>
  total ? Math.round((done / total) * 100) : 0;

const formatDuration = (mins: number) =>
  mins >= 60 ? `${Math.floor(mins / 60)}s ${mins % 60 ? (mins % 60) + 'daq' : ''}`.trim() : `${mins} daqiqa`;

// ────────── Build context string ──────────

export const buildTaskContext = (): string => {
  const allTasks = loadTasks();
  const todayStr = today();
  const todayTasks = allTasks.filter((t) => t.createdAt === todayStr);
  const doneTasks  = todayTasks.filter((t) => t.done);
  const pendTasks  = todayTasks.filter((t) => !t.done);
  const week       = getLast7Days();

  const weekDone  = week.reduce((a, b) => a + b.done, 0);
  const weekTotal = week.reduce((a, b) => a + b.total, 0);
  const weekPct   = pct(weekDone, weekTotal);

  // Streak
  let streak = 0;
  for (const d of [...week].reverse()) {
    if (d.done > 0) streak++; else break;
  }

  // Planned time today
  const totalPlannedMins = todayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const donePlannedMins  = doneTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

  // High-priority pending
  const highPend = pendTasks.filter((t) => t.priority === 'high');

  return `
=== FOYDALANUVCHI MA'LUMOTLARI ===
BUGUN (${todayStr}):
  - Jami: ${todayTasks.length} ta vazifa
  - Bajarildi: ${doneTasks.length} ta (${pct(doneTasks.length, todayTasks.length)}%)
  - Bajarilgan vazifalar: ${doneTasks.length ? doneTasks.map(t => `"${t.text}"${t.duration ? ` (${t.duration} daq)` : ''}`).join(', ') : 'hech biri yo\'q'}
  - Qolgan vazifalar: ${pendTasks.length ? pendTasks.map(t => `"${t.text}" [${t.priority}]${t.duration ? ` (${t.duration} daq)` : ''}`).join(', ') : 'hammasini bajardi!'}
  - Rejalashtirilgan vaqt: ${totalPlannedMins > 0 ? formatDuration(totalPlannedMins) : 'ko\'rsatilmagan'}
  - Sarflangan vaqt (taxminiy): ${donePlannedMins > 0 ? formatDuration(donePlannedMins) : 'ko\'rsatilmagan'}
  - Muhim (yuqori prioritet) qolganlar: ${highPend.length ? highPend.map(t => `"${t.text}"`).join(', ') : 'yo\'q'}

SO'NGI 7 KUN:
  - Haftalik o'rtacha: ${weekPct}%
  - Jami bajarildi: ${weekDone}/${weekTotal}
  - Streak: ${streak} kun ketma-ket
=================================`.trim();
};

// ────────── Offline Smart Analyzer ──────────

const offlineAnalyze = (userMsg: string, todayTasks: Task[]): string => {
  const todayStr  = today();
  const done      = todayTasks.filter((t) => t.done);
  const pend      = todayTasks.filter((t) => !t.done);
  const completion = pct(done.length, todayTasks.length);
  const lower     = userMsg.toLowerCase();
  const week      = getLast7Days();
  const streak    = (() => { let s = 0; for (const d of [...week].reverse()) { if (d.done > 0) s++; else break; } return s; })();

  // ── Specific task analysis
  const highPend  = pend.filter(t => t.priority === 'high');
  const totalMins = todayTasks.reduce((s, t) => s + (t.duration || 0), 0);
  const doneMins  = done.reduce((s, t) => s + (t.duration || 0), 0);
  const timeNote  = totalMins > 0
    ? `\n⏱ Rejalashtirilgan vaqtdan **${formatDuration(doneMins)}** sarflandi (jami: **${formatDuration(totalMins)}**).`
    : '';

  // ── Motivation & analysis blocks
  const motivBlock = (() => {
    if (completion === 100)
      return `🏆 **MUKAMMAL KUN!** Barcha **${done.length}** ta vazifani tugatdingiz! Bu katta g'alaba. ${streak >= 3 ? `🔥 **${streak} kun ketma-ket!** Siz o'z ustida ishlaydigan insonsiz.` : 'Bugungi natijangiz bilan faxrlaning!'}`;
    if (completion >= 75)
      return `🔥 **Zo'r natiija!** ${done.length} ta vazifa bajardingiz — **${completion}%**. ${pend.length} ta qoldi. Deyarli tugatdingiz, yana bir kuch siqib oling!`;
    if (completion >= 50)
      return `💪 **Yaxshi ketmoqda!** Yarim yo'ldan o'tdingiz — **${completion}%**. ${highPend.length > 0 ? `⚠️ Diqqat: "${highPend[0].text}" — muhim vazifa hali kutmoqda!` : `Qolgan ${pend.length} ta vazifani ham bajaring!`}`;
    if (completion >= 25)
      return `⚡ **Boshlanish yaxshi, lekin yana kuch kerak!** Hozircha **${completion}%** — ${done.length}/${todayTasks.length}. ${highPend.length > 0 ? `Eng avval "${highPend[0].text}" ni tugatish shart!` : 'Keyingi vazifaga o\'ting!'}`;
    if (done.length === 0 && todayTasks.length > 0)
      return `😤 Hali birorta ham vazifa bajarilmadi! Ularni ro'yxatga qo'yish yaxshi qadam — lekin bajarmasak natija yo'q. **Hozir shu daqiqada bitta vazifani boshlang**: "${pend[0]?.text || 'birinchi vazifani'}"!`;
    return `🚀 Bugun hali boshlanish bosqichida. **${todayTasks.length}** ta reja bor. Kichik boshlash — katta g'alaba!`;
  })();

  // ── Specific question matching
  if (lower.includes('nima') || lower.includes('tahlil') || lower.includes('analiz') || lower.includes('ko\'rsat') || lower.includes('holat')) {
    return `📊 **Bugungi tahlil (${todayStr}):**\n\n${motivBlock}${timeNote}\n\n${highPend.length > 0 ? `🚨 **Muhim:** "${highPend[0].text}" hali kutmoqda!` : ''}`;
  }

  if (lower.includes('nega') || lower.includes('nima uchun') || lower.includes('kam')) {
    const reasons = [
      completion < 30 && todayTasks.length > 5 ? '📋 Juda ko\'p vazifa — buni kamroq, lekin aniqroq qilib reja tuzing.' : null,
      highPend.length > 0 ? `⚡ "${highPend[0].text}" kabi muhim vazifalar boshqa narsalarga chalg'itmoqda bo'lishi mumkin.` : null,
      '🎯 **Pomodoro usuli:** 25 daqiqa ishlash + 5 daqiqa dam olish. Bir vaqtda BITTA vazifaga to\'liq e\'tibor.',
      '📵 Telefon yoki ijtimoiy tarmoqlar diqqatni bo\'lmoqda bo\'lishi mumkin.',
    ].filter(Boolean);
    return `🔍 **Nima uchun kam bajaryapsiz? Sabablar:**\n\n${reasons.map((r, i) => `${i+1}. ${r}`).join('\n')}\n\n💡 **Tavsiya:** Bugun faqat ${Math.min(3, pend.length)} ta eng muhim vazifaga e'tibor qarating.`;
  }

  if (lower.includes('reja') || lower.includes('ertaga') || lower.includes('plan')) {
    const remaining = pend.slice(0, 3).map((t, i) => `${i+1}. ${t.text}${t.duration ? ` — ${t.duration} daqiqa` : ''} [${t.priority}]`).join('\n');
    return `📋 **Bugungi qolgan rejalar:**\n\n${remaining || 'Hammasi bajarildi!'}\n\n💡 Ertaga uchun maslahat: maksimum **5 ta asosiy vazifa** rejalang. Ko'p emas, lekin hammasi bajarilsin!`;
  }

  if (lower.includes('motivat') || lower.includes('kuch') || lower.includes('ilhoml') || lower.includes('qo\'llab')) {
    const quotes = [
      `"Katta g'alaba — kichik qadamlarning yig'indisi." Siz bugun ${done.length > 0 ? done.length + ' ta qadam oldingiz' : 'hali birinchi qadamni kutmoqdasiz'}!`,
      `Har bir belgilangan ✅ — bu o'z-o'zingizga bergan va'dangiz. Bugun ${done.length} ta va'da bajardi.`,
      `Streak — bu odatning kuchi. ${streak > 0 ? `Siz ${streak} kun ketma-ket ishlayapsiz — bu oddiy emas!` : 'Bugundan boshlab yangi streak boshlang!'}`,
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    return `💫 **Motivatsiya:**\n\n${motivBlock}\n\n✨ ${q}`;
  }

  if (lower.includes('vaqt') || lower.includes('time') || lower.includes('soat')) {
    const remaining = pend.reduce((s, t) => s + (t.duration || 25), 0);
    return `⏱ **Vaqt tahlili:**\n${timeNote || '\n(Vazifalaringizga vaqt qo\'shmadingiz, lekin taxminan)'}
Qolgan **${pend.length}** ta vazifa uchun ~**${formatDuration(remaining)}** kerak bo\'ladi.
${remaining > 120 ? '⚠️ Juda ko\'p vaqt kerak. Qaysilarini keyinga qoldirish mumkin?' : '✅ Bugun ulgurish mumkin!'}`;
  }

  // Default: motivation + brief analysis
  return `${motivBlock}${timeNote}

📌 Qolgan vazifalar: ${pend.length > 0 ? pend.slice(0, 3).map(t => `"${t.text}"`).join(', ') + (pend.length > 3 ? ` va yana ${pend.length - 3} ta...` : '') : 'hammasi bajarildi 🎉'}`;
};

// ────────── Main export ──────────

// Asosiy Gemini API Kaliti (Base64 shifrlangan)
const getGeminiKey = (): string => {
  try {
    return atob('QVEuQWI4Uk42S2dhS0pXdUZWTGd1ZzB5eHlZZzZRMVdYMmNUUW0tZGpfTEJhT0RCZFJfVXc=');
  } catch {
    return '';
  }
};

// ────────── Gemini API chaqiruvi ──────────
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    throw new Error('Gemini javob bermadi');
  }
  return reply;
}

// ────────── Main export: Gemini -> Groq -> Offline Fallback ──────────

export const analyzeWithAI = async (
  userMessage: string,
  history: ChatMessage[],
  groqKey?: string
): Promise<string> => {
  const context = buildTaskContext();
  const systemPrompt = `Sen foydalanuvchining shaxsiy produktivlik murabbiyi va to-do tahlilchisisan. O'zbek tilida muloqot qilasan. Sening maqsading: REAL ma'lumotlarga asoslanib, ANIQ va FOYDALI tahlil berish. Umumiy gaplardan qoching, faqat foydalanuvchining HAQIQIY vazifalariga murojaat qil.

${context}

Qoidalar:
1. Har doim ANIQ raqamlar (%) va real vazifa nomlarini mention qil
2. Motivatsiya — sentimental emas, AMALIY bo'lsin
3. Tavsiya — bajarish mumkin bo'lgan konkret qadamlar
4. Javob: 4-6 gap, qisqa, tushunarli, motivatsiyali`;

  // 1-qadam: Birinchi navbatda Google Gemini API orqali javob olishga urinish
  try {
    const geminiKey = getGeminiKey();
    if (geminiKey) {
      const geminiReply = await callGemini(
        systemPrompt,
        userMessage,
        history,
        geminiKey
      );
      return geminiReply;
    }
  } catch (geminiErr) {
    console.warn('Gemini API xatolik berdi yoki limiti tugadi. Groq / Offline rejimga o\'tilmoqda:', geminiErr);
  }

  // 2-qadam: Agar Gemini ishlamasa yoki limiti tugasa, Groq API (Llama 3.3) ga o'tish
  const activeGroqKey = groqKey || localStorage.getItem('groq_api_key');
  if (activeGroqKey && activeGroqKey.trim().length > 10) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeGroqKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.slice(-8),
            { role: 'user', content: userMessage },
          ],
          temperature: 0.72,
          max_tokens: 450,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return reply;
      }
    } catch (groqErr) {
      console.warn('Groq API ham xatolik berdi. Offline rejimga o\'tilmoqda:', groqErr);
    }
  }

  // 3-qadam: Agar internet yoki API xatolik bersa, 100% kafolatlangan Smart Offline Murabbiy
  await new Promise((r) => setTimeout(r, 600));
  const todayTasks = loadTasks().filter((t) => t.createdAt === today());
  return offlineAnalyze(userMessage, todayTasks);
};
