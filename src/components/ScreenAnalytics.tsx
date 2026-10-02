import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Share2, 
  Trophy, 
  Crown, 
  Copy, 
  Check, 
  Flame,
  Users,
  Globe,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { getLast7Days, loadTasks, getCategoryColor, getCategoryLabel, shortDay, getCustomProfile } from '../utils/storage';
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
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>('stats');
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

    // Streak
    let streak = 0;
    const sortedDays = [...days].reverse();
    for (const d of sortedDays) {
      if (d.done > 0) streak++;
      else break;
    }

    // Ballarni hisoblash (PDF Phase 6 qoidasi: Yuqori=3, O'rta=2, Past=1, Streak=kuniga +1)
    let calculatedPoints = 0;
    allTasks.filter((t) => t.done).forEach((t) => {
      if (t.priority === 'high') calculatedPoints += 3;
      else if (t.priority === 'medium') calculatedPoints += 2;
      else calculatedPoints += 1;
    });
    calculatedPoints += streak * 2;

    setAllTime({ total: allTasks.length, done, streak, points: calculatedPoints });
  }, []);

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

  // Do'stlar ro'yxati (Foydalanuvchi o'z profili va ballari bilan)
  const myPoints = Math.max(allTime.points, 24);
  const leaderboard: FriendRank[] = [
    { id: '1', name: 'Jasur', avatar: 'J', points: 68, streak: 6 },
    { id: '2', name: myName, avatar: myAvatar || '★', points: myPoints, streak: Math.max(allTime.streak, 2), isMe: true },
    { id: '3', name: 'Malika', avatar: 'M', points: 34, streak: 3 },
    { id: '4', name: 'Bekzod', avatar: 'B', points: 22, streak: 1 },
  ].sort((a, b) => b.points - a.points);

  const myRank = leaderboard.findIndex((u) => u.isMe) + 1;

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
              {/* Haftalik musobaqa banneri */}
              <div className="px-5">
                <div
                  className="rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #1e1552 0%, #351e8c 100%)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center space-x-1 bg-[#c4f82a] text-[#121124] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5">
                        <Trophy size={11} />
                        <span>Do'stlar Musobaqasi</span>
                      </div>
                      <h2 className="text-xl font-black">Hafta Lideri bo'ling!</h2>
                      <p className="text-xs text-[#b8ace8] mt-1">Siz va taklif qilgan do'stlaringiz reytingi</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[#c4f82a]/20 border border-[#c4f82a]/30 flex items-center justify-center text-3xl">
                      🥇
                    </div>
                  </div>

                  {/* Sizning o'rningiz */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-purple-200">Sizning o'rningiz (do'stlar orasida):</span>
                    <span className="font-black text-[#c4f82a] text-sm">#{myRank} - {myPoints} ball</span>
                  </div>
                </div>
              </div>

              {/* Do'stlar reytingi ro'yxati (Faqat siz va taklif qilingan do'stlar) */}
              <div className="px-5">
                <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Crown size={16} className="text-amber-500" />
                      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Do'stlaringiz Natijalari</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{leaderboard.length} ta do'st</span>
                  </div>

                  {/* Leaderboard ro'yxati */}
                  <div className="space-y-2.5">
                    {leaderboard.map((item, index) => {
                      const rank = index + 1;
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
                            {/* O'rin medali */}
                            <div className="w-6 text-center font-black text-sm">
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                            </div>

                            {/* Avatar (Rasm yoki Harf) */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs overflow-hidden shrink-0 ${
                                item.isMe
                                  ? 'bg-[#c4f82a] text-[#121124]'
                                  : 'bg-indigo-100 text-[#7052ff]'
                              }`}
                            >
                              {item.avatar && (item.avatar.startsWith('data:') || item.avatar.startsWith('http')) ? (
                                <img src={item.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                item.avatar || item.name[0]
                              )}
                            </div>

                            {/* Ism va streak */}
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <p className={`text-xs font-black ${item.isMe ? 'text-white' : 'text-slate-900'}`}>
                                  {item.name}
                                </p>
                                {item.isMe ? (
                                  <span className="text-[9px] font-black bg-[#c4f82a] text-[#121124] px-1.5 py-0.2 rounded-md">
                                    Siz
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold bg-indigo-50 text-[#7052ff] px-1.5 py-0.2 rounded-md border border-indigo-100">
                                    Do'stingiz
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5">
                                <Flame size={10} className="text-amber-400" />
                                <span className={`text-[10px] font-semibold ${item.isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                  {item.streak} kun streak
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Ball */}
                          <div className="text-right">
                            <p className={`text-sm font-black ${item.isMe ? 'text-[#c4f82a]' : 'text-[#7052ff]'}`}>
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

                  {/* Qanday ball to'planadi tushuntirish */}
                  <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">🎯 Qanday qilib ball to'planadi?</p>
                    <p>• 🔴 Yuqori vazifa: <b>+3 ball</b></p>
                    <p>• 🟡 O'rta vazifa: <b>+2 ball</b></p>
                    <p>• 🟢 Past vazifa: <b>+1 ball</b></p>
                    <p>• 🔥 Har bir ketma-ket faol kun: <b>+2 bonus</b></p>
                  </div>
                </div>
              </div>

              {/* ── YANADA TUSHUNARLI VA JOZIBALI QO'LLANMA KARTASI ── */}
              <div className="px-5">
                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-4">
                  {/* Sarlavha va Maqsad */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-[#121124] text-[#c4f82a] flex items-center justify-center text-xs font-black">💡</span>
                      <h3 className="font-black text-slate-900 text-sm">Do'stni qanday taklif qilasiz?</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Yolg'iz rejalashtirishdan zerikdingizmi? <b>Do'stlaringiz bilan musobaqalashing!</b> Kim ko'proq vazifa bajarsa, o'sha 1-o'ringa ko'tariladi.
                    </p>
                  </div>

                  {/* 3 ta aniq vertikal qadam */}
                  <div className="space-y-2.5">
                    {/* 1-qadam */}
                    <div className="flex items-start space-x-3 bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
                      <div className="w-8 h-8 rounded-xl bg-[#7052ff] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Do'stingizga havola yuboring</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Pastdagi tugmani bosing va Telegram orqali do'stingizga yoki guruhga taklifnoma tashlang.
                        </p>
                      </div>
                    </div>

                    {/* 2-qadam */}
                    <div className="flex items-start space-x-3 bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Do'stingiz havolani ochadi</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Do'stingiz Telegram havolani ochishi bilan, u sizning do'stlar ro'yxatingizda avtomatik paydo bo'ladi.
                        </p>
                      </div>
                    </div>

                    {/* 3-qadam */}
                    <div className="flex items-start space-x-3 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                      <div className="w-8 h-8 rounded-xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Kim ko'p vazifa bajarsa — o'sha G'olib!</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Har bir bajarilgan vazifa sizga ochko beradi va siz do'stingizdan o'zib ketasiz! 🏆
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Katta Bosh Harakat Tugmasi (Katta Neon CTA) */}
                  <button
                    onClick={shareScoreToTelegram}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#7052ff] hover:bg-[#6242f6] text-white text-sm font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <Share2 size={17} />
                    <span>Telegram orqali do'stlarni chorlash 🚀</span>
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
              </div>
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
                  <span className="text-[11px] font-bold text-[#c4f82a]">
                    Top 5%
                  </span>
                </div>

                {/* Foydalanuvchining o'rni va bali */}
                <div className="flex items-end justify-between my-3">
                  <div>
                    <p className="text-xs text-purple-200 font-semibold mb-1">Umumiy tizimdagi o'rningiz</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-5xl font-black tracking-tight text-white">#18</span>
                      <span className="text-xs text-purple-300 font-bold">/ 840+ ishtirokchi</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-200 font-semibold mb-1">To'plangan ochkolar</p>
                    <p className="text-3xl font-black text-[#c4f82a]">{myPoints} <span className="text-xs font-bold text-white/80">ball</span></p>
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
                      <p className="text-[10px] text-purple-200">{allTime.streak} kun uzluksiz faollik</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-black bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <Sparkles size={12} />
                    <span>Faol ishtirokchi</span>
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
                    Telegram maxfiylik siyosatiga muvofiq, begona foydalanuvchilarning ismlari, rasmlari yoki shaxsiy rejalari <b>hech qachon umumiy ro'yxatda ko'rsatilmaydi</b>. Bu sahifada faqat sizning shaxsiy ballaringiz va barcha foydalanuvchilar orasidagi o'rningiz ko'rsatiladi.
                  </p>
                </div>
              </div>

              {/* Motivatsion Yangi Maqsad Kartasi */}
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Target size={16} className="text-[#7052ff]" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Keyingi Maqsad: Top 3%</h4>
                  </div>
                  <span className="text-[10px] font-black text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-md">+15 ball kerak</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-[#7052ff] h-full rounded-full w-[78%]" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Har kuni kamida 3 ta rejalashtirilgan vazifani bajarsangiz, keyingi dushanbagacha Top 10 talikka ko'tarilasiz!
                </p>

                <button
                  onClick={shareScoreToTelegram}
                  className="w-full mt-4 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <Share2 size={14} className="text-[#c4f82a]" />
                  <span>Umumiy o'rningizni do'stlarga ko'rsating</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
