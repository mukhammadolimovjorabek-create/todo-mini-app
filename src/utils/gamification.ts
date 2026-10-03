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

export const ALL_BADGES: BadgeItem[] = [
  {
    id: 'first_create',
    icon: '🚀',
    label: 'Tezkor start',
    desc: 'Birinchi vazifani yaratish',
    rewardCoins: 10,
    condition: (tasks) => tasks.length >= 1,
  },
  {
    id: 'first_done',
    icon: '⚡',
    label: 'Birinchi g\'alaba',
    desc: 'Birinchi vazifani yakunlash',
    rewardCoins: 15,
    condition: (tasks) => tasks.filter((t) => t.done).length >= 1,
  },
  {
    id: 'five_in_day',
    icon: '🔥',
    label: 'Bir kunda 5ta',
    desc: 'Bir kunning o\'zida 5 ta vazifa',
    rewardCoins: 20,
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
    rewardCoins: 25,
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
    rewardCoins: 30,
    condition: (_, streak) => streak >= 3,
  },
  {
    id: 'ten_done',
    icon: '🏆',
    label: '10 vazifa',
    desc: 'Jami 10 ta vazifani tugatish',
    rewardCoins: 35,
    condition: (tasks) => tasks.filter((t) => t.done).length >= 10,
  },
  {
    id: 'fifty_done',
    icon: '💎',
    label: '50 vazifa',
    desc: 'Haqiqiy mahsuldorlik rekordi',
    rewardCoins: 100,
    condition: (tasks) => tasks.filter((t) => t.done).length >= 50,
  },
];

const COINS_KEY = 'todo_user_coins_v1';
const UNLOCKED_BADGES_KEY = 'todo_unlocked_badges_v1';
const SEEN_ALERTS_KEY = 'todo_seen_badge_alerts_v1';

// ── Tangalarni boshqarish ──
export const getUserCoins = (): number => {
  try {
    const raw = localStorage.getItem(COINS_KEY);
    if (raw !== null) {
      return parseInt(raw, 10) || 0;
    }
  } catch {}

  // Agar mavjud bo'lmasa, dastlabki ballardan hisoblab chiqamiz
  const tasks = loadTasks();
  let initialCoins = 0;
  tasks.filter((t) => t.done).forEach((t) => {
    if (t.priority === 'high') initialCoins += 15;
    else if (t.priority === 'medium') initialCoins += 10;
    else initialCoins += 5;
  });
  saveUserCoins(initialCoins);
  return initialCoins;
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

// Vazifa bajarilganda yoki qo'shilganda nishonlarni tekshirish
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
        // Faqat oldin ko'rsatilmagan bo'lsa yangi deb qaytaramiz
        if (!seenAlerts.has(badge.id)) {
          newBadges.push(badge);
          coinsAwarded += badge.rewardCoins;
        }
      }
    }
  });

  // Saqlash
  try {
    localStorage.setItem(UNLOCKED_BADGES_KEY, JSON.stringify(Array.from(currentlyUnlocked)));
  } catch {}

  if (coinsAwarded > 0) {
    addCoins(coinsAwarded);
  }

  return { newBadges, coinsAwarded };
};

// Vazifa vazniga qarab beriladigan tangalar
export const getTaskCoins = (priority?: string): number => {
  if (priority === 'high') return 15;
  if (priority === 'medium') return 10;
  return 5;
};
