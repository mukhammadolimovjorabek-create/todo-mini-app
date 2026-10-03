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

export type TestType =
  | 'speaking_part1'
  | 'speaking_part2'
  | 'speaking_part3'
  | 'speaking_full_mock'
  | 'writing_task1'
  | 'writing_task2';

export interface TestResultItem {
  id: string;
  date: string; // e.g. "03.10.2026"
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "08:20"
  testType: TestType;
  title: string; // e.g. "IELTS Speaking: Part 1"
  topic: string; // e.g. "Hometown & Studies"
  overallBand: number; // e.g. 7.5
  criteriaScores: {
    c1Name: string;
    c1Score: number;
    c2Name: string;
    c2Score: number;
    c3Name: string;
    c3Score: number;
    c4Name: string;
    c4Score: number;
  };
  strengths: string[];
  improvements: string[];
  examinerNotes?: string;
}
