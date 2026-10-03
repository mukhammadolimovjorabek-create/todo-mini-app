import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Share2, 
  Trophy, 
  Copy, 
  Check, 
  Flame,
  Users,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles,
  Swords,
  UserPlus,
  Zap
} from 'lucide-react';
import { getLast7Days, loadTasks, getCategoryColor, getCategoryLabel, shortDay, getCustomProfile } from '../utils/storage';
import { calculateUserPoints, getGlobalRank } from '../utils/points';
import { loadFriends, type InvitedFriend } from '../utils/friends';
import type { DayStats, TaskCategory } from '../types';
import { triggerHaptic } from '../utils/telegram';

const CATEGORIES: TaskCategory[] = ['work', 'personal', 'health', 'learning', 'other'];

// Do'stlar reytingi namunasi (Haftalik musobaqa)
interface FriendRank {
  id: string;
  name: string;
  avatar: string;
  points: number;
  streak: number;
  isMe?: boolean;
}

export const ScreenAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>('leaderboard');
  const [scopeTab, setScopeTab] = useState<'friends' | 'global'>('friends');
  const [week, setWeek] = useState<DayStats[]>([]);
  const [catBreakdown, setCatBreakdown] = useState<{ cat: TaskCategory; done: number; total: number }[]>([]);
  const [allTime, setAllTime] = useState({ total: 0, done: 0, streak: 0, points: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const days = getLast7Days();
    setWeek(days);

    const allTasks = loadTasks();
    const done = allTasks.filter((t) => t.done).length;

    // Category breakdown
    const breakdown = CATEGORIES.map((cat) => ({
      cat,
      total: allTasks.filter((t) => t.category === cat).length,
      done: allTasks.filter((t) => t.category === cat && t.done).length,
    })).filter((b) => b.total > 0);
    setCatBreakdown(breakdown);

    // Aniq ballar tizimi (Yuqori=3, O'rta=2, Past=1, Streak=kuniga +2)
    const scoreData = calculateUserPoints();
    setAllTime({
      total: allTasks.length,
      done,
      streak: scoreData.streakDays,
      points: scoreData.totalPoints,
    });
  }, [activeTab]);

  const maxDone = Math.max(...week.map((d) => d.done), 1);
  const weekTotal = week.reduce((a, b) => a + b.total, 0);
  const weekDone = week.reduce((a, b) => a + b.done, 0);
  const weekPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  const firstHalf = week.slice(0, 3).reduce((a, b) => a + b.done, 0);
  const secondHalf = week.slice(4, 7).reduce((a, b) => a + b.done, 0);
  const growth = firstHalf === 0 ? (secondHalf > 0 ? 100 : 0) : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  const isGrowing = growth >= 0;

  // Profil ma'lumotlari
  const userProfile = getCustomProfile();
  const myName = userProfile.displayName || 'Siz (Men)';
  const myAvatar = userProfile.avatarUrl || '';

  // Taklif qilingan do'stlar holati (Boshida 0 ta do'st)
  const [friendsList] = useState<InvitedFriend[]>(loadFriends());

  // Foydalanuvchining real balli (Agar 0 bo'lsa qat'iy 0!)
  const scoreData = calculateUserPoints();
  const myPoints = scoreData.totalPoints;
  const globalInfo = getGlobalRank(myPoints);

  // Musobaqa ro'yxati (Faqat siz va haqiqatda taklif qilingan do'stlar)
  const leaderboard: FriendRank[] = [
    { id: 'me', name: myName, avatar: myAvatar || '★', points: myPoints, streak: scoreData.streakDays, isMe: true },
    ...friendsList.map((f) => ({
      id: f.id,
      name: f.name,
      avatar: f.avatar,
      points: f.points,
      streak: f.streak,
    })),
  ].sort((a, b) => b.points - a.points);

  const myRankIndex = leaderboard.findIndex((u) => u.isMe);
  const myRank = myPoints > 0 ? myRankIndex + 1 : null;

  // Shaxsiy referral link
  const botUsername = 'aitasklistbot';
  const myTelegramId = '5466728043';
  const referralLink = `https://t.me/${botUsername}/app?startapp=ref_${myTelegramId}`;

  const copyReferralLink = () => {
    triggerHaptic('medium');
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareScoreToTelegram = () => {
    triggerHaptic('heavy');
    const shareText = encodeURIComponent(
      `🔥 Men bu hafta To-Do ilovasida ${myPoints} ball to'pladim va #${myRank}-o'rindaman! Meni o'zib ket 👇`
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f6f7fb] pb-28">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-extrabold text-[#7052ff] uppercase tracking-wider">TAHLIL VA MUSOBAQA</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Analitika 📊</h1>
          </div>
        </div>

        {/* ── Tab Switcher (Statistika / Do'stlar Reytingi) ── */}
        <div className="bg-[#121124] p-1.5 rounded-2xl flex items-center mb-4 shadow-md">
          <button
            onClick={() => { triggerHaptic('light'); setActiveTab('stats'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'stats'
                ? 'bg-[#c4f82a] text-[#121124] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Statistika</span>
          </button>
          <button
            onClick={() => { triggerHaptic('light'); setActiveTab('leaderboard'); }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-[#c4f82a] text-[#121124] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy size={14} />
            <span>Reyting</span>
          </button>
        </div>
      </div>

      {/* ══════════════ TAB 1: STATISTIKA ══════════════ */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Weekly Summary Card */}
          <div className="px-5">
            <div
              className="rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl"
              style={{ background: 'linear-gradient(135deg, #1e1552 0%, #2b1d79 100%)' }}
            >
              <p className="text-[10px] text-[#9e91db] uppercase tracking-wider font-extrabold mb-1">Haftalik natija</p>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <p className="text-5xl font-black tracking-tight">{weekPct}%</p>
                  <p className="text-xs text-[#b8ace8] font-semibold mt-1">{weekDone} / {weekTotal} vazifa bajarildi</p>
                </div>
                <div
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full font-black text-xs ${
                    isGrowing ? 'bg-[#c4f82a]/20 text-[#c4f82a]' : 'bg-red-400/20 text-red-300'
                  }`}
                >
                  {isGrowing ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{Math.abs(growth)}%</span>
                </div>
              </div>
              <p className="text-[11px] text-purple-200/80 mt-2.5">
                {isGrowing ? '📈 Oldingi kunlarga nisbatan o\'sish kuzatilmoqda!' : '📉 Kichik pasayish — bugun yangi reja tuzing!'}
              </p>
            </div>
          </div>

          {/* 3 Stat Pills */}
          <div className="px-5">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                <Flame className="mx-auto mb-1 text-amber-500" size={18} />
                <p className="text-lg font-black text-slate-900">{allTime.streak}</p>
                <p className="text-[10px] text-slate-400 font-bold">Kun streak</p>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                <Target className="mx-auto mb-1 text-[#7052ff]" size={18} />
                <p className="text-lg font-black text-slate-900">{allTime.done}</p>
                <p className="text-[10px] text-slate-400 font-bold">Bajarildi</p>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
                <Award className="mx-auto mb-1 text-emerald-500" size={18} />
                <p className="text-lg font-black text-slate-900">{allTime.points} ball</p>
                <p className="text-[10px] text-slate-400 font-bold">Jami ochko</p>
              </div>
            </div>
          </div>

          {/* Bar Chart (7 days) */}
          <div className="px-5">
            <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Kunlik dinamika</h3>
                <span className="text-[10px] font-bold text-slate-400">So'nggi 7 kun</span>
              </div>

              <div className="flex items-end justify-between space-x-2 h-28">
                {week.map((day, i) => {
                  const doneH = day.done ? Math.round((day.done / maxDone) * 100) : 0;
                  const isToday = i === 6;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center space-y-1">
                      <span className="text-[9px] font-bold text-slate-400">{day.done || ''}</span>
                      <div className="w-full relative flex flex-col justify-end" style={{ height: '70px' }}>
                        <div className="absolute bottom-0 w-full rounded-t-lg bg-slate-100 h-full" />
                        {doneH > 0 && (
                          <div
                            className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700"
                            style={{
                              height: `${doneH}%`,
                              background: isToday ? '#c4f82a' : '#7052ff',
                              minHeight: '6px',
                            }}
                          />
                        )}
                      </div>
                      <span className={`text-[10px] font-black ${isToday ? 'text-[#7052ff]' : 'text-slate-400'}`}>
                        {shortDay(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="px-5">
            <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-3">Toifalar ulushi</h3>
              {catBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Hali vazifalar qo'shilmagan</p>
              ) : (
                <div className="space-y-2.5">
                  {catBreakdown.map((item) => {
                    const pct = item.total ? Math.round((item.done / item.total) * 100) : 0;
                    return (
                      <div key={item.cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700">{getCategoryLabel(item.cat)}</span>
                          <span className="font-extrabold text-slate-900">{pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: getCategoryColor(item.cat) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB 2: DO'STLAR REYTINGI ══════════════ */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* ── Sub-tab Switcher: Do'stlarim vs Umumiy Reyting ── */}
          <div className="px-5">
            <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center shadow-inner">
              <button
                onClick={() => { triggerHaptic('light'); setScopeTab('friends'); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  scopeTab === 'friends'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Users size={14} className={scopeTab === 'friends' ? 'text-[#7052ff]' : ''} />
                <span>👥 Do'stlarim</span>
              </button>
              <button
                onClick={() => { triggerHaptic('light'); setScopeTab('global'); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  scopeTab === 'global'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Globe size={14} className={scopeTab === 'global' ? 'text-[#7052ff]' : ''} />
                <span>🌍 Umumiy Reyting</span>
              </button>
            </div>
          </div>

          {/* ══════════════ 1-VARIANT: DO'STLARIM ORASIDA ══════════════ */}
          {scopeTab === 'friends' && (
            <>
              {/* ──────────────── 1-BOSQICH: HALI 1 TA HAM DO'ST CHAQIRILMAGAN HOLAT (0 TA DO'ST) ──────────────── */}
              {friendsList.length === 0 && (
                <div className="space-y-4 px-5">
                  {/* Hero Matchup Arena Card */}
                  <div
                    className="rounded-[2rem] p-6 text-white relative overflow-hidden shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 50%, #2f1d7d 100%)' }}
                  >
                    {/* Glowing background neon blobs */}
                    <div className="absolute top-0 right-0 w-44 h-44 bg-[#c4f82a]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#7052ff]/20 rounded-full blur-2xl pointer-events-none" />

                    {/* Top Pill Badge */}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="inline-flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-200 border border-white/10">
                        <Swords size={12} className="text-[#c4f82a]" />
                        <span>1-ga-1 Do'stona Duel</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#c4f82a] flex items-center space-x-1">
                        <Sparkles size={11} />
                        <span>Yangi musobaqa</span>
                      </span>
                    </div>

                    {/* Sarlavha */}
                    <div className="relative z-10 mb-5">
                      <h2 className="text-xl font-black tracking-tight leading-snug">
                        1-do'stingiz bilan musobaqalashing! ⚔️
                      </h2>
                      <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                        Yolg'iz rejalashdan ko'ra, eng yaqin do'stingiz bilan bellashing va 3 barobar ko'proq natijaga erishing!
                      </p>
                    </div>

                    {/* Visual VS Arena (Siz ⚡ VS ⚡ 1-do'st bo'sh joy) */}
                    <div className="relative z-10 bg-[#0d0a21]/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                      {/* Chap tomon: Siz */}
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-sm shrink-0 overflow-hidden ring-2 ring-[#c4f82a]/40 shadow-md">
                          {myAvatar ? (
                            <img src={myAvatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            myName[0] || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1">
                            <p className="text-xs font-black text-white truncate">{myName}</p>
                            <span className="text-[8px] font-black bg-[#c4f82a] text-[#121124] px-1 rounded">Siz</span>
                          </div>
                          <p className="text-[10px] text-purple-200/90 font-bold mt-0.5">
                            {myPoints > 0 ? `${myPoints} ball` : "0 ball"}
                          </p>
                        </div>
                      </div>

                      {/* Markaziy VS yorlig'i */}
                      <div className="px-2.5 flex flex-col items-center justify-center shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#7052ff] text-[#c4f82a] flex items-center justify-center text-xs font-black ring-4 ring-[#121124] shadow-lg">
                          VS
                        </div>
                      </div>

                      {/* O'ng tomon: 1-do'st (Kutilmoqda / Taklif qilinmagan) */}
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0 justify-end text-right">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-300 truncate">1-do'stingiz</p>
                          <span className="text-[9px] font-extrabold text-[#c4f82a] bg-[#c4f82a]/15 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                            Kutilmoqda...
                          </span>
                        </div>
                        <div className="w-11 h-11 rounded-2xl border-2 border-dashed border-[#c4f82a]/50 bg-white/5 flex items-center justify-center text-purple-300 shrink-0">
                          <UserPlus size={18} className="text-[#c4f82a]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 ta Zamonaviy Afzallik Kartalari (Modern Glass Style) */}
                  <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                        Nega do'st bilan musobaqalashish kerak?
                      </h3>
                      <span className="text-[10px] font-black text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-full">
                        3 ta ustunlik
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* 1-afzallik */}
                      <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-all border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7052ff] flex items-center justify-center shrink-0 font-black shadow-xs">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">3 barobar ko'proq motivatsiya</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Do'stingiz bilan birga rejalashtirish dangasalikni butunlay yengishning eng yaxshi usuli.
                          </p>
                        </div>
                      </div>

                      {/* 2-afzallik */}
                      <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-all border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-black shadow-xs">
                          <Flame size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">1-ga-1 do'stona duel</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Do'stingizning har bir bajargan vazifasini jonli ko'rib, o'zaro o'zib ketishga intilasiz!
                          </p>
                        </div>
                      </div>

                      {/* 3-afzallik */}
                      <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-all border border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black shadow-xs">
                          <Award size={18} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <p className="text-xs font-black text-slate-900">+10 ball start bonusi</p>
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 rounded">Sovg'a 🎁</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            Do'stingiz taklif havolangiz orqali ilovani ochishi bilan ikkalangizga ham bonus beriladi!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bosh Harakat Tugmasi (Vibrant Neon Glow CTA) */}
                    <div className="pt-2 space-y-2">
                      <button
                        onClick={shareScoreToTelegram}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#7052ff] hover:bg-[#6242f6] text-white text-sm font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                        <UserPlus size={18} />
                        <span>Telegram orqali 1-do'stni taklif qilish 🚀</span>
                      </button>

                      {/* Havola nusxalash tugmasi */}
                      <button
                        onClick={copyReferralLink}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-500" />}
                        <span>{copied ? 'Shaxsiy havolangiz nusxalandi!' : 'Shaxsiy taklif havolasidan nusxa olish'}</span>
                      </button>
                    </div>

                    {/* Maxfiylik eslatmasi */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
                      <Lock size={11} className="text-slate-400 shrink-0" />
                      <span>Do'stingiz faqat to'plagan ballaringizni ko'radi, shaxsiy rejalaringiz maxfiy qoladi.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────── 2-BOSQICH: 1 TA DO'ST CHAQIRIB BO'LINGANDAN KEYINGI HOLAT ──────────────── */}
              {friendsList.length > 0 && (
                <div className="space-y-4">
                  {/* Duel banneri */}
                  <div className="px-5">
                    <div
                      className="rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl"
                      style={{ background: 'linear-gradient(135deg, #1e1552 0%, #351e8c 100%)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="inline-flex items-center space-x-1 bg-[#c4f82a] text-[#121124] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5">
                            <Swords size={11} />
                            <span>1-ga-1 Duel Boshlandi!</span>
                          </div>
                          <h2 className="text-xl font-black">{friendsList[0].name} bilan musobaqa!</h2>
                          <p className="text-xs text-[#b8ace8] mt-1">Kim ko'p vazifa bajarsa, o'sha 1-o'rinda!</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-[#c4f82a]/20 border border-[#c4f82a]/30 flex items-center justify-center text-3xl">
                          ⚔️
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-purple-200">Sizning o'rningiz:</span>
                        <span className="font-black text-[#c4f82a] text-sm">
                          {myPoints > 0 ? `#${myRank} - ${myPoints} ball` : "O'rinsiz - 0 ball"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duel reyting jadvali */}
                  <div className="px-5">
                    <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-1.5">
                          <Swords size={16} className="text-[#7052ff]" />
                          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Hozirgi Duel Natijasi</h3>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{leaderboard.length} ishtirokchi</span>
                      </div>

                      <div className="space-y-2.5">
                        {leaderboard.map((item, index) => {
                          const isZero = item.points === 0;
                          const rank = index + 1;
                          const rankDisplay = isZero ? '—' : rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                                item.isMe
                                  ? 'bg-[#121124] text-white shadow-md ring-2 ring-[#c4f82a]'
                                  : 'bg-slate-50 text-slate-800 border border-slate-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-6 text-center font-black text-sm text-slate-400">
                                  {rankDisplay}
                                </div>
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs overflow-hidden shrink-0 ${
                                    item.isMe ? 'bg-[#c4f82a] text-[#121124]' : 'bg-indigo-100 text-[#7052ff]'
                                  }`}
                                >
                                  {item.avatar && (item.avatar.startsWith('data:') || item.avatar.startsWith('http')) ? (
                                    <img src={item.avatar} alt="avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    item.avatar || item.name[0]
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <p className={`text-xs font-black ${item.isMe ? 'text-white' : 'text-slate-900'}`}>
                                      {item.name}
                                    </p>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                      item.isMe
                                        ? (isZero ? 'bg-amber-400/20 text-amber-300' : 'bg-[#c4f82a] text-[#121124]')
                                        : 'bg-indigo-50 text-[#7052ff] border border-indigo-100'
                                    }`}>
                                      {item.isMe ? (isZero ? 'Siz (Ball yo\'q)' : 'Siz') : 'Do\'stingiz'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 mt-0.5">
                                    <Flame size={10} className={item.streak > 0 ? 'text-amber-400' : 'text-slate-500'} />
                                    <span className={`text-[10px] font-semibold ${item.isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                      {item.streak} kun streak
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className={`text-sm font-black ${item.isMe ? (isZero ? 'text-slate-300' : 'text-[#c4f82a]') : 'text-[#7052ff]'}`}>
                                  {item.points}
                                </p>
                                <p className={`text-[9px] font-bold ${item.isMe ? 'text-white/60' : 'text-slate-400'}`}>
                                  ball
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── ENDI BOSHQA DO'STLARNI HAM CHAQIRIB RAQOBATNI KENGAYTIRISHGA UNDASH ── */}
                  <div className="px-5">
                    <div className="bg-gradient-to-br from-[#1e1552] to-[#121124] rounded-[2rem] p-5 text-white shadow-xl relative overflow-hidden space-y-4">
                      <div className="absolute top-0 right-0 w-36 h-36 bg-[#c4f82a]/10 rounded-full blur-2xl pointer-events-none" />

                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-sm">
                          🤝
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white">Jamoa va sog'lom raqobatni kengaytiring! 🤝</h4>
                          <p className="text-[10px] text-purple-200 font-semibold">1 ta do'stingiz bilan musobaqa boshlandi</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Ajoyib! 1 ta do'stingiz bilan musobaqa boshlandi. Endi boshqa do'stlaringizni ham chaqirib, <b>jamoaviy va sog'lom raqobatni kengaytiring!</b> Qancha ko'p do'st qo'shilsa, musobaqa shuncha qizg'in va foydali bo'ladi:
                      </p>

                      <div className="space-y-2 text-xs">
                        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 flex items-start space-x-2.5">
                          <span className="text-sm">👑</span>
                          <div>
                            <p className="font-black text-white text-xs">Guruh yetakchisi bo'ling</p>
                            <p className="text-[11px] text-purple-200 mt-0.5">
                              Do'stlaringiz va sinfdoshlaringiz guruhida 1-o'rinni egallab, Hafta Yetakchisi unvonini qo'lga kiriting.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 flex items-start space-x-2.5">
                          <span className="text-sm">🔥</span>
                          <div>
                            <p className="font-black text-white text-xs">Jamoaviy sog'lom raqobat</p>
                            <p className="text-[11px] text-purple-200 mt-0.5">
                              Katta jamoada har kuni kim eng ko'p vazifa bajarganini kuzatib, bir-biringizni dangasalikdan qutqarasiz.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/10 p-3 rounded-2xl border border-white/10 flex items-start space-x-2.5">
                          <span className="text-sm">🎁</span>
                          <div>
                            <p className="font-black text-white text-xs">Ko'proq bonus ochkolar</p>
                            <p className="text-[11px] text-purple-200 mt-0.5">
                              Har bir yangi taklif qilingan do'st uchun qo'shimcha ballar to'plang va reytingda yuqorilang!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Boshqa do'stlarni ham chaqirish CTA */}
                      <button
                        onClick={shareScoreToTelegram}
                        className="w-full py-3.5 px-4 rounded-2xl bg-[#c4f82a] hover:bg-[#b0e817] text-[#121124] text-xs font-black shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                        <UserPlus size={16} />
                        <span>Boshqa do'stlarni ham chorlash 🚀</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══════════════ 2-VARIANT: UMUMIY REYTING (FAQAT FOYDALANUVCHINING O'ZI) ══════════════ */}
          {scopeTab === 'global' && (
            <div className="space-y-4 px-5">
              {/* Foydalanuvchining umumiy reytingdagi kartasi */}
              <div
                className="rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl"
                style={{ background: 'linear-gradient(135deg, #121124 0%, #1e1552 100%)' }}
              >
                {/* Bezovchi neon orqa fon nuri */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-[#c4f82a]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-200 border border-white/10">
                    <Globe size={12} className="text-[#c4f82a]" />
                    <span>Umumiy Tizim Reytingi</span>
                  </div>
                  <span className={`text-[11px] font-bold ${myPoints > 0 ? 'text-[#c4f82a]' : 'text-slate-400'}`}>
                    {globalInfo.percentileLabel}
                  </span>
                </div>

                {/* Foydalanuvchining o'rni va bali */}
                <div className="flex items-end justify-between my-3">
                  <div>
                    <p className="text-xs text-purple-200 font-semibold mb-1">Umumiy tizimdagi o'rningiz</p>
                    <div className="flex items-baseline space-x-2">
                      <span className={`${myPoints > 0 ? 'text-5xl font-black text-white' : 'text-3xl font-black text-amber-300'}`}>
                        {globalInfo.rankLabel}
                      </span>
                      <span className="text-xs text-purple-300 font-bold">/ {globalInfo.totalUsers} ishtirokchi</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-200 font-semibold mb-1">To'plangan ochkolar</p>
                    <p className={`text-3xl font-black ${myPoints > 0 ? 'text-[#c4f82a]' : 'text-slate-400'}`}>
                      {myPoints} <span className="text-xs font-bold text-white/80">ball</span>
                    </p>
                  </div>
                </div>

                {/* Foydalanuvchi profili qisqacha ko'rinishi */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-xs overflow-hidden shrink-0">
                      {myAvatar ? (
                        <img src={myAvatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        myName[0] || 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{myName}</p>
                      <p className="text-[10px] text-purple-200">{scoreData.streakDays} kun uzluksiz faollik</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-black bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <Sparkles size={12} />
                    <span>{myPoints > 0 ? (globalInfo.rank === 1 ? '👑 Hafta Lideri' : 'Faol ishtirokchi') : 'Yangi ishtirokchi'}</span>
                  </div>
                </div>
              </div>

              {/* 🔒 Maxfiylik va Xavfsizlik Kafolati Kartasi */}
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center space-x-2 text-slate-900">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Shaxsiy Maxfiylik Kafolatlangan</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Boshqa foydalanuvchilar maxfiy saqlanadi</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 flex items-start space-x-2.5">
                  <Lock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Telegram maxfiylik siyosatiga muvofiq, begona foydalanuvchilarning ismlari, rasmlari yoki shaxsiy rejalari <b>hech qachon umumiy ro'yxatda ko'rsatilmaydi</b>. Bu sahifada faqat sizning shaxsiy ballaringiz va barcha <b>{globalInfo.totalUsers} nafar</b> foydalanuvchilar orasidagi o'rningiz ko'rsatiladi.
                  </p>
                </div>
              </div>

              {/* Motivatsion Maqsad Kartasi (0 ball yoki ball to'plangan holatlar uchun) */}
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
                {myPoints === 0 ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Target size={16} className="text-[#7052ff]" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Qanday qilib reytingga kirasiz?</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      Sizda hozircha bajarilgan vazifalar yo'q. Birinchi o'rningizni olish uchun hoziroq biror vazifani bajaring:
                    </p>
                    <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 space-y-1.5 text-xs text-slate-700 font-medium mb-4">
                      <div className="flex justify-between items-center">
                        <span>🔴 Muhim (yuqori) vazifa</span>
                        <b className="text-red-500 font-black">+3 ball</b>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🟡 O'rta vazifa</span>
                        <b className="text-amber-500 font-black">+2 ball</b>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🟢 Past vazifa</span>
                        <b className="text-emerald-600 font-black">+1 ball</b>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-purple-100 text-[11px]">
                        <span>🔥 Kunlik streak bonusi</span>
                        <b className="text-[#7052ff] font-black">har kunga +2 ball</b>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ⚡ Vazifa bajarishingiz bilan darhol <b>{globalInfo.totalUsers} ta</b> ishtirokchi orasidagi o'rningiz ochiladi va yuqorilab boradi!
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Target size={16} className="text-[#7052ff]" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          {globalInfo.rank === 1 ? 'Siz Hafta Liderisiz! 👑' : 'Keyingi Pog\'onaga O\'tish'}
                        </h4>
                      </div>
                      {globalInfo.rank !== 1 && (
                        <span className="text-[10px] font-black text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-md">
                          +3 ball bilan yuqorilang
                        </span>
                      )}
                    </div>

                    {/* Dinamik progress bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-[#7052ff] h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.round((myPoints / 36) * 100))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {globalInfo.rank === 1
                        ? "Tabriklaymiz! Siz barcha foydalanuvchilar orasida 1-o'rindasiz! O'rningizni saqlab qoling."
                        : `Yana bir nechta vazifani bajarsangiz, keyingi ${Math.max(1, Math.round((globalInfo.rank || 480) * 0.7))}-o'ringa ko'tarilasiz!`}
                    </p>

                    <button
                      onClick={shareScoreToTelegram}
                      className="w-full mt-4 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center justify-center space-x-2 transition-all active:scale-95"
                    >
                      <Share2 size={14} className="text-[#c4f82a]" />
                      <span>Umumiy o'rningizni do'stlarga ko'rsating</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
