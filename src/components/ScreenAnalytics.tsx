import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, Target, Zap, Calendar } from 'lucide-react';
import { getLast7Days, loadTasks, getCategoryColor, getCategoryLabel, shortDay } from '../utils/storage';
import type { DayStats, TaskCategory } from '../types';

const CATEGORIES: TaskCategory[] = ['work', 'personal', 'health', 'learning', 'other'];

export const ScreenAnalytics: React.FC = () => {
  const [week, setWeek] = useState<DayStats[]>([]);
  const [catBreakdown, setCatBreakdown] = useState<{ cat: TaskCategory; done: number; total: number }[]>([]);
  const [allTime, setAllTime] = useState({ total: 0, done: 0, streak: 0 });

  useEffect(() => {
    const days = getLast7Days();
    setWeek(days);

    const allTasks = loadTasks();
    const done = allTasks.filter((t) => t.done).length;

    // Category breakdown (all-time)
    const breakdown = CATEGORIES.map((cat) => ({
      cat,
      total: allTasks.filter((t) => t.category === cat).length,
      done: allTasks.filter((t) => t.category === cat && t.done).length,
    })).filter((b) => b.total > 0);
    setCatBreakdown(breakdown);

    // Streak: count consecutive days with at least 1 done task
    let streak = 0;
    const sortedDays = [...days].reverse();
    for (const d of sortedDays) {
      if (d.done > 0) streak++;
      else break;
    }

    setAllTime({ total: allTasks.length, done, streak });
  }, []);

  const maxDone = Math.max(...week.map((d) => d.done), 1);
  const weekTotal = week.reduce((a, b) => a + b.total, 0);
  const weekDone = week.reduce((a, b) => a + b.done, 0);
  const weekPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  // Growth: compare last 3 days vs first 3 days of week
  const firstHalf = week.slice(0, 3).reduce((a, b) => a + b.done, 0);
  const secondHalf = week.slice(4, 7).reduce((a, b) => a + b.done, 0);
  const growth = firstHalf === 0 ? (secondHalf > 0 ? 100 : 0) : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  const isGrowing = growth >= 0;

  return (
    <div className="flex flex-col min-h-full bg-[#f0f2ff] pb-24">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">So'nggi 7 kun</p>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4">Analitika 📊</h1>

        {/* ── Weekly Summary Card ── */}
        <div
          className="rounded-3xl p-5 text-white relative overflow-hidden shadow-lg mb-4"
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 60%, #6366f1 100%)' }}
        >
          <div className="absolute -top-5 -right-5 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-1/2 w-20 h-20 rounded-full bg-white/5" />
          <p className="text-xs text-white/70 uppercase tracking-wider font-semibold mb-2">Haftalik yakunlar</p>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="text-4xl font-black">{weekPct}%</p>
              <p className="text-sm text-white/80 mt-1">{weekDone} / {weekTotal} vazifa</p>
            </div>
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${
                isGrowing ? 'bg-emerald-400/30 text-emerald-200' : 'bg-red-400/30 text-red-200'
              }`}
            >
              {isGrowing ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-extrabold">{Math.abs(growth)}%</span>
            </div>
          </div>
          <p className="text-xs text-white/60 mt-2 relative z-10">
            {isGrowing ? '📈 O\'tgan haftaga nisbatan o\'sish bor!' : '📉 Avvalgi kunlarga nisbatan kamayish bor'}
          </p>
        </div>

        {/* ── 3 Stat Pills ── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
            <Zap className="mx-auto mb-1 text-amber-500" size={20} />
            <p className="text-lg font-black text-slate-900">{allTime.streak}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Kun streak</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
            <Target className="mx-auto mb-1 text-indigo-500" size={20} />
            <p className="text-lg font-black text-slate-900">{allTime.done}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Jami bajarildi</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-xs border border-slate-100">
            <Award className="mx-auto mb-1 text-pink-500" size={20} />
            <p className="text-lg font-black text-slate-900">
              {allTime.total ? Math.round((allTime.done / allTime.total) * 100) : 0}%
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">Umumiy samaradorlik</p>
          </div>
        </div>
      </div>

      {/* ── Bar Chart (7 days) ── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Kunlik bajarish</h3>
            <div className="flex items-center space-x-3 text-xs text-slate-400 font-semibold">
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span>Bajarildi</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200" />
                <span>Jami</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between space-x-2 h-32">
            {week.map((day, i) => {
              const totalH = day.total ? Math.round((day.total / maxDone) * 100) : 4;
              const doneH = day.done ? Math.round((day.done / maxDone) * 100) : 0;
              const isToday = i === 6;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400">{day.done || ''}</p>
                  <div className="w-full relative flex flex-col justify-end" style={{ height: '88px' }}>
                    {/* Total bar (background) */}
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg ${isToday ? 'bg-indigo-100' : 'bg-slate-100'}`}
                      style={{ height: `${totalH}%`, minHeight: '6px' }}
                    />
                    {/* Done bar (foreground) */}
                    {doneH > 0 && (
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700"
                        style={{
                          height: `${doneH}%`,
                          background: isToday
                            ? 'linear-gradient(180deg, #ec4899, #6366f1)'
                            : 'linear-gradient(180deg, #a5b4fc, #6366f1)',
                          minHeight: '8px',
                        }}
                      />
                    )}
                  </div>
                  <p className={`text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {shortDay(day.date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Category Breakdown ── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4">Toifalar bo'yicha</h3>
          {catBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Hali vazifalar yo'q</p>
          ) : (
            <div className="space-y-3">
              {catBreakdown.sort((a, b) => b.total - a.total).map((item) => {
                const pct = item.total ? Math.round((item.done / item.total) * 100) : 0;
                return (
                  <div key={item.cat}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700">
                        {item.cat === 'work' ? '💼' : item.cat === 'personal' ? '🌟' : item.cat === 'health' ? '💪' : item.cat === 'learning' ? '📚' : '✨'} {getCategoryLabel(item.cat)}
                      </span>
                      <span className="font-extrabold" style={{ color: getCategoryColor(item.cat) }}>{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: getCategoryColor(item.cat) }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.done}/{item.total} bajarildi</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Calendar Heatmap (last 7 days) ── */}
      <div className="px-5">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center space-x-2">
            <Calendar size={15} className="text-indigo-500" />
            <span>Faollik ko'rsatkichi</span>
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {week.map((day, i) => {
              const pct = day.total ? day.done / day.total : 0;
              const isToday = i === 6;
              return (
                <div key={day.date} className="flex flex-col items-center space-y-1">
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-[10px] font-extrabold transition-all ${
                      isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                    }`}
                    style={{
                      backgroundColor: pct === 0 ? '#f1f5f9' : `rgba(99,102,241,${0.2 + pct * 0.8})`,
                      color: pct > 0.5 ? 'white' : '#6366f1',
                    }}
                  >
                    {day.done || ''}
                  </div>
                  <span className={`text-[9px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {shortDay(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-3">
            Quyuqroq rang = ko'proq bajarilgan vazifa
          </p>
        </div>
      </div>
    </div>
  );
};
