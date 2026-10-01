import type { Task, DayStats, TaskCategory, TaskPriority } from '../types';

const TASKS_KEY = 'todo_tasks_v2';
const STATS_KEY = 'todo_stats_v2';

export const today = () => new Date().toISOString().slice(0, 10);

// ────────────────────────────── TASKS ──────────────────────────────

export const loadTasks = (): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const addTask = (
  text: string,
  priority: TaskPriority = 'medium',
  category: TaskCategory = 'personal',
  duration?: number
): Task => {
  const task: Task = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    done: false,
    priority,
    category,
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

export const getTodayTasks = (): Task[] =>
  loadTasks().filter((t) => t.createdAt === today());

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
  const todayTasks = getTodayTasks();
  const stats = loadStats().filter((s) => s.date !== todayStr);
  stats.push({ date: todayStr, total: todayTasks.length, done: todayTasks.filter((t) => t.done).length });
  localStorage.setItem(STATS_KEY, JSON.stringify(stats.slice(-30)));
};

export const getLast7Days = (): DayStats[] => {
  const stats = loadStats();
  const result: DayStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = stats.find((s) => s.date === dateStr);
    result.push(found ?? { date: dateStr, total: 0, done: 0 });
  }
  return result;
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
