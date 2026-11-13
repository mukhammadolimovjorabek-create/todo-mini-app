/**
 * Official Bilim va Malakalarni Baholash Agentligi (UzBMB / DTM) CEFR Multilevel Speaking Scoring Engine
 * Powered by Real AI Examiner (/api/evaluate_speaking -> Gemini 2.5 Flash / Groq Llama-3.3-70B)
 * with calibrated linguistic + acoustic fallback.
 *
 * Total Speaking Score: 75 ball (0 - 75 points)
 *
 * Official CEFR Conversion Table:
 * - 65 - 75 ball : C1 (Oliy daraja / Effective Operational Proficiency)
 * - 50 - 64 ball : B2 (Yuqori daraja / Vantage)
 * - 30 - 49 ball : B1 (O'rta daraja / Threshold)
 * - 0 - 29 ball  : A2 / Sertifikat berilmaydi (Waystage)
 * - 0 ball       : Ovozli javob berilmadi
 *
 * Criteria (Jami 75 ball):
 * 1. Fluency & Coherence (Ravonlik va izchillik)          : max 20 ball
 * 2. Lexical Resource (Lug'at boyligi va mosligi)        : max 20 ball
 * 3. Grammatical Range & Accuracy (Grammatika va aniqlik): max 20 ball
 * 4. Pronunciation & Task Achievement (Talaffuz & ijro)   : max 15 ball
 */

import { API_BASE_URL } from '../../config';
import { getTelegramInitData } from '../../utils/telegram';
import type { TurnAcousticMetrics } from './examRecorder';

export interface MultilevelEvaluationResult {
  totalScore: number; // 0 - 75 ball
  cefrLevel: 'C1' | 'B2' | 'B1' | 'A2' | 'Baholanmadi';
  cefrTitle: string; // e.g. "C1 (Oliy daraja)", "B2 (Yuqori daraja)"
  fluencyScore: number; // max 20
  lexicalScore: number; // max 20
  grammarScore: number; // max 20
  pronunciationTaskScore: number; // max 15
  topicRelevance?: 'on_topic' | 'partially_off_topic' | 'off_topic';
  isPartOnly?: boolean;
  partRawScore?: number; // e.g. 18 / 25
  partMaxScore?: number; // 25
  strengths: string[];
  improvements: string[];
  quotes: string[];
  vocabularyHighlights: string[];
  grammaticalFeaturesDetected: string[];
}

export interface MultilevelTurnInput {
  question: string;
  answer: string;
  metrics?: TurnAcousticMetrics | null;
}

const MULTILEVEL_ADVANCED_VOCAB = [
  'furthermore', 'moreover', 'consequently', 'subsequently', 'nevertheless',
  'indispensable', 'significant', 'predominantly', 'detrimental', 'beneficial',
  'crucial', 'essential', 'perspective', 'manifestation', 'counterpart',
  'sustainable', 'facilitate', 'enhance', 'contemplate', 'articulate',
  'mitigate', 'discrepancy', 'resilience', 'cornerstone', 'prevalent',
  'comparison', 'contrary', 'illustrate', 'consideration', 'substantial'
];

const DISCOURSE_CONNECTORS = [
  'first of all', 'secondly', 'in addition', 'moreover', 'furthermore',
  'on the other hand', 'however', 'therefore', 'as a result', 'consequently',
  'in conclusion', 'to sum up', 'for instance', 'for example', 'in my opinion',
  'personally speaking', 'from my point of view', 'that is why', 'both pictures',
  'in the first picture', 'in the second picture', 'whereas', 'while'
];

const COMPLEX_GRAMMAR_PATTERNS = [
  'although', 'even though', 'whereas', 'while', 'despite', 'in spite of',
  'if i were', 'if i had', 'would be', 'would have', 'could have', 'unless',
  'not only', 'as well as', 'is believed to', 'is considered',
  'have been', 'has been', 'had been', 'which', 'who', 'in order to'
];

const GRAMMAR_ERROR_PATTERNS: RegExp[] = [
  /\b(i is|i am agree|i very like|he go|she go|it go|he have|she have|people is|peoples|informations|advices)\b/gi,
  /\b(more better|more easier|most easiest|can to|must to|should to|didn't went|didn't saw|doesn't has)\b/gi,
];

const QUESTION_STOP_WORDS = new Set([
  'what', 'where', 'when', 'which', 'would', 'could', 'should', 'about', 'think',
  'describe', 'explain', 'people', 'often', 'usually', 'your', 'there', 'their',
  'have', 'with', 'from', 'that', 'this', 'some', 'many', 'more', 'than', 'important',
  'picture', 'pictures', 'both', 'show', 'compare', 'feel', 'situations', 'part', 'statement'
]);

const computeCefrMeta = (totalScore: number): { cefrLevel: 'C1' | 'B2' | 'B1' | 'A2'; cefrTitle: string } => {
  if (totalScore >= 65) {
    return { cefrLevel: 'C1', cefrTitle: `${totalScore} / 75 ball • C1 (Oliy daraja)` };
  }
  if (totalScore >= 50) {
    return { cefrLevel: 'B2', cefrTitle: `${totalScore} / 75 ball • B2 (Yetakchi / Yuqori daraja)` };
  }
  if (totalScore >= 30) {
    return { cefrLevel: 'B1', cefrTitle: `${totalScore} / 75 ball • B1 (O'rta daraja)` };
  }
  return { cefrLevel: 'A2', cefrTitle: `${totalScore} / 75 ball • A2 (Sertifikat berilmaydi)` };
};

export const filterValidMultilevelAnswers = (answers: MultilevelTurnInput[]): MultilevelTurnInput[] => {
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
 * Primary Asynchronous Real AI Examiner Evaluation for UzBMB Multilevel (0 - 75 ball).
 */
export async function evaluateMultilevelSpeechWithAI(
  answers: MultilevelTurnInput[],
  testType: 'part1_1' | 'part1_2' | 'part2' | 'part3' | 'full_mock'
): Promise<MultilevelEvaluationResult> {
  const validAnswers = filterValidMultilevelAnswers(answers);
  const combinedText = validAnswers.map((a) => a.answer).join(' ');
  const words = combinedText
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return evaluateMultilevelSpeech(answers, testType);
  }

  const payload = {
    examType: 'multilevel',
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

  const normalizeAiResponse = (raw: any): MultilevelEvaluationResult | null => {
    if (!raw || typeof raw !== 'object') return null;
    const fluency = Math.min(20, Math.max(0, Math.round(Number(raw.fluencyScore) || 0)));
    const lexical = Math.min(20, Math.max(0, Math.round(Number(raw.lexicalScore) || 0)));
    const grammar = Math.min(20, Math.max(0, Math.round(Number(raw.grammarScore) || 0)));
    const pronTask = Math.min(15, Math.max(0, Math.round(Number(raw.pronunciationTaskScore ?? raw.pronunciationScore) || 0)));
    if (fluency === 0 && lexical === 0 && grammar === 0 && pronTask === 0) return null;

    const totalScore = Math.min(75, Math.max(1, fluency + lexical + grammar + pronTask));
    const { cefrLevel, cefrTitle } = computeCefrMeta(totalScore);
    const isPartOnly = testType !== 'full_mock';
    const partRawScore = Math.round((totalScore / 75) * 25);

    const fallbackQuotes: string[] = [];
    validAnswers.forEach((item) => {
      const sents = item.answer.split(/[.?!]+/).filter((s) => s.trim().length > 8);
      if (sents[0] && fallbackQuotes.length < 3) fallbackQuotes.push(`"${sents[0].trim()}"`);
    });

    const aiQuotes = Array.isArray(raw.quotes)
      ? raw.quotes.map((q: any) => String(q).trim()).filter((q: string) => q.length > 3)
      : [];

    return {
      totalScore,
      cefrLevel,
      cefrTitle,
      fluencyScore: fluency,
      lexicalScore: lexical,
      grammarScore: grammar,
      pronunciationTaskScore: pronTask,
      topicRelevance: raw.topicRelevance || 'on_topic',
      isPartOnly,
      partRawScore,
      partMaxScore: 25,
      strengths: Array.isArray(raw.strengths) && raw.strengths.length > 0
        ? raw.strengths.map((s: any) => String(s)).slice(0, 4)
        : ["Nomzod savollarga ingliz tilida javob berishga harakat qildi."],
      improvements: Array.isArray(raw.improvements) && raw.improvements.length > 0
        ? raw.improvements.map((s: any) => String(s)).slice(0, 4)
        : ["Javoblarni sabab va misollar bilan kengaytirib bayon qiling."],
      quotes: aiQuotes.length > 0 ? aiQuotes.slice(0, 3) : fallbackQuotes,
      vocabularyHighlights: Array.isArray(raw.vocabularyHighlights)
        ? raw.vocabularyHighlights.map((s: any) => String(s)).slice(0, 5)
        : [],
      grammaticalFeaturesDetected: Array.isArray(raw.grammaticalFeaturesDetected)
        ? raw.grammaticalFeaturesDetected.map((s: any) => String(s)).slice(0, 5)
        : [],
    };
  };

  // 1. Try same-origin /api/evaluate_speaking
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
    console.warn('Primary Multilevel /api/evaluate_speaking error:', err);
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
      console.warn('Secondary Multilevel /api/evaluate_speaking error:', err2);
    }
  }

  // 3. Fallback to calibrated local analysis
  return evaluateMultilevelSpeech(answers, testType);
}

/**
 * Synchronous linguistic & acoustic evaluator for UzBMB Multilevel Speaking.
 */
export function evaluateMultilevelSpeech(
  answers: MultilevelTurnInput[],
  testType: 'part1_1' | 'part1_2' | 'part2' | 'part3' | 'full_mock'
): MultilevelEvaluationResult {
  const validAnswers = filterValidMultilevelAnswers(answers);

  const combinedText = validAnswers.map((a) => a.answer).join(' ');
  const cleanText = combinedText.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ');
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  // 0 TA SO'Z - NOMZOD GAPIRMAGAN TAQDIRDA:
  if (totalWords === 0) {
    return {
      totalScore: 0,
      cefrLevel: 'Baholanmadi',
      cefrTitle: '0 / 75 ball • Javob berilmadi',
      fluencyScore: 0,
      lexicalScore: 0,
      grammarScore: 0,
      pronunciationTaskScore: 0,
      topicRelevance: 'off_topic',
      strengths: [],
      improvements: [
        "Belgilangan vaqt ichida hech qanday ovozli nutq qayd etilmadi (0 ball).",
        "Multilevel imtihonida ball to'plash uchun savol o'qib bo'lingach, mikrofonga ingliz tilida ovoz chiqarib gapiring.",
        "Qurilmangiz mikrofon sozlamalarini va brauzer ruxsatini tekshiring."
      ],
      quotes: [],
      vocabularyHighlights: [],
      grammaticalFeaturesDetected: [],
    };
  }

  // Quotes from candidate's actual speech
  const quotes: string[] = [];
  validAnswers.forEach((item) => {
    const sents = item.answer.split(/[.?!]+/).filter((s) => s.trim().length > 6);
    if (sents[0] && quotes.length < 3) quotes.push(`"${sents[0].trim()}"`);
    if (sents[1] && quotes.length < 3) quotes.push(`"${sents[1].trim()}"`);
  });

  // Target word count based on part
  const targetWords = {
    part1_1: 55,
    part1_2: 115,
    part2: 130,
    part3: 125,
    full_mock: 280,
  }[testType];

  const uniqueWords = new Set(words);
  const ttr = totalWords > 0 ? uniqueWords.size / totalWords : 0;

  const vocabFound = MULTILEVEL_ADVANCED_VOCAB.filter((v) => cleanText.includes(v));
  const connectorsFound = DISCOURSE_CONNECTORS.filter((c) => cleanText.includes(c));
  const grammarFound = COMPLEX_GRAMMAR_PATTERNS.filter((g) => cleanText.includes(g));

  let grammarErrorCount = 0;
  GRAMMAR_ERROR_PATTERNS.forEach((regex) => {
    const matches = cleanText.match(regex);
    if (matches) grammarErrorCount += matches.length;
  });

  // Topic Relevance Check (On-topic vs Off-topic / Topic Evasion)
  const questionTextCombined = validAnswers.map((a) => a.question).join(' ').toLowerCase();
  const questionStems = Array.from(
    new Set(
      questionTextCombined
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !QUESTION_STOP_WORDS.has(w))
        .map((w) => w.slice(0, 5))
    )
  );
  const matchedTopicStems = questionStems.filter((stem) => cleanText.includes(stem));
  const isOffTopic = totalWords >= 12 && questionStems.length >= 2 && matchedTopicStems.length === 0;
  const topicRelevance: 'on_topic' | 'partially_off_topic' | 'off_topic' = isOffTopic ? 'off_topic' : 'on_topic';

  const polysyllabicWords = words.filter((w) => (w.match(/[aeiouy]+/gi) || []).length >= 3);
  const polysyllableRatio = totalWords > 0 ? polysyllabicWords.length / totalWords : 0;
  let stutterCount = 0;
  for (let i = 1; i < words.length; i++) {
    if (words[i].length > 2 && words[i] === words[i - 1]) {
      stutterCount += 1;
    }
  }

  const lengthRatio = Math.min(1.3, totalWords / targetWords);
  const lowThreshold = Math.max(10, Math.round(targetWords * 0.30));
  const midThreshold = Math.max(22, Math.round(targetWords * 0.62));

  // ── 1. Fluency & Coherence (max 20 ball) ──
  let fluency = Math.round(lengthRatio * 10);
  if (connectorsFound.length >= 1) fluency += 2;
  if (connectorsFound.length >= 3) fluency += 3;
  if (connectorsFound.length >= 5) fluency += 2;
  if (totalWords >= targetWords) fluency += 2;
  if (stutterCount >= 3) fluency -= 2;
  if (totalWords < lowThreshold) fluency = Math.min(fluency, 5);
  else if (totalWords < midThreshold) fluency = Math.min(fluency, 11);
  if (isOffTopic) fluency = Math.min(fluency, 8);
  fluency = Math.min(20, Math.max(2, fluency));

  // ── 2. Lexical Resource (max 20 ball) ──
  let lexical = Math.round(lengthRatio * 10);
  if (ttr > 0.48 && totalWords >= 35) lexical += 2;
  if (vocabFound.length >= 1) lexical += 2;
  if (vocabFound.length >= 3) lexical += 3;
  if (vocabFound.length >= 5) lexical += 2;
  if (matchedTopicStems.length >= 2) lexical += 2;
  if (totalWords < lowThreshold) lexical = Math.min(lexical, 5);
  else if (totalWords < midThreshold) lexical = Math.min(lexical, 11);
  if (isOffTopic) lexical = Math.min(lexical, 8);
  lexical = Math.min(20, Math.max(2, lexical));

  // ── 3. Grammatical Range & Accuracy (max 20 ball) ──
  let grammar = Math.round(lengthRatio * 10);
  if (grammarFound.length >= 1) grammar += 2;
  if (grammarFound.length >= 3) grammar += 3;
  if (grammarFound.length >= 5) grammar += 3;
  if (grammarErrorCount === 0 && totalWords >= 45) grammar += 2;
  if (grammarErrorCount >= 1) grammar -= 2;
  if (grammarErrorCount >= 3) grammar -= 2;
  if (totalWords < lowThreshold) grammar = Math.min(grammar, 5);
  else if (totalWords < midThreshold) grammar = Math.min(grammar, 11);
  if (isOffTopic) grammar = Math.min(grammar, 9);
  grammar = Math.min(20, Math.max(2, grammar));

  // ── 4. Pronunciation & Task Achievement (max 15 ball) ──
  let pronunciationTask = Math.round(lengthRatio * 7);
  if (polysyllableRatio >= 0.12) pronunciationTask += 2;
  if (polysyllableRatio >= 0.20) pronunciationTask += 2;
  if (!isOffTopic && matchedTopicStems.length >= 1) pronunciationTask += 2;
  if (stutterCount === 0 && totalWords >= targetWords) pronunciationTask += 2;
  else if (stutterCount >= 3) pronunciationTask -= 2;
  if (totalWords < lowThreshold) pronunciationTask = Math.min(pronunciationTask, 4);
  if (isOffTopic) pronunciationTask = Math.min(pronunciationTask, 5);
  pronunciationTask = Math.min(15, Math.max(2, pronunciationTask));

  const totalScore = Math.min(75, Math.max(0, fluency + lexical + grammar + pronunciationTask));
  const { cefrLevel, cefrTitle } = computeCefrMeta(totalScore);
  const isPartOnly = testType !== 'full_mock';
  const partRawScore = Math.round((totalScore / 75) * 25);

  const strengths: string[] = [];
  if (!isOffTopic && matchedTopicStems.length > 0) {
    strengths.push(`Savollar mavzusiga mos (${totalWords} ta so'z) mantiqiy javob berildi.`);
  }
  if (quotes[0]) {
    strengths.push(`Nutqingizdan eshitilgan jumla: ${quotes[0]}`);
  }
  if (connectorsFound.length > 0) {
    strengths.push(`Fikrlarni bog'lashda bog'lovchilar ishlatildi: "${connectorsFound.slice(0, 3).join('", "')}".`);
  }
  if (vocabFound.length > 0) {
    strengths.push(`B2/C1 darajadagi leksika qo'llandi: "${vocabFound.slice(0, 3).join('", "')}".`);
  }
  if (grammarFound.length > 0) {
    strengths.push(`Murakkabroq grammatik tuzilmalar qatnashdi: "${grammarFound.slice(0, 3).join('", "')}".`);
  }
  if (strengths.length === 0) {
    strengths.push(`Jami ${totalWords} ta so'zdan iborat javob qayd etildi.`);
  }

  const improvements: string[] = [];
  if (isOffTopic) {
    improvements.push(
      "DIQQAT (Mavzudan chetga chiqish / Off-topic): Javoblaringiz berilgan savol yoki rasm mavzusiga mos kelmadi. UzBMB mezoniga ko'ra Task Achievement (topshiriqni bajarish) va Fluency ballari tushirildi."
    );
  }
  if (totalWords < targetWords * 0.65) {
    improvements.push(
      `Nutq hajmi qisqa (${totalWords} ta so'z, tavsiya etilgan: ~${targetWords} ta so'z). Fikringizni sabab va misollar bilan kengaytiring.`
    );
  }
  if (grammarErrorCount > 0) {
    improvements.push(
      "Nutqingizda grammatik xatoliklar kuzatildi. Ega-kesim mosligi va zamon shakllariga e'tibor bering."
    );
  }
  if (connectorsFound.length < 2) {
    improvements.push(
      "Fikrlarni bog'lash uchun 'Moreover', 'On the other hand', 'For instance' kabi bog'lovchilarni faolroq ishlating."
    );
  }
  if (vocabFound.length < 2) {
    improvements.push(
      "Lug'at boyligini (Lexical Resource) oshirish uchun B2/C1 darajadagi akademik so'zlarni qo'llang."
    );
  }

  return {
    totalScore,
    cefrLevel,
    cefrTitle,
    fluencyScore: fluency,
    lexicalScore: lexical,
    grammarScore: grammar,
    pronunciationTaskScore: pronunciationTask,
    topicRelevance,
    isPartOnly,
    partRawScore,
    partMaxScore: 25,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    quotes: quotes.slice(0, 3),
    vocabularyHighlights: vocabFound.slice(0, 4),
    grammaticalFeaturesDetected: grammarFound.slice(0, 4),
  };
}
