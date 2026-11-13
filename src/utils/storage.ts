import type { Task, DayStats, TaskCategory, TaskPriority, TaskScope } from '../types';
import { API_BASE_URL } from '../config';
import { getTelegramUser, getTelegramInitData } from './telegram';
import {
  PROFILE_KEY as EN_PROFILE_KEY,
  RULES_ACCEPTED_KEY as EN_RULES_KEY,
  TEST_RESULTS_KEY as EN_RESULTS_KEY,
  SEEN_QUESTIONS_KEY as EN_SEEN_KEY,
  getEnglishProfile,
  getTestResults,
  getSeenQuestions,
  isEnglishRulesAccepted,
  getEnglishActivityIsoDates,
} from '../english/utils/storage';
import {
  INVENTORY_KEY,
  MISTAKES_KEY,
  DUO_KEY,
  localTodayStr,
  loadInventory,
  saveInventory,
  loadMistakes,
  saveMistakes,
  loadDuoState,
  saveDuoState,
} from './shop';

const TASKS_KEY = 'todo_tasks_v2';
const STATS_KEY = 'todo_stats_v2';

export const today = (): string => localTodayStr(0);

/**
 * Checks whether a YYYY-MM-DD date falls within the current Monday-to-Sunday week
 */
export const isCurrentWeek = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return false;
  const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);

  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return targetDate >= monday && targetDate <= sunday;
};

// ────────────────────────────── TASKS ──────────────────────────────

export const loadTasks = (): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
  } catch {
    return [];
  }
};

let syncTimeout: any = null;
let syncListenerAttached = false;

export const triggerCloudSync = () => {
  if (typeof window === 'undefined') return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const user = getTelegramUser();
      if (!user?.id) return;
      const initData = getTelegramInitData();
      const allTasks = loadTasks();
      const stats = loadStats();
      const englishProfile = getEnglishProfile();
      const englishTestResults = getTestResults();
      const englishSeenQuestions = getSeenQuestions();
      const englishRulesAccepted = isEnglishRulesAccepted();
      const inventory = loadInventory();
      const mistakes = loadMistakes();
      const duo = loadDuoState();
      const customProfile = getCustomProfile();

      await fetch(`${API_BASE_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          data: {
            tasks: allTasks,
            stats,
            customProfile,
            englishProfile,
            englishTestResults,
            englishSeenQuestions,
            englishRulesAccepted,
            inventory,
            mistakes,
            duo,
            updatedAt: Date.now(),
          },
        }),
      });
    } catch {
      // Background sync silently ignores network drops
    }
  }, 2000);
};

if (typeof window !== 'undefined' && !syncListenerAttached) {
  syncListenerAttached = true;
  window.addEventListener('studylab:sync', () => {
    triggerCloudSync();
  });
}

export const restoreFromCloud = async (): Promise<boolean> => {
  try {
    const user = getTelegramUser();
    if (!user?.id) return false;
    const initData = getTelegramInitData();
    const res = await fetch(`${API_BASE_URL}/api/sync?user_id=${user.id}`, {
      headers: initData ? { 'X-Telegram-Init-Data': initData } : {},
    });
    const json = await res.json();
    if (json.success && json.data) {
      let changed = false;
      const d = json.data;

      if (Array.isArray(d.tasks) && d.tasks.length > 0 && loadTasks().length === 0) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(d.tasks));
        if (d.stats) {
          localStorage.setItem(STATS_KEY, JSON.stringify(d.stats));
        }
        changed = true;
      }

      if (d.customProfile && !getCustomProfile().displayName) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(d.customProfile));
        changed = true;
      }

      if (d.englishProfile && !getEnglishProfile()) {
        localStorage.setItem(EN_PROFILE_KEY, JSON.stringify(d.englishProfile));
        changed = true;
      }

      if (d.englishRulesAccepted && !isEnglishRulesAccepted()) {
        localStorage.setItem(EN_RULES_KEY, 'true');
        changed = true;
      }

      if (Array.isArray(d.englishTestResults) && d.englishTestResults.length > 0) {
        const localResults = getTestResults();
        const seenIds = new Set(localResults.map((r) => r.id));
        const merged = [...localResults];
        for (const item of d.englishTestResults) {
          if (item?.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            merged.push(item);
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(EN_RESULTS_KEY, JSON.stringify(merged.slice(0, 50)));
        }
      }

      if (Array.isArray(d.englishSeenQuestions) && d.englishSeenQuestions.length > 0) {
        const mergedSeen = Array.from(new Set([...getSeenQuestions(), ...d.englishSeenQuestions]));
        localStorage.setItem(EN_SEEN_KEY, JSON.stringify(mergedSeen));
      }

      if (d.inventory && !localStorage.getItem(INVENTORY_KEY)) {
        saveInventory(d.inventory, false);
        changed = true;
      }

      if (Array.isArray(d.mistakes) && d.mistakes.length > 0 && !localStorage.getItem(MISTAKES_KEY)) {
        saveMistakes(d.mistakes, false);
        changed = true;
      }

      if (d.duo && !localStorage.getItem(DUO_KEY)) {
        saveDuoState(d.duo, false);
        changed = true;
      }

      return changed;
    }
  } catch {}
  return false;
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  triggerCloudSync();
};

export const addTask = (
  text: string,
  priority: TaskPriority = 'medium',
  category: TaskCategory = 'personal',
  duration?: number,
  scope: TaskScope = 'daily'
): Task => {
  const task: Task = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    done: false,
    priority,
    category,
    scope,
    createdAt: today(),
    ...(duration ? { duration } : {}),
  };
  const tasks = loadTasks();
  tasks.unshift(task);
  saveTasks(tasks);
  return task;
};

export const toggleTask = (id: string): Task[] => {
  const tasks = loadTasks().map((t) => {
    if (t.id === id) {
      return { ...t, done: !t.done, completedAt: !t.done ? today() : undefined };
    }
    return t;
  });
  saveTasks(tasks);
  updateStats();
  return tasks;
};

export const deleteTask = (id: string): Task[] => {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  updateStats();
  return tasks;
};

export const getActiveTasks = (): Task[] => {
  const todayStr = today();
  return loadTasks().filter((t) => {
    const scope = t.scope || 'daily';
    if (scope === 'weekly') {
      return isCurrentWeek(t.createdAt);
    }
    return t.createdAt === todayStr;
  });
};

export const getTodayTasks = (): Task[] =>
  loadTasks().filter((t) => (t.scope || 'daily') === 'daily' && t.createdAt === today());

export const getWeeklyTasks = (): Task[] =>
  loadTasks().filter((t) => t.scope === 'weekly' && isCurrentWeek(t.createdAt));

// ────────────────────────────── STATS ──────────────────────────────

export const loadStats = (): DayStats[] => {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const updateStats = () => {
  const todayStr = today();
  const activeTasks = getActiveTasks();
  const stats = loadStats().filter((s) => s.date !== todayStr);
  stats.push({ date: todayStr, total: activeTasks.length, done: activeTasks.filter((t) => t.done).length });
  localStorage.setItem(STATS_KEY, JSON.stringify(stats.slice(-30)));
  triggerCloudSync();
};

export const getLast7Days = (): DayStats[] => {
  const stats = loadStats();
  const englishDates = getEnglishActivityIsoDates();
  const result: DayStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = localTodayStr(-i);
    const found = stats.find((s) => s.date === dateStr);
    const hasEnActivity = englishDates.has(dateStr);
    if (found) {
      result.push(hasEnActivity && found.done === 0 ? { ...found, done: 1, total: Math.max(1, found.total) } : found);
    } else {
      result.push({ date: dateStr, total: hasEnActivity ? 1 : 0, done: hasEnActivity ? 1 : 0 });
    }
  }
  return result;
};

/** Single canonical streak calculation shared across Home, Analytics, Profile, Points, Badges, and AI. */
export const calculateCurrentStreak = (): number => {
  const stats = loadStats();
  const doneDates = new Set(stats.filter((s) => s.done > 0).map((s) => s.date));
  for (const d of getEnglishActivityIsoDates()) {
    doneDates.add(d);
  }
  const inv = loadInventory();
  const frozenSet = new Set(inv.frozenDates || []);

  // Automatically spend 1 Streak Freeze if yesterday was missed while an older active streak exists
  const yesterdayStr = localTodayStr(-1);
  const twoDaysAgoStr = localTodayStr(-2);
  if (
    !doneDates.has(yesterdayStr) &&
    !frozenSet.has(yesterdayStr) &&
    (doneDates.has(twoDaysAgoStr) || frozenSet.has(twoDaysAgoStr)) &&
    inv.streakFreezes > 0
  ) {
    inv.streakFreezes -= 1;
    inv.frozenDates = [...frozenSet, yesterdayStr].slice(-30);
    frozenSet.add(yesterdayStr);
    saveInventory(inv);
  }

  let streak = 0;
  // Count backwards from today (if active today) or yesterday (grace window for ongoing day)
  const todayStr = localTodayStr(0);
  const startOffset = doneDates.has(todayStr) || frozenSet.has(todayStr) ? 0 : 1;
  for (let offset = startOffset; offset < 60; offset++) {
    const ds = localTodayStr(-offset);
    if (doneDates.has(ds) || frozenSet.has(ds)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const getCategoryColor = (cat: TaskCategory): string => {
  const map: Record<TaskCategory, string> = {
    work: '#6366f1',
    personal: '#ec4899',
    health: '#10b981',
    learning: '#f59e0b',
    other: '#8b5cf6',
  };
  return map[cat];
};

export const getCategoryLabel = (cat: TaskCategory): string => {
  const map: Record<TaskCategory, string> = {
    work: 'Ish', personal: 'Shaxsiy', health: 'Sog\'liq', learning: 'O\'qish', other: 'Boshqa',
  };
  return map[cat];
};

export const getPriorityColor = (p: TaskPriority): string => {
  const map: Record<TaskPriority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  return map[p];
};

export const getPriorityLabel = (p: TaskPriority): string => {
  const map: Record<TaskPriority, string> = { high: 'Yuqori', medium: "O'rta", low: 'Past' };
  return map[p];
};

// Short day name (uz)
export const shortDay = (dateStr: string): string => {
  const d = new Date(dateStr);
  return ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][d.getDay()];
};

// Seed demo data for first-time users
export const seedDemoData = () => {
  if (loadTasks().length > 0) return;
  const demos: { text: string; priority: TaskPriority; category: TaskCategory; done: boolean }[] = [
    { text: 'Loyiha hisobotini tugatish', priority: 'high', category: 'work', done: true },
    { text: 'Inbox emaillarni tekshirish', priority: 'medium', category: 'work', done: true },
    { text: '30 daqiqa yugurish', priority: 'medium', category: 'health', done: false },
    { text: 'React kitobidan 1 bob o\'qish', priority: 'low', category: 'learning', done: false },
    { text: 'Do\'st bilan uchrashish', priority: 'low', category: 'personal', done: false },
  ];
  const tasks: Task[] = demos.map((d, i) => ({
    id: `demo-${i}`,
    text: d.text,
    done: d.done,
    priority: d.priority,
    category: d.category,
    createdAt: today(),
    completedAt: d.done ? today() : undefined,
  }));
  saveTasks(tasks);
  updateStats();
};

// ────────────────────────────── USER PROFILE ──────────────────────────────
export interface UserProfileData {
  displayName: string;
  avatarUrl: string;
}

const PROFILE_KEY = 'todo_user_profile_v1';

export const getCustomProfile = (): UserProfileData => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { displayName: '', avatarUrl: '' };
};

export const saveCustomProfile = (data: Partial<UserProfileData>) => {
  const current = getCustomProfile();
  const updated = { ...current, ...data };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  triggerCloudSync();
  return updated;
};
