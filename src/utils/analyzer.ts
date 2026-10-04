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

  // ── Ovozli vazifa aniqlash (offline)
  const taskKeywords = ['qilmoqchiman', 'o\'qimoqchiman', 'bajarmoqchiman', 'borishim kerak', 'vazifa qo\'sh', 'yozib qo\'y', 'qilishim kerak'];
  const hasTaskIntent = taskKeywords.some((k) => lower.includes(k));

  if (hasTaskIntent) {
    let duration: number | null = null;
    if (lower.includes('yarim soat')) duration = 30;
    else if (lower.includes('1 soat') || lower.includes('bir soat')) duration = 60;
    else if (lower.includes('1.5 soat') || lower.includes('bir yarim soat')) duration = 90;
    else if (lower.includes('2 soat') || lower.includes('ikki soat')) duration = 120;
    else {
      const match = lower.match(/(\d+)\s*daqiqa/);
      if (match) duration = parseInt(match[1]);
    }

    let priority = 'medium';
    if (lower.includes('muhim') || lower.includes('zarur') || lower.includes('shoshilinch')) {
      priority = 'high';
    } else if (lower.includes('muhim emas') || lower.includes('past')) {
      priority = 'low';
    }

    let category = 'personal';
    if (lower.includes('kitob') || lower.includes('dars') || lower.includes('o\'qish') || lower.includes('kurs')) category = 'learning';
    else if (lower.includes('sport') || lower.includes('yugurish') || lower.includes('mashq') || lower.includes('suv')) category = 'health';
    else if (lower.includes('ish') || lower.includes('loyiha') || lower.includes('hisobot') || lower.includes('kod')) category = 'work';

    // Vazifa nomini tozalash
    let cleanText = userMsg
      .replace(/bugun\s+men/gi, '')
      .replace(/va\s+bu\s+vazifa\s+muhim/gi, '')
      .replace(/muhim/gi, '')
      .replace(/yarim soat/gi, '')
      .replace(/\d+\s*(soat|daqiqa)/gi, '')
      .replace(/o'qimoqchiman/gi, 'o\'qish')
      .replace(/qilmoqchiman/gi, 'qilish')
      .trim();

    if (!cleanText || cleanText.length < 3) cleanText = userMsg;

    const taskObj = JSON.stringify({
      text: cleanText.charAt(0).toUpperCase() + cleanText.slice(1),
      duration,
      priority,
      category,
    });

    return `Ajoyib maqsad! Siz aytgan vazifani rejangizga qo'shdim. Rejalashtirilgan ish baribir bajariladi! 🚀\n[[TASK: ${taskObj}]]`;
  }

  // Default: motivation + brief analysis
  return `${motivBlock}${timeNote}

📌 Qolgan vazifalar: ${pend.length > 0 ? pend.slice(0, 3).map(t => `"${t.text}"`).join(', ') + (pend.length > 3 ? ` va yana ${pend.length - 3} ta...` : '') : 'hammasi bajarildi 🎉'}`;
};

// ────────── Main export ──────────

// ────────── Gemini API chaqiruvi (Xavfsiz Server Proxy orqali) ──────────
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[],
  customApiKey?: string
): Promise<string> {
  // 1. Agar foydalanuvchi o'z kalitini kiritgan bo'lsa
  if (customApiKey && customApiKey.trim()) {
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customApiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Gemini javob bermadi');
    return reply;
  }

  // 2. Xavfsiz server orqali chaqirish (Frontendda hech qanday maxfiy kalit saqlanmaydi)
  const serverUrl = 'https://todo-mini-app-cwkd.onrender.com/api/ai_analyze';
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server AI error: ${response.status}`);
  }

  const data = await response.json();
  if (data.reply) return data.reply;
  throw new Error('AI javob bermadi');
}

// ────────── Main export: Gemini -> Groq -> Offline Fallback ──────────

export const analyzeWithAI = async (
  userMessage: string,
  history: ChatMessage[],
  groqKey?: string
): Promise<string> => {
  const context = buildTaskContext();
  const systemPrompt = `Sen foydalanuvchining shaxsiy produktivlik murabbiyi va to-do tahlilchisisan. O'zbek tilida muloqot qilasan. Sening maqsading: REAL ma'lumotlarga asoslanib, ANIQ va FOYDALI tahlil berish.

${context}

MUHIM QOIDA (Vazifa yaratish):
Agar foydalanuvchi biror vazifa qilmoqchi ekanligini aytsa (masalan: "Bugun men yarim soat kitob o'qimoqchiman va bu vazifa muhim", "vazifa qo'sh", "sport bilan shug'ullanishim kerak", "ertalab yugurishim kerak" va h.k.), sen ushbu vazifani aniqlab, javobingning oxirida AYNAN quyidagi maxsus blokni qo'shishing SHART:
[[TASK: {"text": "Vazifa nomi", "duration": daqiqalar_soni_yoki_null, "priority": "high"|"medium"|"low", "category": "work"|"personal"|"health"|"learning"|"other"}]]

Qoidalar:
- "yarim soat" = 30 daqiqa, "1 soat" = 60 daqiqa, "15 daqiqa" = 15. Agar vaqt aytilmasa: duration: null.
- "muhim", "shoshilinch", "zarur", "katta ahamiyatga ega" bo'lsa: priority: "high". Agar muhimlik aytilmasa: priority: "medium". Agar "muhim emas" deyilsa: priority: "low".
- Toifani aniqla: kitob/dars/o'qish -> "learning", sport/mashq/yugurish/suv -> "health", ish/mijoz/kod/hisobot -> "work", boshqalar -> "personal".
- Javobingda foydalanuvchiga vazifa qabul qilingani va qisqa motivatsiya ber.`;

  // 1-qadam: Birinchi navbatda Google Gemini API orqali javob olishga urinish
  try {
    const geminiReply = await callGemini(
      systemPrompt,
      userMessage,
      history
    );
    if (geminiReply) {
      return geminiReply;
    }
  } catch (geminiErr) {
    console.warn('Gemini API xatolik berdi yoki server ulanmadi. Groq / Offline rejimga o\'tilmoqda:', geminiErr);
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

// ────────── AI javobidan vazifani ajratish ──────────
export interface ExtractedTask {
  text: string;
  duration?: number | null;
  priority?: 'high' | 'medium' | 'low';
  category?: 'work' | 'personal' | 'health' | 'learning' | 'other';
}

export const extractTaskIntent = (
  replyText: string
): { cleanReply: string; task: ExtractedTask | null } => {
  const taskRegex = /\[\[TASK:\s*(\{.*?\})\s*\]\]/s;
  const match = replyText.match(taskRegex);

  if (match) {
    try {
      const taskData = JSON.parse(match[1]);
      const cleanReply = replyText.replace(taskRegex, '').trim();
      return {
        cleanReply,
        task: {
          text: taskData.text || 'Yangi vazifa',
          duration: taskData.duration || null,
          priority: taskData.priority || 'medium',
          category: taskData.category || 'personal',
        },
      };
    } catch {
      // JSON parse xatolik bersa
    }
  }

  return { cleanReply: replyText, task: null };
};
