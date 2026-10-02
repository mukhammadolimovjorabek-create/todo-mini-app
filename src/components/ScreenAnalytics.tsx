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
  Flame 
} from 'lucide-react';
import { getLast7Days, loadTasks, getCategoryColor, getCategoryLabel, shortDay } from '../utils/storage';
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

  // Do'stlar ro'yxati (Foydalanuvchi balli bilan birlashgan)
  const myPoints = Math.max(allTime.points, 24);
  const leaderboard: FriendRank[] = [
    { id: '1', name: 'Jasur', avatar: 'J', points: 68, streak: 6 },
    { id: '2', name: 'Siz (Men)', avatar: '★', points: myPoints, streak: Math.max(allTime.streak, 2), isMe: true },
    { id: '3', name: 'Malika', avatar: 'M', points: 34, streak: 3 },
    { id: '4', name: 'Bekzod', avatar: 'B', points: 22, streak: 1 },
    { id: '5', name: 'Aziz', avatar: 'A', points: 15, streak: 0 },
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
            <span>Do'stlar Reytingi 🏆</span>
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
                    <span>Haftalik Musobaqa</span>
                  </div>
                  <h2 className="text-xl font-black">Hafta Lideri bo'ling!</h2>
                  <p className="text-xs text-[#b8ace8] mt-1">Har bir bajarilgan vazifa sizga ochko beradi</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#c4f82a]/20 border border-[#c4f82a]/30 flex items-center justify-center text-3xl">
                  🥇
                </div>
              </div>

              {/* Sizning o'rningiz */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-purple-200">Sizning joriy o'rningiz:</span>
                <span className="font-black text-[#c4f82a] text-sm">#{myRank} - {myPoints} ball</span>
              </div>
            </div>
          </div>

          {/* Do'stlarni taklif qilish va Ulashish tugmalari */}
          <div className="px-5 grid grid-cols-2 gap-2.5">
            <button
              onClick={shareScoreToTelegram}
              className="py-3 px-4 rounded-2xl bg-[#7052ff] hover:bg-[#6242f6] text-white text-xs font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Share2 size={15} />
              <span>Natijani ulashish</span>
            </button>
            <button
              onClick={copyReferralLink}
              className="py-3 px-4 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-black shadow-xs flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} className="text-slate-500" />}
              <span>{copied ? 'Havola olindi!' : 'Havola olish'}</span>
            </button>
          </div>

          {/* Reyting shohsupasi / Top 3 */}
          <div className="px-5">
            <div className="bg-white rounded-[2rem] p-5 shadow-xs border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-1.5">
                  <Crown size={16} className="text-amber-500" />
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Top Ishtirokchilar</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">Har dushanba yangilanadi</span>
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

                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            item.isMe
                              ? 'bg-[#c4f82a] text-[#121124]'
                              : 'bg-indigo-100 text-[#7052ff]'
                          }`}
                        >
                          {item.avatar}
                        </div>

                        {/* Ism va streak */}
                        <div>
                          <p className={`text-xs font-black ${item.isMe ? 'text-white' : 'text-slate-900'}`}>
                            {item.name}
                          </p>
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
        </div>
      )}
    </div>
  );
};
