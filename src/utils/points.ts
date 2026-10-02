import { loadTasks, getLast7Days } from './storage';

export interface ScoreBreakdown {
  totalPoints: number;
  highTasksDone: number;
  medTasksDone: number;
  lowTasksDone: number;
  streakDays: number;
  streakBonus: number;
}

// ── Hisoblash Qoidalari ──
// Yuqori: +3 ball
// O'rta: +2 ball
// Past: +1 ball
// Har bir streak kuni: +2 ball
export const calculateUserPoints = (): ScoreBreakdown => {
  const tasks = loadTasks();
  const completedTasks = tasks.filter((t) => t.done);

  let high = 0;
  let med = 0;
  let low = 0;

  completedTasks.forEach((t) => {
    if (t.priority === 'high') high++;
    else if (t.priority === 'medium') med++;
    else low++;
  });

  // Kunlik streak
  const days = getLast7Days();
  let streak = 0;
  const sortedDays = [...days].reverse();
  for (const d of sortedDays) {
    if (d.done > 0) streak++;
    else break;
  }

  // Agar bitta ham vazifa bajarilmagan bo'lsa — ball qat'iy 0 bo'ladi!
  if (completedTasks.length === 0) {
    return {
      totalPoints: 0,
      highTasksDone: 0,
      medTasksDone: 0,
      lowTasksDone: 0,
      streakDays: 0,
      streakBonus: 0,
    };
  }

  const streakBonus = streak * 2;
  const totalPoints = high * 3 + med * 2 + low * 1 + streakBonus;

  return {
    totalPoints,
    highTasksDone: high,
    medTasksDone: med,
    lowTasksDone: low,
    streakDays: streak,
    streakBonus,
  };
};

// ── Boshlang'ich Foydalanuvchilar (Nakrutka) ──
// Boshlang'ich umumiy foydalanuvchilar soni: 480 ta
// 1-o'rindagi nakrutka liderning bali: 36 ball (jonli foydalanuvchi 12-14 ta vazifa bilan yeta oladigan)
export const BASE_TOTAL_USERS = 480;
export const LEADER_POINTS = 36; // 1-o'rindagi nakrutka bali

export interface GlobalRankInfo {
  totalUsers: number;
  rank: number | null; // null agar 0 ball bo'lsa (O'rinsiz)
  rankLabel: string;   // "#18" yoki "O'rinsiz"
  percentile: number | null;
  percentileLabel: string;
}

export const getGlobalRank = (points: number): GlobalRankInfo => {
  // Qo'shimcha ro'yxatdan o'tgan jonli foydalanuvchilarni hisoblash
  let registeredCount = 0;
  try {
    const raw = localStorage.getItem('todo_registered_count');
    registeredCount = raw ? parseInt(raw, 10) : 0;
  } catch {}
  const totalUsers = BASE_TOTAL_USERS + registeredCount;

  // Agar ball 0 bo'lsa — foydalanuvchi o'rinsiz!
  if (!points || points <= 0) {
    return {
      totalUsers,
      rank: null,
      rankLabel: "O'rinsiz",
      percentile: null,
      percentileLabel: "Hali reytingda emassiz",
    };
  }

  // Agar foydalanuvchi liderdan o'zib ketsa:
  if (points >= LEADER_POINTS) {
    return {
      totalUsers,
      rank: 1,
      rankLabel: '#1',
      percentile: 1,
      percentileLabel: 'Top 1% (Hafta Lideri 👑)',
    };
  }

  // Dinamik o'rin egallash (480 ta foydalanuvchi o'rtasida real taqsimot)
  // Masalan:
  // 1 ball -> ~440-o'rin
  // 5 ball -> ~370-o'rin
  // 12 ball -> ~230-o'rin
  // 20 ball -> ~110-o'rin
  // 28 ball -> ~30-o'rin
  // 34 ball -> ~4-o'rin
  // 36+ ball -> 1-o'rin
  const ratio = points / LEADER_POINTS; // 0..1
  // Exponent 1.7 creates realistic dense competition at bottom and spaced at top
  const rank = Math.max(2, Math.round(totalUsers * Math.pow(1 - ratio, 1.7)));
  const pct = Math.max(1, Math.round((rank / totalUsers) * 100));

  return {
    totalUsers,
    rank,
    rankLabel: `#${rank}`,
    percentile: pct,
    percentileLabel: `Top ${pct}%`,
  };
};
