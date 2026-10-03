/**
 * Partner Speaking Reputation, Like/Dislike and Lock Management
 */

const REPUTATION_KEY_PREFIX = 'partner_dislikes_';
const UNBLOCK_STATUS_KEY_PREFIX = 'partner_unblocked_';

export const getDislikesCount = (userId: number | string): number => {
  try {
    const val = localStorage.getItem(`${REPUTATION_KEY_PREFIX}${userId}`);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
};

export const setDislikesCount = (userId: number | string, count: number): void => {
  try {
    localStorage.setItem(`${REPUTATION_KEY_PREFIX}${userId}`, String(Math.max(0, count)));
  } catch {
    // ignore
  }
};

/**
 * Adding a dislike increments count by 1
 */
export const recordDislike = (userId: number | string): number => {
  const current = getDislikesCount(userId);
  const updated = current + 1;
  setDislikesCount(userId, updated);
  return updated;
};

/**
 * A like reduces dislikes by 1 (e.g. 9 dislikes -> 8 dislikes)
 */
export const recordLike = (userId: number | string): number => {
  const current = getDislikesCount(userId);
  const updated = Math.max(0, current - 1);
  setDislikesCount(userId, updated);
  return updated;
};

/**
 * User is blocked if they have accumulated 10 or more dislikes
 */
export const isUserLocked = (userId: number | string): boolean => {
  return getDislikesCount(userId) >= 10;
};

/**
 * Unblock user by resetting their dislikes to 0
 */
export const unlockUser = (userId: number | string): void => {
  setDislikesCount(userId, 0);
  try {
    localStorage.setItem(`${UNBLOCK_STATUS_KEY_PREFIX}${userId}`, 'true');
  } catch {
    // ignore
  }
};

/**
 * Requests unlock by opening the bot with the unlock trigger
 * This securely invokes the bot's /start unlock command without exposing secrets in the frontend
 */
export const notifyAdminForUnlock = async (_user: {
  id: number | string;
  name: string;
  username?: string;
}): Promise<boolean> => {
  const botLink = 'https://t.me/aitasklistbot?start=unlock';
  try {
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(botLink);
      return true;
    } else {
      window.open(botLink, '_blank');
      return true;
    }
  } catch (err) {
    console.error('Failed to open bot unlock link:', err);
    window.open(botLink, '_blank');
    return false;
  }
};
