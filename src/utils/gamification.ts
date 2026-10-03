import { loadTasks, getLast7Days, today } from './storage';
import type { Task } from '../types';

export interface BadgeItem {
  id: string;
  icon: string;
  label: string;
  desc: string;
  rewardCoins: number;
  condition: (tasks: Task[], streak: number) => boolean;
}

// ── Nishonlar (Kichik, qadrli va muvozanatli mukofotlar: 1 - 5 tanga) ──
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
    desc: '3 kun uzluksiz maqsadli reja',
    rewardCoins: 3,
    condition: (_, streak) => streak >= 3,
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

// ── Tangalarni qayta to'liq hisoblash (Synchronized Engine) ──
// Agar barcha vazifalar o'chirilsa yoki bajarilmagan bo'lsa — tanga qat'iy 0 bo'ladi!
export const recalculateCoins = (): number => {
  const tasks = loadTasks();
  const completedTasks = tasks.filter((t) => t.done);

  if (completedTasks.length === 0) {
    saveUserCoins(0);
    return 0;
  }

  let total = 0;
  completedTasks.forEach((t) => {
    total += getTaskCoins(t.priority);
  });

  // Real ochilgan nishonlar bonusi
  const days = getLast7Days().reverse();
  let streak = 0;
  for (const d of days) {
    if (d.done > 0) streak++;
    else break;
  }

  ALL_BADGES.forEach((b) => {
    if (b.condition(tasks, streak)) {
      total += b.rewardCoins;
    }
  });

  saveUserCoins(total);
  return total;
};

// ── Tangalarni olish ──
export const getUserCoins = (): number => {
  const tasks = loadTasks();
  const completedTasks = tasks.filter((t) => t.done);

  // Qat'iy qoida: agar bitta ham bajarilgan vazifa bo'lmasa, tangalar 0 bo'ladi!
  if (completedTasks.length === 0) {
    saveUserCoins(0);
    return 0;
  }

  try {
    const raw = localStorage.getItem(COINS_KEY);
    if (raw !== null) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) {
        return val;
      }
    }
  } catch {}

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
  const days = getLast7Days().reverse();
  let streak = 0;
  for (const d of days) {
    if (d.done > 0) streak++;
    else break;
  }

  const currentlyUnlocked = new Set(getUnlockedBadgeIds());
  const seenAlerts = new Set(getSeenAlertIds());
  const newBadges: BadgeItem[] = [];
  let coinsAwarded = 0;

  ALL_BADGES.forEach((badge) => {
    if (badge.condition(tasks, streak)) {
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

  if (coinsAwarded > 0) {
    addCoins(coinsAwarded);
  }

  return { newBadges, coinsAwarded };
};
