export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export type ScreenType = 'home' | 'ai' | 'analytics' | 'profile';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'other';
export type TaskScope = 'daily' | 'weekly';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  scope?: TaskScope;  // 'daily' | 'weekly'
  createdAt: string; // YYYY-MM-DD
  completedAt?: string;
  duration?: number;  // minutes (optional)
  note?: string;
}

export interface DayStats {
  date: string; // YYYY-MM-DD
  total: number;
  done: number;
}
