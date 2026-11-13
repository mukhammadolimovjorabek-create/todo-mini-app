import type { TelegramUser } from '../types';

export const BOT_USERNAME = 'aitasklistbot';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink?: (url: string) => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
      };
    };
  }
}

export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const getTelegramStartParam = (): string => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.start_param) {
    return String(tg.initDataUnsafe.start_param).trim();
  }
  try {
    const p = new URLSearchParams(window.location.search);
    return (p.get('tgWebAppStartParam') || p.get('startapp') || '').trim();
  } catch {
    return '';
  }
};

export const buildMiniAppUrl = (startParam?: string): string => {
  if (!startParam) return `https://t.me/${BOT_USERNAME}`;
  return `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(startParam)}`;
};

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.impactOccurred(style);
    } catch {
      // fallback
    }
  }
};

export const getTelegramUser = (): TelegramUser => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  // Default mock user for testing in desktop browser
  return {
    id: 999999,
    first_name: 'Roam',
    username: 'roam_learner',
  };
};

export const getTelegramInitData = (): string => {
  const tg = getTelegramWebApp();
  return tg?.initData || '';
};
