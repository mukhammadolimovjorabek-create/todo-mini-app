import mlData from './multilevelBank.json';

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
  part1_1: MultilevelPart1_1[];
  part1_2: MultilevelPart1_2[];
  part2: MultilevelPart2[];
  part3: MultilevelPart3[];
}

export const multilevelBank: MultilevelBank = mlData as MultilevelBank;

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
