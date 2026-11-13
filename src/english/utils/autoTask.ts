import { addTask, updateStats } from '../../utils/storage';
import { triggerHaptic } from '../../utils/telegram';

export type WeakSkillKey = 'task' | 'coherence' | 'lexical' | 'grammar' | 'fluency' | 'pronunciation' | 'reading' | 'listening';

export interface AutoTaskSpec {
  title: string;
  duration: number;
  priority: 'high' | 'medium';
  reasonUz: string;
}

export const buildAutoTaskSpec = (
  examType: 'ielts' | 'multilevel',
  moduleName: string,
  weakSkill: WeakSkillKey,
  detail?: string
): AutoTaskSpec => {
  const prefix = examType === 'multilevel' ? 'Multilevel' : 'IELTS';

  switch (weakSkill) {
    case 'grammar':
      return {
        title: `✍️ ${prefix}: Murakkab gaplar va zamon xatolarini tuzatish (10 ta misol)`,
        duration: 20,
        priority: 'high',
        reasonUz: detail || `${moduleName} natijasida eng past ko'rsatkich Grammatika bo'ldi.`,
      };
    case 'lexical':
      return {
        title: `📚 ${prefix}: 10 ta C1 akademik kollokatsiya yodlash va gap tuzish`,
        duration: 15,
        priority: 'high',
        reasonUz: detail || `${moduleName} da lug'at boyligi va sinonimlarni oshirish zarur.`,
      };
    case 'coherence':
      return {
        title: `🔗 ${prefix}: Linking words va mantiqiy paragraf tuzish mashqi`,
        duration: 15,
        priority: 'medium',
        reasonUz: detail || `${moduleName} da fikrlar bog'lanishi (Coherence) ni kuchaytirish kerak.`,
      };
    case 'fluency':
      return {
        title: `🎙 ${prefix}: 10 daqiqa to'xtamasdan Shadowing & ravon gapirish mashqi`,
        duration: 15,
        priority: 'high',
        reasonUz: detail || `${moduleName} da pauzalarsiz ravon nutq ustida ishlash tavsiya etiladi.`,
      };
    case 'pronunciation':
      return {
        title: `🗣 ${prefix}: Talaffuz va urg'u mashqi (Shadowing 0.85x rejimida)`,
        duration: 15,
        priority: 'medium',
        reasonUz: detail || `${moduleName} da so'z talaffuzi va intonatsiyani charxlash kerak.`,
      };
    case 'reading':
      return {
        title: `📖 ${prefix} Reading: T/F/NG va Matching Headings bo'yicha 1 ta matn yechish`,
        duration: 25,
        priority: 'high',
        reasonUz: detail || `Reading aniqligini oshirish uchun kunlik maqsadli mashq.`,
      };
    case 'listening':
      return {
        title: `🎧 ${prefix} Listening: Audio transkript bilan soya-tinglash (Dictation)`,
        duration: 20,
        priority: 'high',
        reasonUz: detail || `Audio detallarni ilg'ash tezligini oshirish mashqi.`,
      };
    case 'task':
    default:
      return {
        title: `🎯 ${prefix}: Savol shartiga aniq javob berish (${moduleName} qayta mashq)`,
        duration: 20,
        priority: 'high',
        reasonUz: detail || `${moduleName} da mavzudan chetga chiqmasdan to'liq javob berishni mashq qiling.`,
      };
  }
};

export const createAutoTaskFromExam = (
  examType: 'ielts' | 'multilevel',
  moduleName: string,
  weakSkill: WeakSkillKey,
  detail?: string
): AutoTaskSpec => {
  const spec = buildAutoTaskSpec(examType, moduleName, weakSkill, detail);
  addTask(spec.title, spec.priority, 'learning', spec.duration, 'daily');
  updateStats();
  triggerHaptic('medium');
  return spec;
};
