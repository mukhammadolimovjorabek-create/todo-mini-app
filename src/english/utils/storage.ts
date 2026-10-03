import type { EnglishUserProfile, TestResultItem } from '../types';

const PROFILE_KEY = 'english_profile_v1';
const RULES_ACCEPTED_KEY = 'english_rules_accepted_v1';
const TEST_RESULTS_KEY = 'english_test_results_v1';
const SEEN_QUESTIONS_KEY = 'english_seen_questions_v1';

export const getEnglishProfile = (): EnglishUserProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const saveEnglishProfile = (profile: EnglishUserProfile): EnglishUserProfile => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
  return profile;
};

export const isEnglishRulesAccepted = (): boolean => {
  try {
    return localStorage.getItem(RULES_ACCEPTED_KEY) === 'true';
  } catch {}
  return false;
};

export const acceptEnglishRules = () => {
  try {
    localStorage.setItem(RULES_ACCEPTED_KEY, 'true');
  } catch {}
};

// ── Test History Results ──
export const getTestResults = (): TestResultItem[] => {
  try {
    const raw = localStorage.getItem(TEST_RESULTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const saveTestResult = (item: TestResultItem): void => {
  try {
    const existing = getTestResults();
    const updated = [item, ...existing];
    localStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch {}
};

// ── Seen Questions Tracking (Anti-Repetition) ──
export const getSeenQuestions = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_QUESTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const markQuestionSeen = (identifier: string): void => {
  try {
    const seen = new Set(getSeenQuestions());
    seen.add(identifier.trim().toLowerCase());
    localStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(Array.from(seen)));
  } catch {}
};

export const isQuestionSeen = (identifier: string): boolean => {
  try {
    const seen = new Set(getSeenQuestions());
    return seen.has(identifier.trim().toLowerCase());
  } catch {
    return false;
  }
};

export const clearSeenQuestions = (): void => {
  try {
    localStorage.removeItem(SEEN_QUESTIONS_KEY);
  } catch {}
};
