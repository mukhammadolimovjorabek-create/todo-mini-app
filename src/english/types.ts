export type ExamType = 'ielts' | 'multilevel';

export interface ExamConfig {
  id: ExamType;
  title: string;
  subtitle: string;
  uzbekLabel: string;
  accentColor: string;
  accentSoft: string;
  icon: string;
  isAvailable: boolean; // Multilevel: false ("Tez orada")
  speakingSections: {
    id: string;
    title: string;
    desc: string;
    prepSeconds?: number;
    speakingSeconds?: number;
  }[];
  writingTasks: {
    id: string;
    title: string;
    desc: string;
    minWords: number;
    defaultMinutes: number;
  }[];
  timingDefaults: {
    writingMinutes: number;
  };
}

export interface EnglishUserProfile {
  telegramId: string | number;
  displayName: string;
  gender: 'male' | 'female';
  rulesAcceptedAt?: string;
  createdAt: string;
}
