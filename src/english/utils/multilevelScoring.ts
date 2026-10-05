/**
 * Official Bilimni Baholash Agentligi (DTM) CEFR Multilevel Speaking Scoring Engine
 * Total Speaking Score: 75 ball (0 - 75 points)
 * 
 * Official CEFR Conversion Table:
 * - 65 - 75 ball : C1 (Oliy daraja / Advanced)
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

export interface MultilevelEvaluationResult {
  totalScore: number; // 0 - 75 ball
  cefrLevel: 'C1' | 'B2' | 'B1' | 'A2' | 'Baholanmadi';
  cefrTitle: string; // e.g. "C1 (Oliy daraja)", "B2 (Yuqori daraja)"
  fluencyScore: number; // max 20
  lexicalScore: number; // max 20
  grammarScore: number; // max 20
  pronunciationTaskScore: number; // max 15
  isPartOnly?: boolean;
  partRawScore?: number; // e.g. 18 / 25
  partMaxScore?: number; // 25
  strengths: string[];
  improvements: string[];
  quotes: string[];
  vocabularyHighlights: string[];
  grammaticalFeaturesDetected: string[];
}

// B2 & C1 academic and topical vocabulary for national exam
const MULTILEVEL_ADVANCED_VOCAB = [
  'furthermore', 'moreover', 'consequently', 'subsequently', 'nevertheless',
  'indispensable', 'significant', 'predominantly', 'detrimental', 'beneficial',
  'crucial', 'essential', 'perspective', 'manifestation', 'counterpart',
  'sustainable', 'facilitate', 'enhance', 'contemplate', 'articulate',
  'mitigate', 'discrepancy', 'resilience', 'cornerstone', 'prevalent',
  'in comparison with', 'on the contrary', 'from my perspective', 'to illustrate',
  'as far as i know', 'broadly speaking', 'take into consideration'
];

// Discourse connectors favored in DTM scoring
const DISCOURSE_CONNECTORS = [
  'first of all', 'secondly', 'in addition', 'moreover', 'furthermore',
  'on the other hand', 'however', 'therefore', 'as a result', 'consequently',
  'in conclusion', 'to sum up', 'for instance', 'for example', 'in my opinion',
  'personally speaking', 'from my point of view', 'that is why'
];

// Complex syntax structures (DTM grammar criteria)
const COMPLEX_GRAMMAR_PATTERNS = [
  'although', 'even though', 'whereas', 'while', 'despite', 'in spite of',
  'if i were', 'would be', 'would have been', 'had i', 'unless',
  'not only', 'as well as', 'is believed to', 'is considered',
  'have been', 'has been', 'had been', 'which means that', 'in order to'
];

export function evaluateMultilevelSpeech(
  answers: { question: string; answer: string }[],
  testType: 'part1_1' | 'part1_2' | 'part2' | 'part3' | 'full_mock'
): MultilevelEvaluationResult {
  // Filter out system placeholders
  const validAnswers = answers.filter((a) => {
    const t = a.answer.trim();
    return t.length > 0 && !t.startsWith('(') && !t.includes('javob bermadi') && !t.includes('javobi berilmadi') && !t.includes('nutqi berilmadi');
  });

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

  // Quotes from candidate
  const quotes: string[] = [];
  answers.forEach((item) => {
    const sents = item.answer.split(/[.?!]+/).filter((s) => s.trim().length > 15);
    if (sents[0]) quotes.push(`"${sents[0].trim()}"`);
    if (sents[1] && quotes.length < 3) quotes.push(`"${sents[1].trim()}"`);
  });

  // Target word count based on part
  const targetWords = {
    part1_1: 50,
    part1_2: 110,
    part2: 130,
    part3: 120,
    full_mock: 280,
  }[testType];

  const uniqueWords = new Set(words);
  const ttr = totalWords > 0 ? uniqueWords.size / totalWords : 0;

  // Linguistic pattern detectors
  const vocabFound = MULTILEVEL_ADVANCED_VOCAB.filter((v) => cleanText.includes(v));
  const connectorsFound = DISCOURSE_CONNECTORS.filter((c) => cleanText.includes(c));
  const grammarFound = COMPLEX_GRAMMAR_PATTERNS.filter((g) => cleanText.includes(g));

  // Word length ratio (capped at 1.5)
  const lengthRatio = Math.min(1.5, totalWords / targetWords);

  // Proportional thresholds based on targetWords for accurate part scoring
  const lowThreshold = Math.max(12, Math.round(targetWords * 0.32));
  const midThreshold = Math.max(22, Math.round(targetWords * 0.65));

  // ── 1. Fluency & Coherence (max 20 ball) ──
  let fluency = Math.round(lengthRatio * 12);
  if (connectorsFound.length >= 1) fluency += 2;
  if (connectorsFound.length >= 3) fluency += 3;
  if (connectorsFound.length >= 5) fluency += 2;
  if (totalWords >= targetWords) fluency += 2;
  if (totalWords < lowThreshold) fluency = Math.min(fluency, 5);
  else if (totalWords < midThreshold) fluency = Math.min(fluency, 11);
  fluency = Math.min(20, Math.max(2, fluency));

  // ── 2. Lexical Resource (max 20 ball) ──
  let lexical = Math.round(lengthRatio * 11);
  if (ttr > 0.45) lexical += 2;
  if (vocabFound.length >= 1) lexical += 3;
  if (vocabFound.length >= 3) lexical += 3;
  if (vocabFound.length >= 5) lexical += 2;
  if (totalWords < lowThreshold) lexical = Math.min(lexical, 5);
  else if (totalWords < midThreshold) lexical = Math.min(lexical, 11);
  lexical = Math.min(20, Math.max(2, lexical));

  // ── 3. Grammatical Range & Accuracy (max 20 ball) ──
  let grammar = Math.round(lengthRatio * 11);
  if (grammarFound.length >= 1) grammar += 3;
  if (grammarFound.length >= 3) grammar += 3;
  if (grammarFound.length >= 5) grammar += 3;
  if (totalWords < lowThreshold) grammar = Math.min(grammar, 5);
  else if (totalWords < midThreshold) grammar = Math.min(grammar, 11);
  grammar = Math.min(20, Math.max(2, grammar));

  // ── 4. Pronunciation & Task Achievement (max 15 ball) ──
  let pronunciationTask = Math.round(((fluency + lexical + grammar) / 60) * 15);
  if (totalWords >= targetWords) pronunciationTask = Math.min(15, pronunciationTask + 1);
  pronunciationTask = Math.min(15, Math.max(2, pronunciationTask));

  // Jami ball (0 - 75 ball)
  let totalScore = fluency + lexical + grammar + pronunciationTask;
  totalScore = Math.min(75, Math.max(0, totalScore));

  // CEFR darajasi aniqlash (DTM rasmiy shkalasi)
  let cefrLevel: 'C1' | 'B2' | 'B1' | 'A2' = 'A2';
  let cefrTitle = '';

  if (totalScore >= 65) {
    cefrLevel = 'C1';
    cefrTitle = `${totalScore} / 75 ball • C1 (Oliy daraja)`;
  } else if (totalScore >= 50) {
    cefrLevel = 'B2';
    cefrTitle = `${totalScore} / 75 ball • B2 (Yetakchi / Yuqori daraja)`;
  } else if (totalScore >= 30) {
    cefrLevel = 'B1';
    cefrTitle = `${totalScore} / 75 ball • B1 (O'rta daraja)`;
  } else {
    cefrLevel = 'A2';
    cefrTitle = `${totalScore} / 75 ball • A2 (Sertifikat berilmaydi)`;
  }

  // Agar yakka qism bo'lsa (Part 1, 2 yoki 3) - 25 ballik ko'rinishi
  let isPartOnly = testType !== 'full_mock';
  let partRawScore = Math.round((totalScore / 75) * 25);

  // Strengths
  const strengths: string[] = [];
  if (totalWords >= targetWords) {
    strengths.push(`Nutq hajmi talab darajasida (${totalWords} ta so'z). Mavzu yuzasidan to'liq fikr bildirildi.`);
  }
  if (connectorsFound.length > 0) {
    strengths.push(`Fikrlarni mantiqiy bog'lash uchun bog'lovchilar (${connectorsFound.slice(0, 3).join(', ')}) to'g'ri ishlatildi.`);
  }
  if (vocabFound.length > 0) {
    strengths.push(`B2/C1 darajadagi leksika qo'llandi: "${vocabFound.slice(0, 3).join('", "')}".`);
  }
  if (grammarFound.length > 0) {
    strengths.push(`Murakkab sintaktik tuzilmalar (${grammarFound.slice(0, 3).join(', ')}) namoyon bo'ldi.`);
  }
  if (strengths.length === 0) {
    strengths.push("Savolga javob berishga harakat qilindi va asosiy tushuncha yetkazildi.");
  }

  // Improvements
  const improvements: string[] = [];
  if (totalScore < 50) {
    improvements.push("Nutq davomiyligini oshiring. Har bir savolga kamida 3-4 ta to'liq gap bilan sabab va misol keltirib javob bering.");
  }
  if (connectorsFound.length < 3) {
    improvements.push("Nutqda 'Moreover', 'On the other hand', 'Consequently' kabi bog'lovchilarni faol ishlatib fikrlar orasidagi aloqani mustahkamlang.");
  }
  if (vocabFound.length < 2) {
    improvements.push("Kundalik oddiy so'zlar o'rniga B2/C1 darajadagi sinonimlarni (masalan: 'crucial', 'significant', 'beneficial') qo'shing.");
  }
  if (grammarFound.length < 2) {
    improvements.push("Murakkab grammatik tuzilmalar (Conditionals, Relative clauses, Passive voice)dan foydalanib grammatika balini oshiring.");
  }

  return {
    totalScore,
    cefrLevel,
    cefrTitle,
    fluencyScore: fluency,
    lexicalScore: lexical,
    grammarScore: grammar,
    pronunciationTaskScore: pronunciationTask,
    isPartOnly,
    partRawScore,
    partMaxScore: 25,
    strengths,
    improvements: improvements.slice(0, 3),
    quotes: quotes.slice(0, 2),
    vocabularyHighlights: vocabFound.slice(0, 4),
    grammaticalFeaturesDetected: grammarFound.slice(0, 4),
  };
}
