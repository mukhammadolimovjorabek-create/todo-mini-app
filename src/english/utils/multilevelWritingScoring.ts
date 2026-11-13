export interface MultilevelWritingEvaluation {
  totalScore: number;
  cefrLevel: string;
  cefrTitle: string;
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  wordCount: number;
  strengths: string[];
  improvements: string[];
  recommendedVocabulary: { word: string; meaning: string; example: string }[];
  isOffTopic?: boolean;
  weakSkillTag?: 'task' | 'coherence' | 'lexical' | 'grammar';
  sentenceCorrections?: { original: string; corrected: string; reasonUz: string }[];
  rewrittenSample?: string;
  detectedAcademicWords?: string[];
  isAiEvaluated?: boolean;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'they', 'would',
  'about', 'there', 'which', 'their', 'what', 'your', 'will', 'some', 'more',
  'into', 'could', 'other', 'than', 'then', 'them', 'these', 'only', 'also',
  'when', 'very', 'just', 'many', 'such', 'should', 'because', 'people',
]);

const CONNECTORS = [
  'furthermore', 'moreover', 'however', 'nevertheless', 'consequently', 'therefore',
  'on the other hand', 'in addition', 'in conclusion', 'to sum up', 'overall',
  'firstly', 'secondly', 'finally', 'although', 'despite', 'whereas', 'meanwhile',
];

const ACADEMIC_WORDS = [
  'significant', 'substantial', 'crucial', 'indispensable', 'predominantly', 'mitigate',
  'alleviate', 'exacerbate', 'implement', 'initiative', 'curriculum', 'sustainable',
  'infrastructure', 'beneficial', 'detrimental', 'contribute', 'perspective', 'phenomenon',
  'comprehensive', 'efficient', 'consequence', 'acknowledge', 'demonstrate', 'fluctuate',
];

export const evaluateMultilevelWritingLocal = (
  essayText: string,
  activeTab: 'task1' | 'task2',
  subTask1Mode: 'task1_1' | 'task1_2',
  promptText = ''
): MultilevelWritingEvaluation => {
  const trimmed = essayText.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const minWordsRequired = activeTab === 'task1' ? (subTask1Mode === 'task1_1' ? 50 : 120) : 180;

  if (wordCount === 0) {
    return {
      totalScore: 0,
      cefrLevel: 'Baholanmadi',
      cefrTitle: '0 / 75 ball • Matn kiritilmadi',
      taskResponse: 0,
      coherenceCohesion: 0,
      lexicalResource: 0,
      grammaticalRange: 0,
      wordCount: 0,
      strengths: [],
      improvements: [
        "Belgilangan vaqt ichida hech qanday matn yozilmadi (0 ball).",
        `Multilevel Writing ${activeTab === 'task1' ? 'Task 1' : 'Task 2'} uchun kamida ${minWordsRequired} ta so'z yozish talab etiladi.`,
      ],
      recommendedVocabulary: [],
      weakSkillTag: 'task',
      isAiEvaluated: false,
    };
  }

  const lower = trimmed.toLowerCase();
  const paragraphs = trimmed.split(/\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 2);

  // Off-topic stem check against prompt keywords
  const promptStems = Array.from(
    new Set(
      promptText
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
        .map((w) => w.slice(0, 5))
    )
  );
  const matchedStems = promptStems.filter((stem) => lower.includes(stem));
  const isOffTopic = promptStems.length >= 3 && matchedStems.length === 0 && wordCount >= 20;

  // Register check
  const hasProperRegister =
    activeTab === 'task1'
      ? subTask1Mode === 'task1_1'
        ? /(hi|hello|dear)\b/i.test(trimmed) && /(best|wishes|see you|take care|love|regards|soon)/i.test(trimmed)
        : /dear\s+(sir|madam|manager|editor|mr|ms)/i.test(trimmed) && /(yours sincerely|yours faithfully|i look forward|regards)/i.test(trimmed)
      : /(in conclusion|to sum up|to conclude|overall|all in all)/i.test(trimmed);

  const foundConnectors = CONNECTORS.filter((c) => lower.includes(c));
  const foundAcademic = ACADEMIC_WORDS.filter((w) => lower.includes(w));
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean));
  const ttr = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  // 1. Task Response (0-20)
  let taskScore = Math.round((Math.min(1.05, wordCount / minWordsRequired)) * 14);
  if (hasProperRegister) taskScore += 3;
  if (matchedStems.length >= 2) taskScore += 2;
  if (isOffTopic) taskScore = Math.min(taskScore, 7);
  taskScore = Math.min(20, Math.max(2, taskScore));

  // 2. Coherence & Cohesion (0-20)
  let cohesionScore = 6 + Math.min(6, foundConnectors.length * 2) + (paragraphCount >= 3 ? 4 : paragraphCount >= 2 ? 2 : 0);
  if (wordCount < minWordsRequired * 0.5) cohesionScore = Math.min(cohesionScore, 8);
  cohesionScore = Math.min(20, Math.max(2, cohesionScore));

  // 3. Lexical Resource (0-20)
  let lexicalScore = 7 + Math.min(6, foundAcademic.length * 2) + (ttr >= 0.55 ? 4 : ttr >= 0.42 ? 2 : 0);
  if (wordCount < minWordsRequired * 0.5) lexicalScore = Math.min(lexicalScore, 8);
  lexicalScore = Math.min(20, Math.max(2, lexicalScore));

  // 4. Grammatical Range & Accuracy (0-15)
  const complexMarkers = (lower.match(/\b(although|whereas|because|which|whose|if|unless|despite|having|been)\b/g) || []).length;
  let grammarScore = 6 + Math.min(5, complexMarkers) + (sentences.length >= 4 ? 2 : 0);
  if (wordCount < minWordsRequired * 0.5) grammarScore = Math.min(grammarScore, 7);
  grammarScore = Math.min(15, Math.max(2, grammarScore));

  const totalScore = Math.min(75, Math.max(0, taskScore + cohesionScore + lexicalScore + grammarScore));

  let cefr = "A2 (Sertifikat berilmaydi)";
  if (totalScore >= 65) cefr = "C1 (Oliy daraja)";
  else if (totalScore >= 50) cefr = "B2 (Yetakchi / Yuqori daraja)";
  else if (totalScore >= 30) cefr = "B1 (O'rta daraja)";
  const cefrTitle = `${totalScore} / 75 ball • ${cefr}`;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (isOffTopic) {
    improvements.push("Diqqat: Matningiz berilgan topshiriq mavzusidan chetga chiqqan (Off-topic). Mavzu kalit so'zlariga bevosita javob bering.");
  } else if (matchedStems.length > 0) {
    strengths.push("Matn berilgan vaziyat/mavzu talablariga bevosita mos (On-topic).");
  }

  if (wordCount >= minWordsRequired) {
    strengths.push(`Belgilangan hajm me'yori to'liq bajarildi (${wordCount} / ${minWordsRequired}+ so'z).`);
  } else {
    improvements.push(`So'zlar sonini kamida ${minWordsRequired} taga yetkazing (hozir ${wordCount} ta so'z).`);
  }

  if (hasProperRegister) {
    strengths.push(
      activeTab === 'task1'
        ? `${subTask1Mode === 'task1_1' ? 'Norasmiy (Informal)' : 'Rasmiy (Formal)'} xat uslubi to'g'ri qo'llangan.`
        : "Inshoda muallif pozitsiyasi va yakuniy xulosa (Conclusion) aniq ifodalangan."
    );
  } else {
    improvements.push(
      activeTab === 'task1'
        ? subTask1Mode === 'task1_1'
          ? "Do'stga xatda samimiy salomlashish ('Hi ...') va xayrlashish ('Best wishes / See you soon') qismlarini kiriting."
          : "Rasmiy xatda 'Dear Sir/Madam', 'I am writing to...' va yakunda 'Yours sincerely/faithfully' iboralarini ishlating."
        : "Insho yakunida 'In conclusion...' yoki 'To sum up...' orqali umumiy xulosa chiqaring."
    );
  }

  if (foundConnectors.length > 0) {
    strengths.push(`Bog'lovchi vositalar (${foundConnectors.slice(0, 3).join(', ')}) to'g'ri qo'llanildi.`);
  } else {
    improvements.push("Paragraflar orasida 'Furthermore', 'Consequently', 'On the other hand' kabi bog'lovchilarni ishlating.");
  }

  if (foundAcademic.length >= 2) {
    strengths.push(`B2/C1 darajasidagi leksika aniqlandi: ${foundAcademic.slice(0, 4).join(', ')}.`);
  } else {
    improvements.push("Oddiy so'zlar o'rniga B2/C1 akademik va mavzuviy lug'at boyligini qo'shing.");
  }

  if (paragraphCount < 3) {
    improvements.push(`Matnni kamida 3-4 ta alohida xatboshiga (Paragraph) ajratib yozing (hozir ${paragraphCount} ta).`);
  }

  improvements.push("Eslatma: Server bilan bog'lanish imkoni bo'lmagani uchun oflayn dastlabki tekshiruv ishladi — internet bilan qayta tekshirtirsangiz AI har bir gapingizni tuzatadi.");

  const recommendedVocabulary = activeTab === 'task1'
    ? subTask1Mode === 'task1_1'
      ? [
          { word: 'Drop me a line', meaning: 'Xat yozib yubormoq (Informal)', example: 'Drop me a line when you have some free time!' },
          { word: 'Keep me posted', meaning: 'Xabardor qilib turmoq', example: 'Please keep me posted on your travel plans.' },
          { word: 'Make it up to you', meaning: "O'rnini qoplamoq", example: 'I promise I will make it up to you next weekend.' },
        ]
      : [
          { word: 'I am writing to inquire', meaning: "Ma'lumot so'rash maqsadida yozmoqdaman", example: 'I am writing to inquire about the upcoming training program.' },
          { word: 'Look into the matter', meaning: "Masalani ko'rib chiqmoq", example: 'I would appreciate it if you could look into this matter promptly.' },
          { word: 'At your earliest convenience', meaning: "Imkon bo'lishi bilanoq (Rasmiy)", example: 'I look forward to hearing from you at your earliest convenience.' },
        ]
    : [
        { word: 'Predominantly', meaning: "Asosan, ko'p jihatdan", example: 'Success is predominantly determined by consistent effort.' },
        { word: 'Mitigate', meaning: 'Yumshatmoq, kamaytirmoq', example: 'Governments must implement policies to mitigate environmental damage.' },
        { word: 'Indispensable', meaning: 'Ajralmas, juda zarur', example: 'Digital literacy has become an indispensable skill in modern society.' },
      ];

  const scores = [
    { key: 'task' as const, ratio: taskScore / 20 },
    { key: 'coherence' as const, ratio: cohesionScore / 20 },
    { key: 'lexical' as const, ratio: lexicalScore / 20 },
    { key: 'grammar' as const, ratio: grammarScore / 15 },
  ].sort((a, b) => a.ratio - b.ratio);

  return {
    totalScore,
    cefrLevel: cefr,
    cefrTitle,
    taskResponse: taskScore,
    coherenceCohesion: cohesionScore,
    lexicalResource: lexicalScore,
    grammaticalRange: grammarScore,
    wordCount,
    strengths: strengths.length > 0 ? strengths : ["Fikrlar tushunarli bayon etilgan."],
    improvements: improvements.slice(0, 4),
    recommendedVocabulary,
    isOffTopic,
    weakSkillTag: scores[0].key,
    isAiEvaluated: false,
  };
};
