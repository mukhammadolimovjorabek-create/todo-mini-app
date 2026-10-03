import type { EnglishUserProfile } from '../types';

const PROFILE_KEY = 'english_profile_v1';
const RULES_ACCEPTED_KEY = 'english_rules_accepted_v1';

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
