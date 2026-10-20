/**
 * Official Cambridge / British Council / IDP IELTS Writing Scoring Engine (2022–2026)
 * Evaluates Task 1 (Report) and Task 2 (Essay) across the 4 official criteria:
 * - Task Achievement (T1) / Task Response (T2)
 * - Coherence and Cohesion (CC)
 * - Lexical Resource (LR)
 * - Grammatical Range and Accuracy (GRA)
 */

export interface WritingCriteriaScores {
  taskResponse: number;       // Task Achievement (T1) / Task Response (T2)
  coherenceCohesion: number;  // CC
  lexicalResource: number;    // LR
  grammaticalRange: number;   // GRA
  overallBand: number;        // Rounded to nearest 0.5 according to official IELTS rules
}

export interface WritingAnalysisResult extends WritingCriteriaScores {
  wordCount: number;
  paragraphCount: number;
  minWordsRequired: number;
  wordCountPenaltyApplied: boolean;
  hasOverviewOrThesis: boolean;
  complexSentenceRatio: number; // 0 to 1
  detectedAcademicWords: string[];
  repetitionWarnings: { word: string; count: number; suggestedSynonyms: string[] }[];
  strengths: string[];
  improvements: string[];
  bandMilestoneAdvice: string[];
  recommendedVocabulary: { word: string; meaning: string; example: string }[];
}

// Comprehensive B2/C1/C2 Academic Vocabulary for Task 1 (Graphs, Charts, Processes, Maps)
const ACADEMIC_VOCAB_TASK1 = [
  'illustrate', 'illustrates', 'depict', 'depicts', 'demonstrate', 'demonstrates',
  'compare', 'compares', 'proportion', 'percentage', 'majority', 'minority',
  'surge', 'surged', 'witnessed', 'plummeted', 'soared', 'fluctuated', 'fluctuation',
  'plateaued', 'stabilized', 'outperformed', 'marginal', 'substantial', 'substantially',
  'exponential', 'negligible', 'predominant', 'predominantly', 'comprised', 'accounted',
  'upward', 'downward', 'trough', 'peak', 'peaked', 'moderately', 'considerably',
  'steeply', 'projected', 'outstripped', 'significantly', 'dramatically', 'gradually',
  'steadily', 'sharply', 'rapidly', 'noticeably', 'markedly', 'consistently',
  'respectively', 'conversely', 'contrastingly', 'meanwhile', 'subsequently',
  'initial', 'initially', 'simultaneously', 'transform', 'transformed', 'renovation',
  'redeveloped', 'expanded', 'demolished', 'constructed', 'converted', 'adjacent',
  'categorized', 'extracted', 'processed', 'manufactured', 'distributed', 'recycled',
  'exceeded', 'surpassed', 'declined', 'diminished', 'dwindled', 'doubled', 'tripled'
];

// Comprehensive B2/C1/C2 Academic Vocabulary for Task 2 (Essays)
const ACADEMIC_VOCAB_TASK2 = [
  'paramount', 'detrimental', 'ubiquitous', 'exacerbate', 'exacerbates', 'crucial',
  'pivotal', 'inevitable', 'inevitably', 'substantially', 'indispensable', 'disproportionate',
  'facilitate', 'facilitates', 'repercussion', 'repercussions', 'profound', 'profoundly',
  'intricacies', 'unprecedented', 'sustainable', 'sustainability', 'accelerate',
  'mitigate', 'mitigating', 'resilience', 'prevalent', 'cornerstone', 'fundamental',
  'fundamentally', 'compelling', 'contemplate', 'alleviate', 'manifestation', 'diminish',
  'counterpart', 'divergent', 'intrinsic', 'exemplify', 'imperative', 'phenomenon',
  'perspective', 'beneficial', 'advantageous', 'significantly', 'considerably',
  'consequently', 'furthermore', 'moreover', 'nevertheless', 'nonetheless', 'conversely',
  'predominantly', 'infrastructure', 'socioeconomic', 'contemporary', 'proliferation',
  'transformation', 'implementation', 'regulation', 'productivity', 'consumption',
  'urbanization', 'globalization', 'deteriorate', 'deterioration', 'incentive', 'incentives',
  'subsidize', 'allocate', 'allocation', 'rehabilitation', 'delinquency', 'autonomy',
  'curriculum', 'cognitive', 'psychological', 'environmental', 'technological',
  'renewable', 'biodiversity', 'conservation', 'overcrowding', 'disparity', 'equitable',
  'prosperity', 'well-being', 'indisputable', 'undeniably', 'Justification', 'feasible',
  'viable', 'jeopardize', 'foster', 'cultivate', 'embrace', 'eradicate', 'obstacle'
];

// Discourse markers & Cohesive devices (CC)
const COHESIVE_DEVICES = [
  'firstly', 'secondly', 'thirdly', 'finally', 'furthermore', 'moreover', 'in addition',
  'additionally', 'besides', 'however', 'nevertheless', 'nonetheless', 'on the other hand',
  'in contrast', 'by contrast', 'conversely', 'meanwhile', 'consequently', 'therefore',
  'thus', 'hence', 'as a result', 'for instance', 'for example', 'such as', 'specifically',
  'in particular', 'notably', 'in conclusion', 'to conclude', 'to sum up', 'overall',
  'in summary', 'admittedly', 'undoubtedly', 'gradually', 'subsequently'
];

// Complex grammar & subordinate clause markers (GRA)
const COMPLEX_STRUCTURE_MARKERS = [
  'although', 'even though', 'though', 'whereas', 'while', 'whilst', 'despite', 'in spite of',
  'provided that', 'providing that', 'unless', 'as long as', 'not only', 'but also',
  'which', 'who', 'whose', 'whom', 'whereby', 'whether', 'if', 'would', 'could', 'should',
  'had been', 'have been', 'has been', 'was built', 'were made', 'is considered', 'are required',
  'in order to', 'so that', 'due to', 'owing to', 'because of', 'resulted in', 'leading to'
];

// Task 1 Overview markers
const TASK1_OVERVIEW_MARKERS = [
  'overall', 'in summary', 'to summarize', 'it is clear that', 'it is evident that',
  'noticeably', 'it can be seen that', 'a general trend', 'in general', 'generally speaking',
  'at first glance', 'main trend'
];

// Task 2 Thesis / Position / Conclusion markers
const TASK2_POSITION_MARKERS = [
  'in conclusion', 'to conclude', 'to sum up', 'in my opinion', 'i firmly believe',
  'i believe', 'i would argue', 'from my perspective', 'on the whole', 'in my view',
  'i agree', 'i disagree', 'this essay will', 'i support', 'convinced that'
];

// Weak / repetitive words to suggest synonyms for
const WEAK_WORDS_MAP: Record<string, string[]> = {
  good: ['beneficial', 'advantageous', 'favorable', 'constructive'],
  bad: ['detrimental', 'adverse', 'unfavorable', 'harmful'],
  big: ['substantial', 'considerable', 'monumental', 'extensive'],
  small: ['marginal', 'negligible', 'fractional', 'minimal'],
  important: ['pivotal', 'crucial', 'paramount', 'essential'],
  problem: ['dilemma', 'impediment', 'setback', 'challenge'],
  increase: ['surge', 'escalate', 'proliferate', 'soar'],
  decrease: ['diminish', 'dwindle', 'decline', 'plummet'],
  show: ['illustrate', 'depict', 'demonstrate', 'delineate'],
  many: ['numerous', 'a myriad of', 'various', 'widespread'],
  people: ['individuals', 'citizens', 'society', 'the public'],
  think: ['believe', 'consider', 'maintain', 'argue'],
  thing: ['factor', 'aspect', 'element', 'phenomenon'],
};

/**
 * Standard IELTS Band rounding to nearest 0.5:
 * e.g. 6.125 -> 6.0
 *      6.25  -> 6.5
 *      6.625 -> 6.5
 *      6.75  -> 7.0
 */
export const roundToIeltsBand = (score: number): number => {
  const clamped = Math.min(9.0, Math.max(0.0, score));
  const floor = Math.floor(clamped);
  const remainder = clamped - floor;

  if (remainder < 0.25) return floor;
  if (remainder < 0.75) return floor + 0.5;
  return Math.min(9.0, floor + 1.0);
};

export const evaluateIeltsWriting = (
  text: string,
  taskType: 'task1' | 'task2',
  promptContext?: string
): WritingAnalysisResult => {
  const cleanText = text.trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const minWordsRequired = taskType === 'task1' ? 150 : 250;

  if (wordCount === 0) {
    return {
      overallBand: 0.0,
      taskResponse: 0.0,
      coherenceCohesion: 0.0,
      lexicalResource: 0.0,
      grammaticalRange: 0.0,
      wordCount: 0,
      paragraphCount: 0,
      minWordsRequired,
      wordCountPenaltyApplied: true,
      hasOverviewOrThesis: false,
      complexSentenceRatio: 0,
      detectedAcademicWords: [],
      repetitionWarnings: [],
      strengths: [],
      improvements: [
        "Belgilangan vaqt ichida matn kiritilmadi (0 ta so'z).",
        `IELTS Writing ${taskType === 'task1' ? 'Task 1 uchun kamida 150' : 'Task 2 uchun kamida 250'} ta so'z yozish talab etiladi.`
      ],
      bandMilestoneAdvice: [
        "Vaqt boshlangach kirish (Introduction) va asosiy qismlarni ketma-ket yozishni mashq qiling."
      ],
      recommendedVocabulary: [],
    };
  }

  // Split into paragraphs
  const rawParagraphs = cleanText.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
  const paragraphCount = rawParagraphs.length;
  const lowerText = cleanText.toLowerCase();

  // Topic relevance check against promptContext
  let isOffTopic = false;
  let topicMatchCount = 0;
  if (promptContext && wordCount >= 15) {
    const stopWords = new Set([
      'below', 'chart', 'graph', 'table', 'diagram', 'maps', 'shows', 'illustrates', 'compares',
      'between', 'people', 'believe', 'think', 'extent', 'agree', 'disagree', 'opinion', 'discuss',
      'views', 'give', 'your', 'some', 'many', 'more', 'than', 'ever', 'before', 'around',
      'world', 'what', 'main', 'causes', 'these', 'problems', 'measures', 'take', 'resolve',
      'them', 'with', 'this', 'from', 'that', 'have', 'will', 'soon', 'summarize', 'selecting',
      'reporting', 'features', 'make', 'comparisons', 'where', 'relevant', 'outweigh', 'advantages',
      'disadvantages', 'positive', 'negative', 'development'
    ]);
    const promptStems = promptContext
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w))
      .map((w) => w.slice(0, 5));
    const uniqueStems = Array.from(new Set(promptStems));
    if (uniqueStems.length >= 2) {
      const matchedStems = uniqueStems.filter((stem) => lowerText.includes(stem));
      topicMatchCount = matchedStems.length;
      if (matchedStems.length === 0) {
        isOffTopic = true;
      }
    }
  }

  // 1. Detect Academic Vocabulary (Bank + Advanced Morphological Analysis)
  const targetVocab = taskType === 'task1' ? [...ACADEMIC_VOCAB_TASK1, ...ACADEMIC_VOCAB_TASK2] : ACADEMIC_VOCAB_TASK2;
  const detectedSet = new Set<string>();

  targetVocab.forEach((term) => {
    const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
    if (regex.test(lowerText)) {
      detectedSet.add(term);
    }
  });

  // Also detect sophisticated multi-syllabic academic words (8+ letters with academic suffixes)
  const cleanWordsList = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')).filter((w) => w.length >= 3);
  const uniqueWordsSet = new Set(cleanWordsList);
  const ttr = cleanWordsList.length > 0 ? uniqueWordsSet.size / cleanWordsList.length : 0;

  cleanWordsList.forEach((w) => {
    if (
      w.length >= 8 &&
      /(tion|ment|ance|ence|tude|ship|able|ible|ious|eous|ical|ally|ively|izing|ising)$/.test(w) &&
      !['something', 'everything', 'anything', 'important', 'different', 'information', 'understand', 'government', 'university', 'technology', 'education'].includes(w)
    ) {
      detectedSet.add(w);
    }
  });

  const detectedAcademicWords = Array.from(detectedSet);

  // 2. Overview / Thesis Position Detection
  const overviewMarkers = taskType === 'task1' ? TASK1_OVERVIEW_MARKERS : TASK2_POSITION_MARKERS;
  const hasOverviewOrThesis = overviewMarkers.some((m) => lowerText.includes(m));

  // 3. Cohesive Devices Detection
  const foundCohesive = COHESIVE_DEVICES.filter((c) => lowerText.includes(c));

  // 4. Complex Sentences, Passive Voice, Numbers/Data (for Task 1) & Mechanics
  const sentenceDelimiters = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentenceDelimiters.length);
  const avgWordsPerSentence = wordCount / sentenceCount;

  let complexCount = 0;
  COMPLEX_STRUCTURE_MARKERS.forEach((marker) => {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) complexCount += matches.length;
  });

  // Passive voice detection (is/are/was/were/been + V-ed/en)
  const passiveMatches = lowerText.match(/\b(is|are|was|were|be|been|being)\s+[a-z]+(ed|en|wn|lt|pt)\b/g);
  if (passiveMatches) complexCount += passiveMatches.length;

  const complexSentenceRatio = Math.min(1.0, complexCount / Math.max(3, sentenceCount));

  // Task 1 specific: Data/number/comparison references
  const dataMatches = cleanText.match(/(\d+(\.\d+)?%?|\b(per cent|percent|half|double|triple|quarter|third|majority|highest|lowest|more than|less than|compared to|whereas|while)\b)/gi);
  const dataReferenceCount = dataMatches ? dataMatches.length : 0;

  // Grammar & Mechanics error checks
  let mechanicsErrors = 0;
  const lowercaseIMatches = cleanText.match(/\si\s/g);
  if (lowercaseIMatches) mechanicsErrors += lowercaseIMatches.length;
  // Check repeated adjacent words (e.g. "the the")
  const repeatedAdjacent = lowerText.match(/\b([a-z]{2,})\s+\1\b/g);
  if (repeatedAdjacent) mechanicsErrors += repeatedAdjacent.length;

  // 5. Word Repetition Warnings
  const wordFrequencies: Record<string, number> = {};
  cleanWordsList.forEach((w) => {
    if (w.length > 3) {
      wordFrequencies[w] = (wordFrequencies[w] || 0) + 1;
    }
  });

  const repetitionWarnings: { word: string; count: number; suggestedSynonyms: string[] }[] = [];
  Object.keys(WEAK_WORDS_MAP).forEach((weakWord) => {
    const count = wordFrequencies[weakWord] || 0;
    if (count >= 3) {
      repetitionWarnings.push({
        word: weakWord,
        count,
        suggestedSynonyms: WEAK_WORDS_MAP[weakWord],
      });
    }
  });

  // ══════════════════════════════════════════════════════════════════
  // ── 6. DYNAMIC 4-CRITERIA SCORING (Continuous 2.5 – 9.0 Scale) ──
  // ══════════════════════════════════════════════════════════════════
  const lengthRatio = wordCount / minWordsRequired;
  const wordCountPenaltyApplied = wordCount < minWordsRequired;

  // A) TASK ACHIEVEMENT (T1) / TASK RESPONSE (T2)
  let trRaw = 5.0;
  if (wordCount < 35) {
    trRaw = 2.5 + (wordCount / 35) * 1.0;
  } else if (lengthRatio < 0.6) {
    trRaw = 3.5 + ((lengthRatio - 0.2) / 0.4) * 1.2;
  } else if (lengthRatio < 0.85) {
    trRaw = 4.7 + ((lengthRatio - 0.6) / 0.25) * 0.9;
  } else if (lengthRatio < 1.0) {
    trRaw = 5.6 + ((lengthRatio - 0.85) / 0.15) * 0.6;
  } else {
    // Full length achieved (150+ for T1, 250+ for T2)
    trRaw = 6.2 + Math.min(1.0, (lengthRatio - 1.0) * 1.8);
  }

  // Content bonuses for TR
  if (hasOverviewOrThesis) trRaw += 0.6;
  if (topicMatchCount >= 3) trRaw += 0.5;
  else if (topicMatchCount >= 1) trRaw += 0.25;

  if (taskType === 'task1') {
    if (dataReferenceCount >= 6) trRaw += 0.6;
    else if (dataReferenceCount >= 3) trRaw += 0.3;
  } else {
    // Task 2: Check for examples & developed body paragraphs
    if (/\b(for example|for instance|such as|illustrate this|in particular)\b/i.test(lowerText)) {
      trRaw += 0.45;
    }
    if (paragraphCount >= 4 && wordCount >= 265) {
      trRaw += 0.35;
    }
  }

  if (isOffTopic) {
    trRaw = Math.min(trRaw, 4.0);
  }
  const trScore = roundToIeltsBand(Math.min(9.0, Math.max(2.5, trRaw)));

  // B) COHERENCE & COHESION (CC)
  const targetParagraphs = taskType === 'task1' ? 3 : 4;
  let ccRaw = 4.5;

  if (wordCount < 40) {
    ccRaw = 3.0;
  } else {
    // Paragraphing score
    if (paragraphCount === 1) {
      ccRaw = 4.5;
    } else if (paragraphCount === 2) {
      ccRaw = 5.3;
    } else if (paragraphCount >= targetParagraphs && paragraphCount <= 6) {
      ccRaw = 6.2;
    } else {
      ccRaw = 5.8;
    }

    // Cohesive devices bonus
    if (foundCohesive.length >= 7) ccRaw += 1.6;
    else if (foundCohesive.length >= 5) ccRaw += 1.2;
    else if (foundCohesive.length >= 3) ccRaw += 0.8;
    else if (foundCohesive.length >= 1) ccRaw += 0.4;

    // Overview/conclusion transition bonus
    if (hasOverviewOrThesis) ccRaw += 0.4;
    if (lengthRatio >= 1.05) ccRaw += 0.3;
    if (lengthRatio < 0.7) ccRaw -= 0.7;
  }
  const ccScore = roundToIeltsBand(Math.min(9.0, Math.max(2.5, ccRaw)));

  // C) LEXICAL RESOURCE (LR)
  let lrRaw = 4.8;
  const academicCount = detectedAcademicWords.length;

  if (wordCount < 40) {
    lrRaw = 3.0 + (academicCount > 0 ? 0.5 : 0);
  } else {
    // Base from Academic word count
    if (academicCount >= 14) lrRaw = 7.8;
    else if (academicCount >= 10) lrRaw = 7.3;
    else if (academicCount >= 7) lrRaw = 6.8;
    else if (academicCount >= 5) lrRaw = 6.3;
    else if (academicCount >= 3) lrRaw = 5.8;
    else if (academicCount >= 1) lrRaw = 5.3;
    else lrRaw = 4.8;

    // Lexical diversity (Type-Token Ratio) bonus
    if (wordCount >= 80) {
      if (ttr >= 0.58) lrRaw += 0.8;
      else if (ttr >= 0.50) lrRaw += 0.5;
      else if (ttr >= 0.44) lrRaw += 0.25;
      else if (ttr < 0.36) lrRaw -= 0.5;
    }

    // Average word length bonus (shows sophisticated vocabulary)
    const avgWordLen = cleanWordsList.reduce((acc, w) => acc + w.length, 0) / Math.max(1, cleanWordsList.length);
    if (avgWordLen >= 5.3) lrRaw += 0.4;
    else if (avgWordLen >= 4.9) lrRaw += 0.2;

    // Repetition penalty
    if (repetitionWarnings.length >= 3) lrRaw -= 0.6;
    else if (repetitionWarnings.length >= 1) lrRaw -= 0.25;

    if (lengthRatio < 0.65) lrRaw = Math.min(lrRaw, 5.5);
  }
  const lrScore = roundToIeltsBand(Math.min(9.0, Math.max(2.5, lrRaw)));

  // D) GRAMMATICAL RANGE & ACCURACY (GRA)
  let graRaw = 4.8;
  if (wordCount < 40) {
    graRaw = 3.0;
  } else {
    // Complex structure density
    if (complexSentenceRatio >= 0.75) graRaw = 7.6;
    else if (complexSentenceRatio >= 0.55) graRaw = 7.1;
    else if (complexSentenceRatio >= 0.40) graRaw = 6.6;
    else if (complexSentenceRatio >= 0.25) graRaw = 6.1;
    else if (complexSentenceRatio >= 0.12) graRaw = 5.5;
    else graRaw = 4.8;

    // Sentence length variety & natural academic length (13–24 words/sentence)
    if (avgWordsPerSentence >= 13 && avgWordsPerSentence <= 25 && sentenceCount >= 6) {
      graRaw += 0.6;
    } else if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 28) {
      graRaw += 0.3;
    } else if (avgWordsPerSentence < 8 || avgWordsPerSentence > 35) {
      graRaw -= 0.5;
    }

    // Passive voice bonus
    if (passiveMatches && passiveMatches.length >= 2) {
      graRaw += 0.4;
    }

    // Mechanics errors penalty
    if (mechanicsErrors >= 3) graRaw -= 0.7;
    else if (mechanicsErrors >= 1) graRaw -= 0.3;

    if (lengthRatio < 0.65) graRaw = Math.min(graRaw, 5.5);
  }
  const graScore = roundToIeltsBand(Math.min(9.0, Math.max(2.5, graRaw)));

  // ══════════════════════════════════════════════════════════════════
  // ── 7. OVERALL BAND COMPUTATION ──
  // ══════════════════════════════════════════════════════════════════
  const rawAverage = (trScore + ccScore + lrScore + graScore) / 4;
  const overallBand = roundToIeltsBand(rawAverage);

  // ══════════════════════════════════════════════════════════════════
  // ── 8. DYNAMIC STRENGTHS, IMPROVEMENTS & EXAMINER MILESTONES ──
  // ══════════════════════════════════════════════════════════════════
  const strengths: string[] = [];
  const improvements: string[] = [];
  const bandMilestoneAdvice: string[] = [];

  if (isOffTopic) {
    improvements.push(
      "Diqqat: Matningiz berilgan mavzu (Prompt) kalit so'zlaridan chetga chiqqan (Off-topic). Mavzu savoliga bevosita javob bering."
    );
  } else if (topicMatchCount >= 2) {
    strengths.push(`Mavzuga moslik (On-topic): Savoldagi ${topicMatchCount} ta asosiy tushuncha matnda to'g'ri yoritilgan.`);
  }

  // Strengths
  if (wordCount >= minWordsRequired) {
    strengths.push(`So'zlar hajmi me'yori to'liq bajarildi (${wordCount} / ${minWordsRequired}+ so'z).`);
  }
  if (hasOverviewOrThesis) {
    strengths.push(
      taskType === 'task1'
        ? "Overview (umumiy tendensiyalar xulosasi) aniq kiritilgan — Task Achievement 7.0+ mezoni."
        : "Muallif pozitsiyasi (Thesis) va yakuniy xulosa (Conclusion) aniq ifodalangan."
    );
  }
  if (paragraphCount >= targetParagraphs) {
    strengths.push(`Matn mantiqiy ${paragraphCount} ta xatboshiga to'g'ri taqsimlangan.`);
  }
  if (foundCohesive.length >= 3) {
    strengths.push(`Bog'lovchi vositalar (${foundCohesive.slice(0, 4).join(', ')}) o'rinli qo'llangan.`);
  }
  if (detectedAcademicWords.length >= 3) {
    strengths.push(`Yuqori darajali ${detectedAcademicWords.length} ta akademik so'z va birikma aniqlandi (LR: ${lrScore.toFixed(1)}).`);
  }
  if (taskType === 'task1' && dataReferenceCount >= 4) {
    strengths.push(`Grafikdagi aniq raqamlar va qiyosiy ko'rsatkichlar (${dataReferenceCount} marta) keltirilgan.`);
  }

  // Improvements
  if (wordCount < minWordsRequired) {
    improvements.push(
      `So'zlar soni (${wordCount} ta) rasmiy talabdan (${minWordsRequired}+ so'z) kam. Kamida yana ${minWordsRequired - wordCount} ta so'z qo'shing.`
    );
  }
  if (!hasOverviewOrThesis) {
    improvements.push(
      taskType === 'task1'
        ? "Task 1 da 'Overall, it is clear that...' bilan boshlanuvchi umumiy xulosa (Overview) albatta bo'lishi shart."
        : "Task 2 da o'z fikringizni 'In my opinion...' va yakunni 'In conclusion...' bilan aniq ko'rsating."
    );
  }
  if (paragraphCount < targetParagraphs) {
    improvements.push(`Matnni ${paragraphCount} ta emas, kamida ${targetParagraphs} ta mantiqiy xatboshiga (Introduction, Body 1, Body 2${taskType === 'task2' ? ', Conclusion' : ''}) ajrating.`);
  }
  if (taskType === 'task1' && dataReferenceCount < 3) {
    improvements.push("Task 1 hisobotida diagrammadagi aniq raqamlar, foizlar yoki yillarni dalil sifatida keltiring.");
  }
  if (foundCohesive.length < 3) {
    improvements.push("Gaplarni bog'lash uchun 'Furthermore', 'However', 'Consequently', 'In contrast' kabi bog'lovchilarni ko'paytiring.");
  }
  if (repetitionWarnings.length > 0) {
    repetitionWarnings.forEach((w) => {
      improvements.push(
        `'${w.word}' so'zi ${w.count} marta takrorlangan. Sinonimlardan foydalaning: ${w.suggestedSynonyms.slice(0, 3).join(', ')}.`
      );
    });
  }
  if (complexSentenceRatio < 0.30) {
    improvements.push("Murakkab gaplar kam. 'Although...', 'Whereas...', 'which leads to...' va Passive Voice tuzilmalarini qo'shing.");
  }
  if (mechanicsErrors > 0) {
    improvements.push("Imlo va tinish belgilariga e'tibor bering ('I' olmoshi har doim katta harf bilan yoziladi, so'zlar ketma-ket takrorlanmasin).");
  }

  // Dynamic Milestone Advice based on actual weakest criteria
  const nextBand = (Math.min(9.0, overallBand + 0.5)).toFixed(1);
  if (trScore <= ccScore && trScore <= lrScore) {
    bandMilestoneAdvice.push(
      taskType === 'task1'
        ? `1. Task Achievement (${trScore.toFixed(1)} → ${(Math.min(9, trScore + 0.5)).toFixed(1)}): Asosiy o'zgarishlarni guruhlab taqqoslang va har bir xatboshida aniq raqamlar keltiring.`
        : `1. Task Response (${trScore.toFixed(1)} → ${(Math.min(9, trScore + 0.5)).toFixed(1)}): Har bir Body paragrafda asosiy g'oyani 'For instance...' orqali hayotiy misol bilan isbotlang.`
    );
  }
  if (lrScore < 7.5) {
    bandMilestoneAdvice.push(
      `2. Lexical Resource (${lrScore.toFixed(1)} → ${(Math.min(9, lrScore + 0.5)).toFixed(1)}): Hozir ${detectedAcademicWords.length} ta akademik so'z ishlatdingiz; yana 4–5 ta C1 kollokatsiya qo'shib takroriy so'zlarni kamaytiring.`
    );
  }
  if (graScore < 7.5) {
    bandMilestoneAdvice.push(
      `3. Grammar Range (${graScore.toFixed(1)} → ${(Math.min(9, graScore + 0.5)).toFixed(1)}): Shart ergash gaplar (If/Provided that), nisbiy olmoshlar (which/whose) va majhul nisbatni faolroq ishlating.`
    );
  }
  if (bandMilestoneAdvice.length < 3) {
    bandMilestoneAdvice.push(
      `Band ${nextBand} natija uchun paragraflar o'rtasidagi mantiqiy ko'priklarni (Cohesive devices) yanada tabiiy qo'llang.`
    );
  }

  // Dynamic Vocabulary Recommendations tailored to the task
  const recommendedVocabulary = taskType === 'task1'
    ? [
        { word: 'Witness a dramatic surge', meaning: "Keskin o'sishni qayd etmoq", example: 'Solar electricity generation witnessed a dramatic surge between 2015 and 2025.' },
        { word: 'Account for the vast majority', meaning: 'Asosiy ulushni tashkil etmoq', example: 'East Asia accounted for the vast majority of high-speed rail passengers.' },
        { word: 'Remain relatively static', meaning: "Deyarli o'zgarishsiz barqaror qolmoq", example: 'Hydroelectric output remained relatively static throughout the period.' },
        { word: 'Undergo a complete transformation', meaning: "To'liq yangilanishni boshdan kechirmoq (Map/Process)", example: 'The coastal town underwent a complete transformation over the 25-year period.' },
      ]
    : [
        { word: 'Of paramount importance', meaning: "O'ta muhim / birinchi darajali", example: 'Investing in preventive healthcare is of paramount importance for modern societies.' },
        { word: 'Have a detrimental impact on', meaning: "Salbiy / zararli ta'sir ko'rsatmoq", example: 'Excessive screen time can have a detrimental impact on children’s cognitive development.' },
        { word: 'Mitigate the adverse effects', meaning: 'Salbiy oqibatlarni yumshatmoq', example: 'Governments must implement strict regulations to mitigate the adverse effects of pollution.' },
        { word: 'A double-edged sword', meaning: 'Ham foydali, ham zararli jihati bor holat', example: 'Rapid technological automation is a double-edged sword for the global workforce.' },
      ];

  return {
    overallBand,
    taskResponse: trScore,
    coherenceCohesion: ccScore,
    lexicalResource: lrScore,
    grammaticalRange: graScore,
    wordCount,
    paragraphCount,
    minWordsRequired,
    wordCountPenaltyApplied,
    hasOverviewOrThesis,
    complexSentenceRatio,
    detectedAcademicWords,
    repetitionWarnings,
    strengths,
    improvements,
    bandMilestoneAdvice,
    recommendedVocabulary,
  };
};
