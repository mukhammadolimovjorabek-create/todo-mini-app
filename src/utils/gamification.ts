import { loadTasks, today, calculateCurrentStreak } from './storage';
import { getTestResults } from '../english/utils/storage';
import { loadInventory } from './shop';
import type { Task } from '../types';
import type { TestResultItem } from '../english/types';

export interface BadgeItem {
  id: string;
  icon: string;
  label: string;
  desc: string;
  rewardCoins: number;
  condition: (tasks: Task[], streak: number, englishResults: TestResultItem[]) => boolean;
}

// ── Nishonlar (To-Do + Study Lab yagona nishon tizimi) ──
export const ALL_BADGES: BadgeItem[] = [
  {
    id: 'first_create',
    icon: '🚀',
    label: 'Tezkor start',
    desc: 'Birinchi vazifani yaratish',
    rewardCoins: 1,
    condition: (tasks) => tasks.length >= 1,
  },
  {
    id: 'first_done',
    icon: '⚡',
    label: 'Birinchi g\'alaba',
    desc: 'Birinchi vazifani yakunlash',
    rewardCoins: 2,
    condition: (tasks) => tasks.filter((t) => t.done).length >= 1,
  },
  {
    id: 'first_english',
    icon: '🎓',
    label: 'Study Lab Start',
    desc: 'Birinchi IELTS/Multilevel sinovini yakunlash',
    rewardCoins: 3,
    condition: (_, __, englishResults) => englishResults.length >= 1,
  },
  {
    id: 'high_band_club',
    icon: '⭐',
    label: 'Yuqori Natija (6.5+ / B2)',
    desc: 'IELTS 6.5+ yoki Multilevel 51+ ball olish',
    rewardCoins: 5,
    condition: (_, __, englishResults) =>
      englishResults.some((r) =>
        r.title.includes('Multilevel') || r.id.startsWith('ml_') ? r.overallBand >= 51 : r.overallBand >= 6.5
      ),
  },
  {
    id: 'five_in_day',
    icon: '🔥',
    label: 'Bir kunda 5ta',
    desc: 'Bir kunda 5 ta vazifa yakunlash',
    rewardCoins: 3,
    condition: (tasks) => {
      const todayTasks = tasks.filter((t) => t.createdAt === today() && t.done);
      return todayTasks.length >= 5;
    },
  },
  {
    id: 'perfect_day',
    icon: '🎯',
    label: '100% kun',
    desc: 'Barcha kunlik rejalarni yopish',
    rewardCoins: 3,
    condition: (tasks) => {
      const todayTasks = tasks.filter((t) => t.createdAt === today());
      return todayTasks.length >= 1 && todayTasks.every((t) => t.done);
    },
  },
  {
    id: 'three_streak',
    icon: '🌟',
    label: '3 kun streak',
    desc: '3 kun uzluksiz maqsadli reja yoki sinov',
    rewardCoins: 3,
    condition: (_, streak) => streak >= 3,
  },
  {
    id: 'seven_streak',
    icon: '🛡️',
    label: '7 kun intizom',
    desc: 'Bir hafta uzluksiz faollik seriyasi',
    rewardCoins: 5,
    condition: (_, streak) => streak >= 7,
  },
  {
    id: 'ten_done',
    icon: '🏆',
    label: '10 vazifa',
    desc: 'Jami 10 ta vazifani tugatish',
    rewardCoins: 4,
    condition: (tasks) => tasks.filter((t) => t.done).length >= 10,
  },
  {
    id: 'fifty_done',
    icon: '💎',
    label: '50 vazifa',
    desc: 'Haqiqiy mahsuldorlik rekordi',
    rewardCoins: 5,
    condition: (tasks) => tasks.filter((t) => t.done).length >= 50,
  },
];

const COINS_KEY = 'todo_user_coins_v1';
const UNLOCKED_BADGES_KEY = 'todo_unlocked_badges_v1';
const SEEN_ALERTS_KEY = 'todo_seen_badge_alerts_v1';

// ── Vazifa vazniga qarab beriladigan tangalar (Ixcham va adolatli: 1 - 3 tanga) ──
export const getTaskCoins = (priority?: string): number => {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  return 1;
};

export const COINS_PER_ENGLISH_TEST = 4;
export const COINS_PER_DAILY_CHALLENGE = 5;

// ── Tangalarni qayta to'liq hisoblash (Unified Task + Study Lab + Shop Engine) ──
export const recalculateCoins = (): number => {
  const tasks = loadTasks();
  const completedTasks = tasks.filter((t) => t.done);
  const englishResults = getTestResults();
  const inv = loadInventory();
  const streak = calculateCurrentStreak();

  let totalEarned = 0;
  completedTasks.forEach((t) => {
    totalEarned += getTaskCoins(t.priority);
  });

  totalEarned += englishResults.length * COINS_PER_ENGLISH_TEST;
  totalEarned += inv.dailyBonusCoins || 0;
  totalEarned += (inv.dailyChallengeDoneDates?.length || 0) * COINS_PER_DAILY_CHALLENGE;

  ALL_BADGES.forEach((b) => {
    if (b.condition(tasks, streak, englishResults)) {
      totalEarned += b.rewardCoins;
    }
  });

  const balance = Math.max(0, totalEarned - (inv.coinsSpent || 0));
  saveUserCoins(balance);
  return balance;
};

// ── Tangalarni olish ──
export const getUserCoins = (): number => {
  return recalculateCoins();
};

export const saveUserCoins = (coins: number) => {
  try {
    localStorage.setItem(COINS_KEY, Math.max(0, coins).toString());
  } catch {}
};

export const addCoins = (amount: number): number => {
  const current = getUserCoins();
  const updated = Math.max(0, current + amount);
  saveUserCoins(updated);
  return updated;
};

// ── Nishonlarni boshqarish ──
export const getUnlockedBadgeIds = (): string[] => {
  try {
    const raw = localStorage.getItem(UNLOCKED_BADGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const getSeenAlertIds = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const markBadgeAlertSeen = (badgeId: string) => {
  const seen = getSeenAlertIds();
  if (!seen.includes(badgeId)) {
    seen.push(badgeId);
    try {
      localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify(seen));
    } catch {}
  }
};

// Vazifa bajarilganda nishonlarni tekshirish
export interface CheckBadgesResult {
  newBadges: BadgeItem[];
  coinsAwarded: number;
}

export const checkAndUnlockBadges = (): CheckBadgesResult => {
  const tasks = loadTasks();
  const englishResults = getTestResults();
  const streak = calculateCurrentStreak();

  const currentlyUnlocked = new Set(getUnlockedBadgeIds());
  const seenAlerts = new Set(getSeenAlertIds());
  const newBadges: BadgeItem[] = [];
  let coinsAwarded = 0;

  ALL_BADGES.forEach((badge) => {
    if (badge.condition(tasks, streak, englishResults)) {
      if (!currentlyUnlocked.has(badge.id)) {
        currentlyUnlocked.add(badge.id);
        if (!seenAlerts.has(badge.id)) {
          newBadges.push(badge);
          coinsAwarded += badge.rewardCoins;
        }
      }
    }
  });

  try {
    localStorage.setItem(UNLOCKED_BADGES_KEY, JSON.stringify(Array.from(currentlyUnlocked)));
  } catch {}

  recalculateCoins();

  return { newBadges, coinsAwarded };
};
