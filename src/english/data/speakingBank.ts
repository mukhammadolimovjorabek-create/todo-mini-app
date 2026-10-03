import bankData from './speakingBank.json';

export interface Part1Topic {
  id: string;
  topicNumber: number;
  topic: string;
  questions: string[];
}

export interface Part2CueCard {
  id: string;
  topicNumber: number;
  topic: string;
  cueCard: string;
  bulletPoints: string[];
  part3Questions?: string[];
  part3Topic?: string;
}

export interface Part3Topic {
  id: string;
  topicNumber: number;
  topic: string;
  questions: string[];
}

export interface SpeakingBank {
  part1: Part1Topic[];
  part2: Part2CueCard[];
  part3: Part3Topic[];
}

export const speakingBank: SpeakingBank = bankData as SpeakingBank;

export const getRandomPart1Topic = (seenIdentifiers: string[] = []): Part1Topic => {
  const seenSet = new Set(seenIdentifiers.map((s) => s.toLowerCase()));
  const unseen = speakingBank.part1.filter((t) => !seenSet.has(t.topic.toLowerCase()) && !seenSet.has(t.id.toLowerCase()));
  const pool = unseen.length > 0 ? unseen : speakingBank.part1;
  return pool[Math.floor(Math.random() * pool.length)] || speakingBank.part1[0];
};

export const getRandomPart2Topic = (seenIdentifiers: string[] = []): Part2CueCard => {
  const seenSet = new Set(seenIdentifiers.map((s) => s.toLowerCase()));
  const unseen = speakingBank.part2.filter((t) => !seenSet.has(t.topic.toLowerCase()) && !seenSet.has(t.id.toLowerCase()));
  const pool = unseen.length > 0 ? unseen : speakingBank.part2;
  return pool[Math.floor(Math.random() * pool.length)] || speakingBank.part2[0];
};

export const getRandomPart3Topic = (seenIdentifiers: string[] = []): Part3Topic => {
  const seenSet = new Set(seenIdentifiers.map((s) => s.toLowerCase()));
  const unseen = speakingBank.part3.filter((t) => !seenSet.has(t.topic.toLowerCase()) && !seenSet.has(t.id.toLowerCase()));
  const pool = unseen.length > 0 ? unseen : speakingBank.part3;
  return pool[Math.floor(Math.random() * pool.length)] || speakingBank.part3[0];
};
