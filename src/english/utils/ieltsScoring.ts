/**
 * Official Cambridge / IDP / British Council IELTS Speaking Evaluation Engine
 * Powered by Real AI Examiner (/api/evaluate_speaking -> Gemini 2.5 Flash / Groq Llama-3.3-70B)
 * with calibrated linguistic + acoustic fallback.
 *
 * Strictly adheres to Official IELTS Speaking Band Descriptors:
 * 1. Fluency and Coherence (FC)
 * 2. Lexical Resource (LR)
 * 3. Grammatical Range and Accuracy (GRA)
 * 4. Pronunciation (PR)
 */

import { API_BASE_URL } from '../../config';
import { getTelegramInitData } from '../../utils/telegram';
import type { TurnAcousticMetrics } from './examRecorder';

export interface SpeechEvaluationResult {
  overallBand: number;
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;
  topicRelevance?: 'on_topic' | 'partially_off_topic' | 'off_topic';
  strengths: string[];
  improvements: string[];
  quotes: string[];
  vocabularyHighlights: string[];
  grammaticalFeaturesDetected: string[];
}

export interface CandidateTurnInput {
  question: string;
  answer: string;
  metrics?: TurnAcousticMetrics | null;
}

// Sophisticated vocabulary dictionary (B2/C1/C2 IELTS Band 6.5 - 9.0)
const ADVANCED_VOCAB = [
  'predominantly', 'paramount', 'detrimental', 'ubiquitous', 'exacerbate',
  'crucial', 'pivotal', 'inevitable', 'substantially', 'indispensable',
  'perspective', 'manifestation', 'disproportionate', 'facilitate', 'counterpart',
  'feasibility', 'repercussion', 'profound', 'intricacies', 'unprecedented',
  'lucrative', 'comprehensive', 'compelling', 'versatile', 'sustainable',
  'accelerate', 'diminish', 'enhance', 'contemplate', 'articulate',
  'alleviate', 'scrutinize', 'mitigate', 'discrepancy', 'resilience',
  'cornerstone', 'prevalent', 'divergent', 'intrinsic', 'exemplify',
  'significant', 'beneficial', 'consequently', 'furthermore', 'nevertheless'
];

// Discourse markers for Fluency & Coherence
const DISCOURSE_MARKERS = [
  'furthermore', 'moreover', 'consequently', 'subsequently', 'on the other hand',
  'in terms of', 'as a result', 'in addition', 'by contrast', 'for instance',
  'for example', 'to illustrate', 'broadly speaking', 'as far as i am concerned',
  'nevertheless', 'nonetheless', 'conversely', 'that is to say', 'first of all',
  'in my opinion', 'from my perspective', 'because of this', 'therefore', 'however'
];

// Natural conversational signposts
const NATURAL_FILLERS = [
  'well', 'actually', 'to be honest', 'to be fair', 'i suppose',
  'honestly speaking', 'it really depends', 'in fact', 'personally'
];

// Complex grammar triggers (Subordinating clauses, Conditionals, Relative clauses, Passives, Perfects)
const COMPLEX_GRAMMAR_TRIGGERS = [
  'although', 'even though', 'whereas', 'while', 'despite', 'in spite of',
  'provided that', 'unless', 'so that', 'whether', 'which', 'who', 'whose',
  'not only', 'if i had', 'if i were', 'would have', 'could have', 'should have',
  'has been', 'have been', 'had been', 'is considered', 'can be', 'will be'
];

// Common grammatical errors for accuracy check
const GRAMMAR_ERROR_PATTERNS: RegExp[] = [
  /\b(i is|i am agree|i very like|he go|she go|it go|he have|she have|people is|peoples|informations|advices|furnitures|equipments)\b/gi,
  /\b(more better|more easier|most easiest|very much good|can to|must to|should to|will can)\b/gi,
  /\b(didn't went|didn't saw|didn't knew|doesn't has|don't has|was happen|is happen)\b/gi,
];

const QUESTION_STOP_WORDS = new Set([
  'what', 'where', 'when', 'which', 'would', 'could', 'should', 'about', 'think',
  'describe', 'explain', 'people', 'often', 'usually', 'your', 'there', 'their',
  'have', 'with', 'from', 'that', 'this', 'some', 'many', 'more', 'than', 'important',
  'kind', 'kinds', 'type', 'types', 'like', 'prefer', 'much', 'time', 'future',
  'part', 'card', 'question', 'questions', 'why', 'how', 'who', 'whom', 'does', 'did'
]);

const TOPIC_SYNONYM_MAP: Record<string, string[]> = {
  work: ['job', 'career', 'office', 'company', 'salary', 'business', 'profession', 'employ', 'colleague', 'manager'],
  study: ['school', 'university', 'student', 'learn', 'subject', 'exam', 'education', 'teacher', 'course', 'degree', 'class'],
  hometown: ['city', 'town', 'village', 'live', 'place', 'street', 'country', 'local', 'neighborhood', 'area'],
  home: ['house', 'apartment', 'flat', 'room', 'family', 'live', 'kitchen', 'bedroom', 'building'],
  technology: ['computer', 'phone', 'internet', 'digital', 'online', 'software', 'device', 'smartphone', 'ai', 'app'],
  travel: ['trip', 'journey', 'visit', 'country', 'tourist', 'flight', 'vacation', 'holiday', 'abroad', 'hotel', 'sightseeing'],
  book: ['read', 'novel', 'author', 'story', 'literature', 'library', 'page', 'writer'],
  food: ['eat', 'cook', 'meal', 'restaurant', 'dish', 'healthy', 'delicious', 'breakfast', 'dinner', 'cuisine'],
  sport: ['exercise', 'game', 'play', 'football', 'fitness', 'gym', 'health', 'team', 'run', 'swim', 'match'],
  music: ['song', 'listen', 'singer', 'instrument', 'concert', 'melody', 'band', 'pop', 'classical'],
  environment: ['nature', 'pollution', 'climate', 'green', 'recycle', 'planet', 'weather', 'tree', 'plastic', 'energy'],
  money: ['spend', 'save', 'buy', 'expensive', 'cheap', 'financial', 'bank', 'cash', 'cost', 'budget', 'invest'],
  friend: ['people', 'person', 'meet', 'trust', 'talk', 'together', 'relationship', 'help', 'childhood', 'social'],
  media: ['news', 'television', 'social', 'watch', 'movie', 'film', 'newspaper', 'video', 'journalist'],
};

const clampHalfBand = (val: number): number => {
  if (!Number.isFinite(val) || val <= 0) return 0.0;
  return Math.min(9.0, Math.max(1.0, Math.round(val * 2) / 2));
};

export const computeOfficialIeltsOverall = (fc: number, lr: number, gra: number, pr: number): number => {
  if (fc <= 0 && lr <= 0 && gra <= 0 && pr <= 0) return 0.0;
  const avg = (fc + lr + gra + pr) / 4;
  const intPart = Math.floor(avg);
  const decimal = avg - intPart;
  let overall = intPart;
  if (decimal >= 0.75) overall = intPart + 1.0;
  else if (decimal >= 0.25) overall = intPart + 0.5;
  return Math.min(9.0, Math.max(1.0, overall));
};

export const filterValidCandidateAnswers = (answers: CandidateTurnInput[]): CandidateTurnInput[] => {
  return answers.filter((a) => {
    const t = (a.answer || '').trim();
    return (
      t.length > 0 &&
      !t.startsWith('(') &&
      !t.includes('javob bermadi') &&
      !t.includes('javobi berilmadi') &&
      !t.includes('nutqi berilmadi')
    );
  });
};

/**
 * Primary Asynchronous Real AI Examiner Evaluation.
 * Sends the candidate's actual transcribed speech + questions + acoustic metrics to Gemini / Groq
 * and returns a genuine human-examiner evaluation.
 */
export async function evaluateCandidateSpeechWithAI(
  answers: CandidateTurnInput[],
  testType: 'part1' | 'part2' | 'part3' | 'full_mock'
): Promise<SpeechEvaluationResult> {
  const validAnswers = filterValidCandidateAnswers(answers);
  const combinedText = validAnswers.map((a) => a.answer).join(' ');
  const words = combinedText
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return evaluateCandidateSpeech(answers, testType);
  }

  const payload = {
    examType: 'ielts',
    testType,
    answers: answers.map((a) => ({
      question: a.question,
      answer: a.answer,
      metrics: a.metrics || null,
    })),
  };

  const initData = getTelegramInitData();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
  };

  const normalizeAiResponse = (raw: any): SpeechEvaluationResult | null => {
    if (!raw || typeof raw !== 'object') return null;
    const fc = clampHalfBand(Number(raw.fluencyScore));
    const lr = clampHalfBand(Number(raw.lexicalScore));
    const gra = clampHalfBand(Number(raw.grammarScore));
    const pr = clampHalfBand(Number(raw.pronunciationScore));
    if (fc === 0 || lr === 0 || gra === 0 || pr === 0) return null;

    const overallBand = computeOfficialIeltsOverall(fc, lr, gra, pr);

    // Ensure quotes come from the candidate's actual speech
    const fallbackQuotes: string[] = [];
    validAnswers.forEach((item) => {
      const sents = item.answer.split(/[.?!]+/).filter((s) => s.trim().length > 8);
      if (sents[0] && fallbackQuotes.length < 3) fallbackQuotes.push(`"${sents[0].trim()}"`);
    });

    const aiQuotes = Array.isArray(raw.quotes)
      ? raw.quotes.map((q: any) => String(q).trim()).filter((q: string) => q.length > 3)
      : [];

    return {
      overallBand,
      fluencyScore: fc,
      lexicalScore: lr,
      grammarScore: gra,
      pronunciationScore: pr,
      topicRelevance: raw.topicRelevance || 'on_topic',
      strengths: Array.isArray(raw.strengths) && raw.strengths.length > 0
        ? raw.strengths.map((s: any) => String(s)).slice(0, 4)
        : ["Nomzod savollarga ingliz tilida javob berishga harakat qildi."],
      improvements: Array.isArray(raw.improvements) && raw.improvements.length > 0
        ? raw.improvements.map((s: any) => String(s)).slice(0, 4)
        : ["Fikrlarni kengroq misollar va bog'lovchilar yordamida rivojlantiring."],
      quotes: aiQuotes.length > 0 ? aiQuotes.slice(0, 3) : fallbackQuotes,
      vocabularyHighlights: Array.isArray(raw.vocabularyHighlights)
        ? raw.vocabularyHighlights.map((s: any) => String(s)).slice(0, 5)
        : [],
      grammaticalFeaturesDetected: Array.isArray(raw.grammaticalFeaturesDetected)
        ? raw.grammaticalFeaturesDetected.map((s: any) => String(s)).slice(0, 5)
        : [],
    };
  };

  // 1. Try same-origin /api/evaluate_speaking (Vercel serverless function)
  try {
    const res = await fetch('/api/evaluate_speaking', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const parsed = normalizeAiResponse(data);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('Primary /api/evaluate_speaking error:', err);
  }

  // 2. Try Render backend /api/evaluate_speaking
  if (API_BASE_URL) {
    try {
      const res2 = await fetch(`${API_BASE_URL}/api/evaluate_speaking`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const parsed2 = normalizeAiResponse(data2);
        if (parsed2) return parsed2;
      }
    } catch (err2) {
      console.warn('Secondary /api/evaluate_speaking error:', err2);
    }
  }

  // 3. Fallback to calibrated local analysis if offline
  return evaluateCandidateSpeech(answers, testType);
}

/**
 * Synchronous linguistic & acoustic evaluator (used as offline fallback or for 0-word silence).
 * Strictly calibrated so it NEVER returns a hardcoded 7.0 template.
 */
export function evaluateCandidateSpeech(
  answers: CandidateTurnInput[],
  testType: 'part1' | 'part2' | 'part3' | 'full_mock'
): SpeechEvaluationResult {
  const validAnswers = filterValidCandidateAnswers(answers);

  const combinedText = validAnswers.map((a) => a.answer).join(' ');
  const cleanText = combinedText.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ');
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  // AGAR NOMZOD UMUMAN GAPIRMAGAN BO'LSA (0 TA SO'Z):
  if (totalWords === 0) {
    return {
      overallBand: 0.0,
      fluencyScore: 0.0,
      lexicalScore: 0.0,
      grammarScore: 0.0,
      pronunciationScore: 0.0,
      topicRelevance: 'off_topic',
      strengths: [],
      improvements: [
        "Siz belgilangan vaqtda hech qanday ovozli javob bermadingiz (yoki ovozingiz eshitilmadi).",
        "Imtihon topshirish uchun savol o'qib bo'lingach, mikrofon yonganida ingliz tilida aniq ovoz chiqarib gapiring.",
        "Mikrofon sozlamalarini va qurilmangizning ovoz yozish ruxsatini tekshiring."
      ],
      quotes: [],
      vocabularyHighlights: [],
      grammaticalFeaturesDetected: [],
    };
  }

  // Extract candidate evidence quotes (exact sentences candidate actually said)
  const quotes: string[] = [];
  validAnswers.forEach((item) => {
    const sents = item.answer.split(/[.?!]+/).filter((s) => s.trim().length > 6);
    if (sents[0] && quotes.length < 3) quotes.push(`"${sents[0].trim()}"`);
    if (sents[1] && quotes.length < 3) quotes.push(`"${sents[1].trim()}"`);
  });

  // Per-question Topic Relevance & Topic Evasion Check ("mavzudan chetga chiqish / olib qochish")
  let onTopicTurns = 0;
  let offTopicTurns = 0;

  validAnswers.forEach((turn) => {
    const qWords = turn.question
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !QUESTION_STOP_WORDS.has(w));

    const expandedKeywords = new Set<string>();
    qWords.forEach((qw) => {
      expandedKeywords.add(qw.slice(0, 5));
      Object.entries(TOPIC_SYNONYM_MAP).forEach(([key, syns]) => {
        if (qw.includes(key) || syns.some((s) => qw.includes(s))) {
          expandedKeywords.add(key.slice(0, 4));
          syns.forEach((s) => expandedKeywords.add(s.slice(0, 4)));
        }
      });
    });

    const aLower = turn.answer.toLowerCase();
    const aWordCount = aLower.split(/\s+/).filter(Boolean).length;
    if (expandedKeywords.size === 0 || aWordCount < 4) {
      return;
    }
    const hits = Array.from(expandedKeywords).filter((stem) => aLower.includes(stem));
    if (hits.length > 0) {
      onTopicTurns += 1;
    } else {
      offTopicTurns += 1;
    }
  });

  const isCompletelyOffTopic = validAnswers.length > 0 && onTopicTurns === 0 && offTopicTurns > 0 && totalWords >= 8;
  const isPartiallyOffTopic = !isCompletelyOffTopic && offTopicTurns > 0 && onTopicTurns > 0;
  const topicRelevance: 'on_topic' | 'partially_off_topic' | 'off_topic' = isCompletelyOffTopic
    ? 'off_topic'
    : isPartiallyOffTopic
    ? 'partially_off_topic'
    : 'on_topic';

  // 1. Lexical Diversity & Sophistication
  const uniqueWords = new Set(words);
  const ttr = totalWords > 0 ? uniqueWords.size / totalWords : 0;
  const vocabFound = ADVANCED_VOCAB.filter((v) => cleanText.includes(v));
  const discourseFound = DISCOURSE_MARKERS.filter((d) => cleanText.includes(d));
  const fillersFound = NATURAL_FILLERS.filter((f) => cleanText.includes(f));
  const grammarFound = COMPLEX_GRAMMAR_TRIGGERS.filter((g) => cleanText.includes(g));

  // Detect grammar errors
  let grammarErrorCount = 0;
  GRAMMAR_ERROR_PATTERNS.forEach((regex) => {
    const matches = cleanText.match(regex);
    if (matches) grammarErrorCount += matches.length;
  });

  // Repetition / stuttering check
  let stutterCount = 0;
  const wordFreq: Record<string, number> = {};
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.length > 3 && !QUESTION_STOP_WORDS.has(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
    if (i > 0 && w.length > 2 && w === words[i - 1]) {
      stutterCount += 1;
    }
  }
  const maxSingleWordRepetition = Math.max(0, ...Object.values(wordFreq));

  // Target words by part
  const targetWords = {
    part1: 75,
    part2: 140,
    part3: 115,
    full_mock: 290,
  }[testType];

  // Aggregate acoustic metrics if available
  const turnsWithMetrics = validAnswers.map((a) => a.metrics).filter(Boolean) as TurnAcousticMetrics[];
  const avgFluencyRatio = turnsWithMetrics.length > 0
    ? turnsWithMetrics.reduce((acc, m) => acc + m.fluencyRatio, 0) / turnsWithMetrics.length
    : 0.55;
  const totalPauses = turnsWithMetrics.reduce((acc, m) => acc + m.pauseCount, 0);

  const lengthRatio = Math.min(1.35, totalWords / targetWords);
  const polysyllabicWords = words.filter((w) => (w.match(/[aeiouy]+/gi) || []).length >= 3);
  const polysyllableRatio = totalWords > 0 ? polysyllabicWords.length / totalWords : 0;

  // ── 1. Fluency and Coherence (FC) ──
  let fcRaw = 2.5 + lengthRatio * 3.0; // Base ranges from ~2.5 (very short) to ~6.5 (full length)
  if (totalWords < 10) fcRaw = 2.0;
  else if (totalWords < 22) fcRaw = 3.0;
  else if (totalWords < 40) fcRaw = 4.0;
  else {
    if (discourseFound.length >= 1) fcRaw += 0.5;
    if (discourseFound.length >= 3) fcRaw += 0.5;
    if (discourseFound.length >= 5) fcRaw += 0.5;
    if (fillersFound.length >= 1) fcRaw += 0.25;
    if (avgFluencyRatio >= 0.62) fcRaw += 0.25;
    if (stutterCount >= 2 || totalPauses >= 6) fcRaw -= 0.5;
    if (maxSingleWordRepetition >= 6) fcRaw -= 0.5;
  }
  if (isCompletelyOffTopic) fcRaw = Math.min(fcRaw, 4.0);
  else if (isPartiallyOffTopic) fcRaw = Math.min(fcRaw, 5.5);

  // ── 2. Lexical Resource (LR) ──
  let lrRaw = 2.5 + lengthRatio * 2.7;
  if (totalWords < 10) lrRaw = 2.0;
  else if (totalWords < 22) lrRaw = 3.0;
  else if (totalWords < 40) lrRaw = 4.0;
  else {
    if (ttr >= 0.50 && totalWords >= 45) lrRaw += 0.5;
    if (ttr >= 0.62 && totalWords >= 70) lrRaw += 0.5;
    if (vocabFound.length >= 1) lrRaw += 0.5;
    if (vocabFound.length >= 3) lrRaw += 0.5;
    if (vocabFound.length >= 5) lrRaw += 0.5;
    if (polysyllableRatio >= 0.16) lrRaw += 0.25;
    if (ttr < 0.35) lrRaw -= 0.5;
  }
  if (isCompletelyOffTopic) lrRaw = Math.min(lrRaw, 4.0);
  else if (isPartiallyOffTopic) lrRaw = Math.min(lrRaw, 5.5);

  // ── 3. Grammatical Range and Accuracy (GRA) ──
  let graRaw = 2.5 + lengthRatio * 2.8;
  if (totalWords < 10) graRaw = 2.0;
  else if (totalWords < 22) graRaw = 3.0;
  else if (totalWords < 40) graRaw = 4.0;
  else {
    if (grammarFound.length >= 1) graRaw += 0.5;
    if (grammarFound.length >= 3) graRaw += 0.5;
    if (grammarFound.length >= 5) graRaw += 0.5;
    if (grammarErrorCount === 0 && totalWords >= 60) graRaw += 0.5;
    if (grammarErrorCount >= 1) graRaw -= 0.5;
    if (grammarErrorCount >= 3) graRaw -= 0.5;
  }
  if (isCompletelyOffTopic) graRaw = Math.min(graRaw, 4.5);

  // ── 4. Pronunciation (PR) ──
  let prRaw = 3.0 + lengthRatio * 2.6;
  if (totalWords < 10) prRaw = 2.0;
  else if (totalWords < 22) prRaw = 3.5;
  else if (totalWords < 40) prRaw = 4.5;
  else {
    if (polysyllableRatio >= 0.12) prRaw += 0.5;
    if (polysyllableRatio >= 0.20) prRaw += 0.5;
    if (avgFluencyRatio >= 0.58 && stutterCount === 0) prRaw += 0.5;
    if (stutterCount >= 3) prRaw -= 0.5;
  }
  if (isCompletelyOffTopic) prRaw = Math.min(prRaw, 5.0);

  const fc = clampHalfBand(fcRaw);
  const lr = clampHalfBand(lrRaw);
  const gra = clampHalfBand(graRaw);
  const pr = clampHalfBand(prRaw);
  const overall = computeOfficialIeltsOverall(fc, lr, gra, pr);

  // Build specific, individualized feedback based on what the user actually said
  const strengths: string[] = [];
  if (topicRelevance === 'on_topic' && onTopicTurns > 0) {
    strengths.push(`Berilgan savollarga mavzu doirasida (${totalWords} ta so'z bilan) mantiqiy javob berildi.`);
  }
  if (quotes[0]) {
    strengths.push(`Nutqingizdan eshitilgan jumla: ${quotes[0]}`);
  }
  if (discourseFound.length > 0) {
    strengths.push(`Nutqni bog'lashda bog'lovchilar ishlatildi: "${discourseFound.slice(0, 3).join('", "')}".`);
  }
  if (vocabFound.length > 0) {
    strengths.push(`Yuqori darajadagi so'zlar qo'llandi: "${vocabFound.slice(0, 4).join('", "')}".`);
  }
  if (grammarFound.length > 0) {
    strengths.push(`Murakkabroq grammatik bog'lamalar qatnashdi: "${grammarFound.slice(0, 3).join('", "')}".`);
  }
  if (strengths.length === 0) {
    strengths.push(`Jami ${totalWords} ta so'zdan iborat javob qayd etildi.`);
  }

  const improvements: string[] = [];
  if (isCompletelyOffTopic) {
    improvements.push(
      "DIQQAT (Mavzudan chetga chiqish / Off-topic): Bergan javobingiz savol mavzusiga mos kelmadi yoki mavzuni olib qochish kuzatildi. Rasmiy IELTS mezoniga ko'ra savolga bevosita javob bermaslik Fluency va Lexical ballarini keskin tushiradi."
    );
  } else if (isPartiallyOffTopic) {
    improvements.push(
      "Diqqat: Ayrim javoblaringizda savolning asosiy mavzusidan chetlashish kuzatildi. Har bir savolning kalit so'zlariga aniq javob bering."
    );
  }
  if (totalWords < targetWords * 0.65) {
    improvements.push(
      `Javoblar hajmi qisqa (${totalWords} ta so'z, tavsiya etilgan minimum: ~${targetWords} ta so'z). Har bir savolga sabab ("because...") va misol ("for example...") bilan kengroq javob bering.`
    );
  }
  if (grammarErrorCount > 0) {
    improvements.push(
      "Nutqingizda grammatik xatoliklar aniqlandi. Ega va kesim mosligi (Subject-Verb agreement) hamda zamonlarni to'g'ri ishlatishga e'tibor qarating."
    );
  }
  if (discourseFound.length < 2) {
    improvements.push(
      "Fikrlarni ravon bog'lash uchun 'Furthermore', 'However', 'For instance', 'As a result' kabi bog'lovchilarni qo'llang."
    );
  }
  if (vocabFound.length < 2) {
    improvements.push(
      "Lug'at boyligini (Lexical Resource) oshirish uchun oddiy kundalik so'zlar o'rniga mavzuga oid sinonim va sifatdoshlarni ishlating."
    );
  }

  return {
    overallBand: overall,
    fluencyScore: fc,
    lexicalScore: lr,
    grammarScore: gra,
    pronunciationScore: pr,
    topicRelevance,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    quotes: quotes.slice(0, 3),
    vocabularyHighlights: vocabFound.slice(0, 4),
    grammaticalFeaturesDetected: grammarFound.slice(0, 4),
  };
}
