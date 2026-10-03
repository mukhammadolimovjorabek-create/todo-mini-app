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

export const getRandomPart1Topic = (): Part1Topic => {
  const list = speakingBank.part1;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};

export const getRandomPart2Topic = (): Part2CueCard => {
  const list = speakingBank.part2;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};

export const getRandomPart3Topic = (): Part3Topic => {
  const list = speakingBank.part3;
  return list[Math.floor(Math.random() * list.length)] || list[0];
};
