import { API_BASE_URL } from '../../config';
import { getTelegramInitData } from '../../utils/telegram';
import { evaluateIeltsWriting } from './ieltsWritingScoring';
import { evaluateMultilevelWritingLocal, type MultilevelWritingEvaluation } from './multilevelWritingScoring';

export interface WritingSentenceFix {
  original: string;
  corrected: string;
  reasonUz: string;
}

export interface WritingAiExtras {
  isAiEvaluated: boolean;
  isOffTopic?: boolean;
  weakSkillTag?: 'task' | 'coherence' | 'lexical' | 'grammar';
  sentenceCorrections?: WritingSentenceFix[];
  rewrittenSample?: string;
}

export type IeltsWritingResult = ReturnType<typeof evaluateIeltsWriting> & WritingAiExtras;

const roundToHalf = (n: number): number => Math.round(Math.max(0, Math.min(9, n)) * 2) / 2;

const callWritingAiEndpoint = async (
  examType: 'ielts' | 'multilevel',
  taskType: string,
  prompt: string,
  essayText: string
): Promise<Record<string, any> | null> => {
  const initData = getTelegramInitData();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;

  const body = JSON.stringify({ examType, taskType, prompt, essayText });
  const endpoints = ['/api/evaluate_writing', ...(API_BASE_URL ? [`${API_BASE_URL}/api/evaluate_writing`] : [])];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 32000);
      const res = await fetch(url, { method: 'POST', headers, body, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.evaluation && typeof data.evaluation === 'object') {
        return data.evaluation;
      }
    } catch {
      // Try next endpoint
    }
  }
  return null;
};

const normalizeFixes = (raw: unknown): WritingSentenceFix[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      original: String(item.original || '').trim(),
      corrected: String(item.corrected || '').trim(),
      reasonUz: String(item.reasonUz || item.reason || '').trim(),
    }))
    .filter((item) => item.original && item.corrected)
    .slice(0, 6);
};

export const evaluateIeltsWritingWithAI = async (
  essayText: string,
  taskType: 'task1' | 'task2',
  prompt: string
): Promise<IeltsWritingResult> => {
  // Always compute baseline structural metrics (wordCount, repetitionWarnings, complexSentenceRatio)
  const local = evaluateIeltsWriting(essayText, taskType, prompt);

  if (local.wordCount === 0) {
    return { ...local, isAiEvaluated: false, weakSkillTag: 'task' };
  }

  const ai = await callWritingAiEndpoint('ielts', taskType, prompt, essayText);
  if (!ai) {
    const weakest = [
      { key: 'task' as const, v: local.taskResponse },
      { key: 'coherence' as const, v: local.coherenceCohesion },
      { key: 'lexical' as const, v: local.lexicalResource },
      { key: 'grammar' as const, v: local.grammaticalRange },
    ].sort((a, b) => a.v - b.v)[0].key;

    return {
      ...local,
      isAiEvaluated: false,
      weakSkillTag: weakest,
      improvements: [
        ...local.improvements,
        "Eslatma: AI serverga ulanib bo'lmadi, natija oflayn mezonlar asosida hisoblandi.",
      ],
    };
  }

  const tr = roundToHalf(Number(ai.taskResponse ?? local.taskResponse));
  const cc = roundToHalf(Number(ai.coherenceCohesion ?? local.coherenceCohesion));
  const lr = roundToHalf(Number(ai.lexicalResource ?? local.lexicalResource));
  const gra = roundToHalf(Number(ai.grammaticalRange ?? local.grammaticalRange));
  const computedOverall = roundToHalf((tr + cc + lr + gra) / 4);
  const overall = ai.overallBand !== undefined ? roundToHalf(Number(ai.overallBand)) : computedOverall;

  const strengths = Array.isArray(ai.strengths) && ai.strengths.length > 0
    ? ai.strengths.map((s: any) => String(s)).slice(0, 4)
    : local.strengths;
  const improvements = Array.isArray(ai.improvements) && ai.improvements.length > 0
    ? ai.improvements.map((s: any) => String(s)).slice(0, 4)
    : local.improvements;

  const detectedAcademicWords = Array.isArray(ai.detectedAcademicWords) && ai.detectedAcademicWords.length > 0
    ? ai.detectedAcademicWords.map((w: any) => String(w)).slice(0, 12)
    : local.detectedAcademicWords;

  const recommendedVocabulary = Array.isArray(ai.recommendedVocabulary) && ai.recommendedVocabulary.length > 0
    ? ai.recommendedVocabulary
        .filter((v: any) => v && v.word)
        .map((v: any) => ({
          word: String(v.word),
          meaning: String(v.meaning || ''),
          example: String(v.example || ''),
        }))
        .slice(0, 5)
    : local.recommendedVocabulary;

  const weakSkillTag = (['task', 'coherence', 'lexical', 'grammar'].includes(ai.weakSkillTag)
    ? ai.weakSkillTag
    : [
        { key: 'task' as const, v: tr },
        { key: 'coherence' as const, v: cc },
        { key: 'lexical' as const, v: lr },
        { key: 'grammar' as const, v: gra },
      ].sort((a, b) => a.v - b.v)[0].key) as WritingAiExtras['weakSkillTag'];

  return {
    ...local,
    overallBand: overall,
    taskResponse: tr,
    coherenceCohesion: cc,
    lexicalResource: lr,
    grammaticalRange: gra,
    strengths,
    improvements,
    detectedAcademicWords,
    recommendedVocabulary,
    isAiEvaluated: true,
    isOffTopic: Boolean(ai.isOffTopic),
    weakSkillTag,
    sentenceCorrections: normalizeFixes(ai.sentenceCorrections),
    rewrittenSample: typeof ai.rewrittenSample === 'string' && ai.rewrittenSample.trim() ? ai.rewrittenSample.trim() : undefined,
  };
};

export const evaluateMultilevelWritingWithAI = async (
  essayText: string,
  activeTab: 'task1' | 'task2',
  subTask1Mode: 'task1_1' | 'task1_2',
  promptText: string
): Promise<MultilevelWritingEvaluation> => {
  const local = evaluateMultilevelWritingLocal(essayText, activeTab, subTask1Mode, promptText);
  if (local.wordCount === 0) return local;

  const taskTag = activeTab === 'task1' ? subTask1Mode : 'task2';
  const ai = await callWritingAiEndpoint('multilevel', taskTag, promptText, essayText);
  if (!ai) return local;

  const tr = Math.max(0, Math.min(20, Math.round(Number(ai.taskResponse ?? local.taskResponse))));
  const cc = Math.max(0, Math.min(20, Math.round(Number(ai.coherenceCohesion ?? local.coherenceCohesion))));
  const lr = Math.max(0, Math.min(20, Math.round(Number(ai.lexicalResource ?? local.lexicalResource))));
  const gra = Math.max(0, Math.min(15, Math.round(Number(ai.grammaticalRange ?? local.grammaticalRange))));
  const totalScore = Math.max(0, Math.min(75, tr + cc + lr + gra));

  let cefr = "A2 (Sertifikat berilmaydi)";
  if (totalScore >= 65) cefr = "C1 (Oliy daraja)";
  else if (totalScore >= 50) cefr = "B2 (Yetakchi / Yuqori daraja)";
  else if (totalScore >= 30) cefr = "B1 (O'rta daraja)";

  const weakSkillTag = (['task', 'coherence', 'lexical', 'grammar'].includes(ai.weakSkillTag)
    ? ai.weakSkillTag
    : local.weakSkillTag) as MultilevelWritingEvaluation['weakSkillTag'];

  return {
    totalScore,
    cefrLevel: typeof ai.cefrLevel === 'string' && ai.cefrLevel.length <= 20 ? `${ai.cefrLevel} • ${cefr}` : cefr,
    cefrTitle: `${totalScore} / 75 ball • ${cefr}`,
    taskResponse: tr,
    coherenceCohesion: cc,
    lexicalResource: lr,
    grammaticalRange: gra,
    wordCount: local.wordCount,
    strengths: Array.isArray(ai.strengths) && ai.strengths.length > 0 ? ai.strengths.map(String).slice(0, 4) : local.strengths,
    improvements: Array.isArray(ai.improvements) && ai.improvements.length > 0 ? ai.improvements.map(String).slice(0, 4) : local.improvements,
    recommendedVocabulary:
      Array.isArray(ai.recommendedVocabulary) && ai.recommendedVocabulary.length > 0
        ? ai.recommendedVocabulary.filter((v: any) => v && v.word).map((v: any) => ({
            word: String(v.word),
            meaning: String(v.meaning || ''),
            example: String(v.example || ''),
          })).slice(0, 5)
        : local.recommendedVocabulary,
    isOffTopic: Boolean(ai.isOffTopic),
    weakSkillTag,
    sentenceCorrections: normalizeFixes(ai.sentenceCorrections),
    rewrittenSample: typeof ai.rewrittenSample === 'string' && ai.rewrittenSample.trim() ? ai.rewrittenSample.trim() : undefined,
    detectedAcademicWords: Array.isArray(ai.detectedAcademicWords) ? ai.detectedAcademicWords.map(String).slice(0, 10) : undefined,
    isAiEvaluated: true,
  };
};
