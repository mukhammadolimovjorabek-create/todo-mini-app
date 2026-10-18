import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Trophy, Mic, BookOpen, PenTool, Users, ListTodo } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { recalculateCoins } from '../utils/gamification';
import { getTestResults } from '../english/utils/storage';

interface ScreenHubProps {
  userName: string;
  userAvatar?: string;
  userInitial: string;
  pendingTasks: number;
  progressPct: number;
  onSelectTodo: () => void;
  onSelectEnglish: () => void;
  onOpenAiCoach: () => void;
  onOpenLeaderboard: () => void;
}

export const ScreenHub: React.FC<ScreenHubProps> = ({
  userName,
  userAvatar,
  userInitial,
  pendingTasks,
  progressPct,
  onSelectTodo,
  onSelectEnglish,
  onOpenAiCoach,
  onOpenLeaderboard,
}) => {
  const coins = recalculateCoins();
  const englishResults = getTestResults();
  const lastResult = englishResults[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech';

  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex flex-col justify-between p-5 pb-8 select-none animate-in fade-in duration-300">
      <div className="space-y-5">
        {/* ── Top Header: Greeting + Coins & Avatar ── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full mb-1">
              <Sparkles size={11} className="text-[#7052ff]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff]">
                2-in-1 Ta'lim & Intizom Platformasi
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bugun qaysi yo'nalishda o'z ustimizda ishlaymiz?
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1 bg-amber-500/15 border border-amber-400/30 px-3 py-1.5 rounded-full">
              <span className="text-sm">🪙</span>
              <span className="text-xs font-black text-amber-800">{coins}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#181630] text-[#c4f82a] font-black text-sm flex items-center justify-center overflow-hidden border-2 border-indigo-200 shadow-xs">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1-YO'NALISH: IELTS & MILLIY MULTILEVEL (CEFR) AKADEMIYASI         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            triggerHaptic('heavy');
            onSelectEnglish();
          }}
          className="rounded-[2.2rem] p-6 text-white shadow-xl cursor-pointer border border-indigo-400/30 hover:border-indigo-400/60 active:scale-[0.99] transition-all relative overflow-hidden space-y-4 group"
          style={{ background: 'linear-gradient(135deg, #100b2e 0%, #1e135e 55%, #341299 100%)' }}
        >
          {/* Ambient neon glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#c4f82a]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badges */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#c4f82a] text-[#121124] px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(196,248,42,0.5)]">
                🎓 INGLIZ TILI MARKAZI
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-indigo-200 border border-white/15 px-2.5 py-0.5 rounded-full">
                🇬🇧 IELTS 9.0
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                🇺🇿 CEFR B1–C1
              </span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight leading-snug group-hover:text-[#c4f82a] transition-colors">
              IELTS & Multilevel Practice
            </h2>
            <p className="text-xs text-purple-200/90 leading-relaxed">
              Rasmiy imtihon formatida AI Examiner bilan Speaking, Academic Reading (40 savol), Writing Task 1–2 tahlili va Jonli Sherik bilan suhbat.
            </p>
          </div>

          {/* 4 Core Feature Chips */}
          <div className="grid grid-cols-2 gap-2 relative z-10 pt-0.5">
            <div className="flex items-center space-x-2 bg-white/10 border border-white/10 rounded-2xl px-3 py-2">
              <Mic size={15} className="text-[#c4f82a] shrink-0" />
              <span className="text-[11px] font-extrabold text-white truncate">AI Speaking (Part 1-3)</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 border border-white/10 rounded-2xl px-3 py-2">
              <Users size={15} className="text-sky-300 shrink-0" />
              <span className="text-[11px] font-extrabold text-white truncate">Jonli Sherik (24/7)</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 border border-white/10 rounded-2xl px-3 py-2">
              <BookOpen size={15} className="text-amber-300 shrink-0" />
              <span className="text-[11px] font-extrabold text-white truncate">Reading (3 Passage)</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 border border-white/10 rounded-2xl px-3 py-2">
              <PenTool size={15} className="text-pink-300 shrink-0" />
              <span className="text-[11px] font-extrabold text-white truncate">Writing Task 1 & 2</span>
            </div>
          </div>

          {/* Footer Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
            <div className="text-[11px] text-purple-200/90 font-semibold">
              {lastResult ? (
                <span>
                  Oxirgi natija:{' '}
                  <strong className="text-[#c4f82a] font-black">
                    {lastResult.title.includes('Multilevel')
                      ? `${Math.round(lastResult.overallBand)}/75 ball`
                      : `Band ${lastResult.overallBand.toFixed(1)}`}
                  </strong>
                </span>
              ) : (
                <span>Rasmiy baholash mezonlari asosida</span>
              )}
            </div>

            <div className="eng-cta inline-flex items-center space-x-1.5 bg-[#c4f82a] text-[#121124] px-4 py-2.5 rounded-full text-xs font-black shadow-md">
              <span>Sinovni boshlash</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2-YO'NALISH: KUNLIK INTIZOM, REJALAR & AI MURABBIY (SMART TO-DO)  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            triggerHaptic('medium');
            onSelectTodo();
          }}
          className="rounded-[2.2rem] p-6 bg-white border-2 border-slate-200/80 hover:border-[#7052ff]/50 shadow-lg cursor-pointer active:scale-[0.99] transition-all relative overflow-hidden space-y-4 group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#181630] text-[#c4f82a] px-2.5 py-0.5 rounded-full">
                  📋 KUNLIK INTIZOM
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 text-[#7052ff] border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Smart To-Do & AI
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug group-hover:text-[#7052ff] transition-colors">
                Shaxsiy Rejalar & Maqsadlar
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kunlik va haftalik vazifalarni boshqaring, AI Murabbiy yordamida reja tuzing va tangalar yig'ib reytingda ko'tariling.
              </p>
            </div>

            {/* Live Progress Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0 bg-slate-900 rounded-2xl shadow-md">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={ringRadius}
                  stroke="#c4f82a"
                  strokeWidth="5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="absolute text-xs font-black text-white">{progressPct}%</span>
            </div>
          </div>

          {/* Quick Sub-buttons for AI Coach & Leaderboard */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onSelectTodo();
              }}
              className="flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl py-2 px-2 text-[11px] font-extrabold transition-all active:scale-95"
            >
              <ListTodo size={13} className="text-[#7052ff] shrink-0" />
              <span className="truncate">Vazifalar ({pendingTasks})</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onOpenAiCoach();
              }}
              className="flex items-center justify-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/70 rounded-xl py-2 px-2 text-[11px] font-extrabold transition-all active:scale-95"
            >
              <Sparkles size={13} className="text-purple-600 shrink-0" />
              <span className="truncate">AI Murabbiy</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onOpenLeaderboard();
              }}
              className="flex items-center justify-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 rounded-xl py-2 px-2 text-[11px] font-extrabold transition-all active:scale-95"
            >
              <Trophy size={13} className="text-amber-600 shrink-0" />
              <span className="truncate">Reyting</span>
            </button>
          </div>

          {/* Bottom CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 flex items-center space-x-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>
                {pendingTasks > 0 ? `${pendingTasks} ta bajarilmagan vazifa bor` : 'Barcha vazifalar bajarilgan!'}
              </span>
            </span>

            <div className="inline-flex items-center space-x-1.5 bg-[#181630] group-hover:bg-[#7052ff] text-white px-4 py-2 rounded-full text-xs font-black transition-colors shadow-xs">
              <span>Rejalarga o'tish</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-slate-400 font-medium pt-4">
        Istalgan vaqtda bo'limlar orasida erkin almashishingiz mumkin
      </p>
    </div>
  );
};
