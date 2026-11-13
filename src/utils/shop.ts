export type AvatarFrameId = 'default' | 'neon_lime' | 'royal_violet' | 'ielts_gold' | 'cefr_emerald';

export interface UserInventory {
  coinsSpent: number;
  dailyBonusCoins: number;
  lastDailyClaimDate: string;
  streakFreezes: number;
  frozenDates: string[];
  activeFrame: AvatarFrameId;
  unlockedFrames: AvatarFrameId[];
  mockTickets: number;
  dailyChallengeDoneDates: string[];
}

export interface MistakeEntry {
  id: string;
  source: 'speaking' | 'writing' | 'reading' | 'listening';
  skillTag: string;
  title: string;
  userText: string;
  correction: string;
  explanation: string;
  date: string;
  reviewedCount: number;
}

export interface DuoState {
  active: boolean;
  pairId?: string;
  partnerId?: number;
  partnerName?: string;
  sharedStreak: number;
  partnerActiveToday?: boolean;
  invitePendingCode?: string;
}

export interface ShopCatalogItem {
  id: string;
  category: 'perk' | 'frame';
  title: string;
  desc: string;
  icon: string;
  price: number;
  frameId?: AvatarFrameId;
}

export const SHOP_ITEMS: ShopCatalogItem[] = [
  {
    id: 'streak_freeze',
    category: 'perk',
    title: 'Streak Freeze (1 kun)',
    desc: "1 kun kirmay qolsangiz ham seriyangiz kuyib ketmasdan saqlanadi",
    icon: '🧊',
    price: 12,
  },
  {
    id: 'mock_ticket',
    category: 'perk',
    title: 'VIP Mock & AI Boost',
    desc: "Qo'shimcha cheksiz AI tahlil va maxsus Band 9.0 namunalari chiptasi",
    icon: '🎫',
    price: 10,
  },
  {
    id: 'frame_neon_lime',
    category: 'frame',
    title: 'Neon Lime Ramka',
    desc: "Profil va reytingda yorqinStudy Lab neon hoshiyasi",
    icon: '⚡',
    price: 15,
    frameId: 'neon_lime',
  },
  {
    id: 'frame_cefr_emerald',
    category: 'frame',
    title: 'Multilevel Zumrad Ramka',
    desc: "Milliy Sertifikat B2–C1 maqsadli zumrad hoshiya",
    icon: '🇺🇿',
    price: 20,
    frameId: 'cefr_emerald',
  },
  {
    id: 'frame_royal_violet',
    category: 'frame',
    title: 'Royal AI Ramka',
    desc: "Eksklyuziv binafsha gradient va yorug'lik effekti",
    icon: '🔮',
    price: 25,
    frameId: 'royal_violet',
  },
  {
    id: 'frame_ielts_gold',
    category: 'frame',
    title: 'IELTS 9.0 Oltin Toj',
    desc: "Reyting va profil uchun oltin chempion ramkasi",
    icon: '👑',
    price: 35,
    frameId: 'ielts_gold',
  },
];

export const INVENTORY_KEY = 'studylab_inventory_v1';
export const MISTAKES_KEY = 'studylab_mistakes_v1';
export const DUO_KEY = 'studylab_duo_v1';

const DEFAULT_INVENTORY: UserInventory = {
  coinsSpent: 0,
  dailyBonusCoins: 0,
  lastDailyClaimDate: '',
  streakFreezes: 1, // Yangi foydalanuvchiga 1 ta bepul himoya!
  frozenDates: [],
  activeFrame: 'default',
  unlockedFrames: ['default'],
  mockTickets: 0,
  dailyChallengeDoneDates: [],
};

const emitSyncSignal = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studylab:sync'));
  }
};

export const localTodayStr = (offsetDays = 0): string => {
  const d = new Date();
  if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const loadInventory = (): UserInventory => {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserInventory>;
      return {
        ...DEFAULT_INVENTORY,
        ...parsed,
        frozenDates: Array.isArray(parsed.frozenDates) ? parsed.frozenDates : [],
        unlockedFrames: Array.isArray(parsed.unlockedFrames) && parsed.unlockedFrames.length > 0
          ? parsed.unlockedFrames
          : ['default'],
        dailyChallengeDoneDates: Array.isArray(parsed.dailyChallengeDoneDates)
          ? parsed.dailyChallengeDoneDates
          : [],
      };
    }
  } catch {}
  return { ...DEFAULT_INVENTORY };
};

export const saveInventory = (inv: UserInventory, notifySync = true): UserInventory => {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
    if (notifySync) emitSyncSignal();
  } catch {}
  return inv;
};

export const hasClaimedDailyBonusToday = (): boolean => {
  return loadInventory().lastDailyClaimDate === localTodayStr();
};

export const claimDailyBonus = (): { claimed: boolean; bonus: number } => {
  const todayStr = localTodayStr();
  const inv = loadInventory();
  if (inv.lastDailyClaimDate === todayStr) {
    return { claimed: false, bonus: 0 };
  }
  const bonus = 2;
  inv.lastDailyClaimDate = todayStr;
  inv.dailyBonusCoins = (inv.dailyBonusCoins || 0) + bonus;
  saveInventory(inv);
  return { claimed: true, bonus };
};

export const markDailyChallengeDone = (): boolean => {
  const todayStr = localTodayStr();
  const inv = loadInventory();
  if (inv.dailyChallengeDoneDates.includes(todayStr)) return false;
  inv.dailyChallengeDoneDates = [todayStr, ...inv.dailyChallengeDoneDates].slice(0, 60);
  saveInventory(inv);
  return true;
};

export const buyOrEquipShopItem = (
  itemId: string,
  currentBalance: number
): { ok: boolean; message: string; inventory: UserInventory } => {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  const inv = loadInventory();
  if (!item) return { ok: false, message: 'Mahsulot topilmadi', inventory: inv };

  if (item.category === 'frame' && item.frameId && inv.unlockedFrames.includes(item.frameId)) {
    inv.activeFrame = item.frameId;
    saveInventory(inv);
    return { ok: true, message: `${item.title} faollashtirildi!`, inventory: inv };
  }

  if (currentBalance < item.price) {
    return {
      ok: false,
      message: `Yetarli tanga yo'q (yana ${item.price - currentBalance} 🪙 kerak)`,
      inventory: inv,
    };
  }

  inv.coinsSpent += item.price;
  if (item.id === 'streak_freeze') {
    inv.streakFreezes += 1;
  } else if (item.id === 'mock_ticket') {
    inv.mockTickets += 1;
  } else if (item.category === 'frame' && item.frameId) {
    if (!inv.unlockedFrames.includes(item.frameId)) {
      inv.unlockedFrames = [...inv.unlockedFrames, item.frameId];
    }
    inv.activeFrame = item.frameId;
  }

  saveInventory(inv);
  return { ok: true, message: `${item.title} muvaffaqiyatli olindi!`, inventory: inv };
};

export const getFrameClasses = (frame?: AvatarFrameId): string => {
  switch (frame) {
    case 'neon_lime':
      return 'ring-3 ring-[#c4f82a] shadow-[0_0_16px_rgba(196,248,42,0.65)]';
    case 'cefr_emerald':
      return 'ring-3 ring-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.6)]';
    case 'royal_violet':
      return 'ring-3 ring-[#a855f7] shadow-[0_0_16px_rgba(168,85,247,0.65)]';
    case 'ielts_gold':
      return 'ring-3 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.75)]';
    default:
      return 'border-2 border-indigo-200';
  }
};

export const getFrameBadge = (frame?: AvatarFrameId): string => {
  switch (frame) {
    case 'neon_lime':
      return '⚡';
    case 'cefr_emerald':
      return '🇺🇿';
    case 'royal_violet':
      return '🔮';
    case 'ielts_gold':
      return '👑';
    default:
      return '';
  }
};

// ── Mistakes Bank ──
export const loadMistakes = (): MistakeEntry[] => {
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const saveMistakes = (items: MistakeEntry[], notifySync = true): void => {
  try {
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(items.slice(0, 60)));
    if (notifySync) emitSyncSignal();
  } catch {}
};

export const addMistakes = (
  entries: Omit<MistakeEntry, 'id' | 'date' | 'reviewedCount'>[]
): void => {
  if (!entries.length) return;
  const current = loadMistakes();
  const date = localTodayStr();
  const existingTexts = new Set(current.map((c) => `${c.source}:${c.correction.toLowerCase()}`));
  const fresh: MistakeEntry[] = [];
  for (const e of entries) {
    const key = `${e.source}:${e.correction.toLowerCase()}`;
    if (!existingTexts.has(key) && e.correction.trim()) {
      existingTexts.add(key);
      fresh.push({
        ...e,
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date,
        reviewedCount: 0,
      });
    }
  }
  if (fresh.length > 0) {
    saveMistakes([...fresh, ...current]);
  }
};

export const markMistakeReviewed = (id: string): MistakeEntry[] => {
  const updated = loadMistakes().map((m) =>
    m.id === id ? { ...m, reviewedCount: m.reviewedCount + 1 } : m
  );
  saveMistakes(updated);
  return updated;
};

// ── Accountability Duo ──
export const loadDuoState = (): DuoState => {
  try {
    const raw = localStorage.getItem(DUO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { active: false, sharedStreak: 0 };
};

export const saveDuoState = (duo: DuoState, notifySync = true): DuoState => {
  try {
    localStorage.setItem(DUO_KEY, JSON.stringify(duo));
    if (notifySync) emitSyncSignal();
  } catch {}
  return duo;
};
