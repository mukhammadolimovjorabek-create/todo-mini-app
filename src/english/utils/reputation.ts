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
 * Sends notification directly to Admin via Telegram Bot API
 */
export const notifyAdminForUnlock = async (user: {
  id: number | string;
  name: string;
  username?: string;
}): Promise<boolean> => {
  const BOT_TOKEN = '8922903249:AAEG1T0nM1eDi4Xi7jZ71bfFg0KJPWP1UAU';
  const ADMIN_ID = 5466728043;

  const usernameText = user.username ? `@${user.username}` : "(username ko'rsatilmagan)";
  const messageText = 
    `🚨 <b>BLOKLANGAN FOYDALANUVCHI TO'LOV QILMOQCHI!</b>\n\n` +
    `👤 <b>Ismi:</b> ${user.name} (${usernameText})\n` +
    `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
    `⚠️ <b>Sabab:</b> 10 ta shikoyat/dislike to'plangan\n` +
    `💰 <b>To'lov summasi:</b> <b>6,700 so'm</b>\n\n` +
    `👇 <i>Ushbu xabarga <b>Javob (Reply)</b> qilib karta yoki telefon raqamingizni yuboring. Bot uni avtomatik tarzda ushbu foydalanuvchiga yetkazadi.</i>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_ID,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error('Failed to notify admin via bot API:', err);
    return false;
  }
};
