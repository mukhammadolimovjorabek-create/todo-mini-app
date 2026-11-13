import type { EnglishUserProfile, TestResultItem } from '../types';

export const PROFILE_KEY = 'english_profile_v1';
export const RULES_ACCEPTED_KEY = 'english_rules_accepted_v1';
const LEGACY_TEST_RESULTS_KEY = 'english_test_results_v1';
export const TEST_RESULTS_KEY = 'english_test_results_v2';
export const SEEN_QUESTIONS_KEY = 'english_seen_questions_v1';

const emitEnglishSync = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studylab:sync'));
  }
};

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
    emitEnglishSync();
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
    emitEnglishSync();
  } catch {}
};

// ── Test History Results ──
export const getTestResults = (): TestResultItem[] => {
  try {
    // Wipe legacy v1 uncalibrated/corrupted scores from existing users' devices
    if (localStorage.getItem(LEGACY_TEST_RESULTS_KEY) !== null) {
      localStorage.removeItem(LEGACY_TEST_RESULTS_KEY);
    }
    const raw = localStorage.getItem(TEST_RESULTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const saveTestResult = (item: TestResultItem): void => {
  try {
    // Never save empty/zero-score attempts as real completed mocks
    if (!item || typeof item.overallBand !== 'number' || item.overallBand <= 0) {
      return;
    }
    const existing = getTestResults();
    const updated = [item, ...existing];
    localStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(updated.slice(0, 50)));
    emitEnglishSync();
  } catch {}
};

/** Converts "DD.MM.YYYY" stored in TestResultItem.date to "YYYY-MM-DD". */
export const getEnglishActivityIsoDates = (): Set<string> => {
  const dates = new Set<string>();
  for (const r of getTestResults()) {
    if (!r.date) continue;
    const parts = r.date.split('.');
    if (parts.length === 3) {
      dates.add(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
      dates.add(r.date);
    }
  }
  return dates;
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
    emitEnglishSync();
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
