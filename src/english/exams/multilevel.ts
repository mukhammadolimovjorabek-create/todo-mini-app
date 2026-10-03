import type { ExamConfig } from '../types';

/**
 * MULTILEVEL CONFIG (CEFR B1, B2, C1)
 * O'zbekiston Milliy sertifikati (Bilimni baholash agentligi / DTM) rasmiy standarti
 */
export const multilevelExamConfig: ExamConfig = {
  id: 'multilevel',
  title: 'Milliy Multilevel (CEFR)',
  subtitle: 'O\'zbekiston Milliy sertifikati uchun rasmiy sinov',
  uzbekLabel: 'Milliy Sertifikat',
  accentColor: '#0d9488',
  accentSoft: 'rgba(13, 148, 136, 0.12)',
  icon: '🇺🇿',
  isAvailable: true,
  speakingSections: [
    {
      id: 'ml_part_1_1',
      title: 'Part 1.1: Qisqa savol-javob',
      desc: '3 ta savol · Har bir savolga aniq 30 soniya',
      speakingSeconds: 30,
    },
    {
      id: 'ml_part_1_2',
      title: 'Part 1.2: Rasmlarni taqqoslash',
      desc: '1 daqiqa tayyorgarlik, 2 daqiqa nutq',
      prepSeconds: 60,
      speakingSeconds: 120,
    },
    {
      id: 'ml_part_2',
      title: 'Part 2: Mavzu taqdimoti',
      desc: '1 daqiqa tayyorgarlik, 2 daqiqa nutq',
      prepSeconds: 60,
      speakingSeconds: 120,
    },
    {
      id: 'ml_part_3',
      title: 'Part 3: Munozara (For vs Against)',
      desc: '1 daqiqa tayyorgarlik, 2 daqiqa nutq',
      prepSeconds: 60,
      speakingSeconds: 120,
    },
  ],
  writingTasks: [
    {
      id: 'ml_writing',
      title: 'Writing Task 1 & 2',
      desc: 'Xat va Insho yozish',
      minWords: 150,
      defaultMinutes: 60,
    },
  ],
  timingDefaults: {
    writingMinutes: 60,
  },
};
