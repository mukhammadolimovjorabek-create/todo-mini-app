import type { ExamConfig } from '../types';

/**
 * MULTILEVEL CONFIG (CEFR B1, B2, C1)
 * Eslatma: Rasmiy struktura va baholash mezonlari docs/multilevel/structure.md va docs/multilevel/rubric.md
 * fayllaridan olinadi. Hozircha "Tez orada" holatida bloklangan.
 */
export const multilevelExamConfig: ExamConfig = {
  id: 'multilevel',
  title: 'Milliy Multilevel (CEFR)',
  subtitle: 'O\'zbekiston Milliy sertifikati uchun sinov',
  uzbekLabel: 'Milliy Sertifikat',
  accentColor: '#0d9488',
  accentSoft: 'rgba(13, 148, 136, 0.12)',
  icon: '🇺🇿',
  isAvailable: false, // "Tez orada" rejimi
  speakingSections: [
    {
      id: 'ml_part_1',
      title: 'Part 1: Savol-javob',
      desc: 'Umumiy mavzulardagi qisqa savollar (Tez orada)',
    },
    {
      id: 'ml_part_2',
      title: 'Part 2: Mavzuli nutq',
      desc: 'Berilgan rasm yoki mavzu bo\'yicha nutq (Tez orada)',
    },
    {
      id: 'ml_part_3',
      title: 'Part 3: Fikr bildirish',
      desc: 'Kengaytirilgan savollarga javob berish (Tez orada)',
    },
  ],
  writingTasks: [
    {
      id: 'ml_task_2',
      title: 'Writing Task 2: Insho / Fikr-mulohaza',
      desc: 'Multilevel milliy formati (Tez orada)',
      minWords: 200,
      defaultMinutes: 45,
    },
  ],
  timingDefaults: {
    writingMinutes: 45,
  },
};
