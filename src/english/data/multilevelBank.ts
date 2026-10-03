import mlData from './multilevelBank.json';
import mlWritingData from './multilevelWritingBank.json';

export interface MultilevelOfficialQuestion {
  number: number;
  question: string;
  sampleAnswer: string;
}

export interface MultilevelPart1_1 {
  id: string;
  source: string;
  topic: string;
  questions: string[];
  secondsPerQuestion: number; // 30 seconds
}

export interface MultilevelPart1_2 {
  id: string;
  source: string;
  title: string;
  prompt: string;
  questions: string[];
  prepSeconds: number; // 60 seconds
  speakingSeconds: number; // 120 seconds
}

export interface MultilevelPart2 {
  id: string;
  source: string;
  title: string;
  questions: string[];
  prepSeconds: number; // 60 seconds
  speakingSeconds: number; // 120 seconds
}

export interface MultilevelPart3 {
  id: string;
  source: string;
  statement: string;
  forPoints: string[];
  againstPoints: string[];
  prepSeconds: number; // 60 seconds
  speakingSeconds: number; // 120 seconds
}

export interface MultilevelBank {
  part1_1_questions_43: MultilevelOfficialQuestion[];
  part1_1_docx_questions: string[];
  part1_1: MultilevelPart1_1[];
  part1_2: MultilevelPart1_2[];
  part2: MultilevelPart2[];
  part3: MultilevelPart3[];
}

export interface MultilevelWritingTask1Exercise {
  id: string;
  title: string;
  scenario: string;
  task1_1: {
    type: string;
    prompt: string;
    wordLimit: string;
    timeMinutes: number;
  };
  task1_2: {
    type: string;
    prompt: string;
    wordLimit: string;
    timeMinutes: number;
  };
}

export interface MultilevelWritingTask2Topic {
  id: string;
  number: number;
  category: string;
  title: string;
  prompt: string;
  wordLimit: string;
  modelResponse: string;
}

export interface MultilevelWritingBank {
  task1_exercises: MultilevelWritingTask1Exercise[];
  task2_topics: MultilevelWritingTask2Topic[];
}

export const multilevelBank: MultilevelBank = mlData as MultilevelBank;
export const multilevelWritingBank: MultilevelWritingBank = mlWritingData as MultilevelWritingBank;

export const multilevelOfficial43Questions = multilevelBank.part1_1_questions_43 || [];

export const getRandomMultilevelPart1_1 = (seenIds: string[] = []): MultilevelPart1_1 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part1_1.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part1_1;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part1_1[0];
};

export const getRandomMultilevelPart1_2 = (seenIds: string[] = []): MultilevelPart1_2 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part1_2.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part1_2;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part1_2[0];
};

export const getRandomMultilevelPart2 = (seenIds: string[] = []): MultilevelPart2 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part2.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part2;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part2[0];
};

export const getRandomMultilevelPart3 = (seenIds: string[] = []): MultilevelPart3 => {
  const seenSet = new Set(seenIds);
  const unseen = multilevelBank.part3.filter((t) => !seenSet.has(t.id));
  const pool = unseen.length > 0 ? unseen : multilevelBank.part3;
  return pool[Math.floor(Math.random() * pool.length)] || multilevelBank.part3[0];
};

export const getRandomWritingTask1 = (): MultilevelWritingTask1Exercise => {
  const list = multilevelWritingBank.task1_exercises;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};

export const getRandomWritingTask2 = (): MultilevelWritingTask2Topic => {
  const list = multilevelWritingBank.task2_topics;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};
