import type { ExamConfig } from '../types';

export const ieltsExamConfig: ExamConfig = {
  id: 'ielts',
  title: 'IELTS',
  subtitle: 'Xalqaro standartdagi imtihonga tayyorgarlik',
  uzbekLabel: 'IELTS Imtihoni',
  accentColor: '#7052ff',
  accentSoft: 'rgba(112, 82, 255, 0.12)',
  icon: '🇬🇧',
  isAvailable: true,
  speakingSections: [
    {
      id: 'part_1',
      title: 'Part 1: Kirish va tanish mavzular',
      desc: 'Kundalik hayot, qiziqishlar va odatlar haqida 4-5 ta savol',
      speakingSeconds: 300,
    },
    {
      id: 'part_2',
      title: 'Part 2: Individual nutq (Cue Card)',
      desc: '1 daqiqa tayyorgarlik, 2 daqiqa monolog nutq',
      prepSeconds: 60,
      speakingSeconds: 120,
    },
    {
      id: 'part_3',
      title: 'Part 3: Kengaytirilgan muhokama',
      desc: 'Part 2 mavzusi bo\'yicha chuqur tahliliy va mavhum savollar',
      speakingSeconds: 300,
    },
  ],
  writingTasks: [
    {
      id: 'task_2',
      title: 'Task 2: Insho (Essay)',
      desc: 'Fikr bildirish, muhokama, muammo va yechim insholari',
      minWords: 250,
      defaultMinutes: 40,
    },
  ],
  timingDefaults: {
    writingMinutes: 40,
  },
};
