import React from 'react';
import { Award, Zap, Target, ShieldCheck, CheckCircle2, Flame } from 'lucide-react';
import type { TelegramUser } from '../types';
import { loadTasks, getLast7Days, today } from '../utils/storage';

interface Props {
  user: TelegramUser;
}

export const ScreenProfile: React.FC<Props> = ({ user }) => {
  const allTasks = loadTasks();
  const done = allTasks.filter((t) => t.done).length;
  const total = allTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Streak
  const days = getLast7Days().reverse();
  let streak = 0;
  for (const d of days) {
    if (d.done > 0) streak++;
    else break;
  }

  const todayTasks = allTasks.filter((t) => t.createdAt === today());
  const todayDone = todayTasks.filter((t) => t.done).length;

  // Badge logic
  const badges: { icon: string; label: string; earned: boolean }[] = [
    { icon: '🚀', label: 'Tezkor start', earned: total >= 1 },
    { icon: '🔥', label: '3 kun streak', earned: streak >= 3 },
    { icon: '🏆', label: '10 vazifa', earned: done >= 10 },
    { icon: '💎', label: '50 vazifa', earned: done >= 50 },
    { icon: '⚡', label: 'Bir kunda 5ta', earned: todayDone >= 5 },
    { icon: '🎯', label: '100% kun', earned: todayTasks.length > 0 && todayDone === todayTasks.length },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#f0f2ff] pb-28 select-none">
      {/* ── Header gradient card ── */}
      <div
        className="relative px-6 pt-10 pb-8 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full bg-white/5" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white/30 shadow-xl bg-white/20">
            {user.photo_url ? (
              <img src={user.photo_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black">
                {user.first_name[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-extrabold">{user.first_name} {user.last_name || ''}</h2>
            <p className="text-white/70 text-sm">@{user.username || 'user'}</p>
            <div className="flex items-center space-x-1.5 mt-1.5 bg-white/20 rounded-full px-3 py-1 w-fit">
              <Flame size={13} className="text-amber-300" />
              <span className="text-xs font-bold">{streak} kun streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="px-5 -mt-5 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Target className="text-indigo-500" size={20} />, val: total, label: "Jami vazifa" },
            { icon: <CheckCircle2 className="text-emerald-500" size={20} />, val: done, label: "Bajarildi" },
            { icon: <Zap className="text-amber-500" size={20} />, val: `${pct}%`, label: "Samaradorlik" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-slate-100">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xl font-black text-slate-900">{s.val}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── All-time progress bar ── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Umumiy progress</h3>
            <span className="text-xs font-black text-indigo-600">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #6366f1, #ec4899)',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-2">
            <span>{done} bajarildi</span>
            <span>{total - done} qoldi</span>
          </div>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center space-x-2">
            <Award size={16} className="text-amber-500" />
            <span>Yutuqlar (Badges)</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className={`flex flex-col items-center space-y-1.5 p-3 rounded-2xl transition-all ${
                  b.earned
                    ? 'bg-indigo-50 border border-indigo-100'
                    : 'bg-slate-50 border border-slate-100 opacity-40'
                }`}
              >
                <span className="text-2xl">{b.icon}</span>
                <p className="text-[10px] font-bold text-slate-700 text-center leading-tight">{b.label}</p>
                {b.earned && (
                  <CheckCircle2 size={12} className="text-indigo-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="px-5">
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-3">
          <div className="flex items-center space-x-3 text-xs text-slate-600">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <span>Ma'lumotlar qurilmangizda (localStorage) xavfsiz saqlanadi</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-600">
            <Award size={16} className="text-indigo-500 shrink-0" />
            <span>AI tahlil — 100% bepul, hech qanday to'lov yo'q</span>
          </div>
        </div>
      </div>
    </div>
  );
};
