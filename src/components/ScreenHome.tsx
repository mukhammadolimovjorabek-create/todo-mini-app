import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Flag, Tag, X, Clock, Zap } from 'lucide-react';
import type { Task, TaskCategory, TaskPriority, TaskScope } from '../types';
import {
  getActiveTasks, addTask, toggleTask, deleteTask,
  getCategoryColor, getCategoryLabel,
  getPriorityColor, getPriorityLabel,
  updateStats, getLast7Days,
} from '../utils/storage';
import { triggerHaptic } from '../utils/telegram';
import {
  getUserCoins, getTaskCoins, recalculateCoins,
  checkAndUnlockBadges, markBadgeAlertSeen,
  type BadgeItem
} from '../utils/gamification';
import { BadgeUnlockModal } from './BadgeUnlockModal';
import { SwipeableTaskItem } from './SwipeableTaskItem';
import { HeroHookSection } from './HeroHookSection';
import { UkFlagWave, UzFlagWave } from '../english/components/UzFlagWave';
import { SpeakingWaveform } from '../english/components/AnimatedSectionIcons';

const CATEGORIES: TaskCategory[] = ['work', 'personal', 'health', 'learning', 'other'];
const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

const CAT_EMOJIS: Record<TaskCategory, string> = {
  work: '💼', personal: '🌟', health: '💪', learning: '📚', other: '✨',
};

// Quick duration presets (minutes)
const DURATION_PRESETS = [15, 30, 60, 90, 120];

interface ScreenHomeProps {
  userName: string;
  onTasksChange?: () => void;
  onOpenEnglish?: (exam?: 'ielts' | 'multilevel' | null) => void;
  onBackToHub?: () => void;
}

export const ScreenHome: React.FC<ScreenHomeProps> = ({ userName, onTasksChange, onOpenEnglish, onBackToHub: _onBackToHub }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeScopeTab, setActiveScopeTab] = useState<'daily' | 'weekly'>('daily');
  const [newScope, setNewScope] = useState<TaskScope>('daily');
  const [filterCat, setFilterCat] = useState<TaskCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<TaskCategory>('personal');
  const [newDuration, setNewDuration] = useState<number | null>(null);

  // Tangalar va Nishon ochilish holatlari
  const [coins, setCoins] = useState(() => recalculateCoins());
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeItem | null>(null);
  const [floatingCoin, setFloatingCoin] = useState<{ amount: number; key: number } | null>(null);
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  const [displayPct, setDisplayPct] = useState<number>(0);

  // Kreativ Holographic Portal Button holatlari (IELTS ⇄ CEFR auto-morph & drawer)
  const [morphMode, setMorphMode] = useState<'ielts' | 'cefr'>('ielts');
  const [showExamPortal, setShowExamPortal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMorphMode((prev) => (prev === 'ielts' ? 'cefr' : 'ielts'));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 3D Tilt & Spotlight for IELTS Card (#10)
  const ieltsCardRef = useRef<HTMLDivElement>(null);
  const [ieltsTilt, setIeltsTilt] = useState({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50, active: false });

  const handleIeltsPointerMove = (clientX: number, clientY: number) => {
    if (!ieltsCardRef.current) return;
    const rect = ieltsCardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const rotateY = ((pctX - 50) / 50) * 8; // -8deg to +8deg
    const rotateX = -((pctY - 50) / 50) * 7; // -7deg to +7deg

    setIeltsTilt({ rotateX, rotateY, spotX: pctX, spotY: pctY, active: true });
  };

  const resetIeltsTilt = () => {
    setIeltsTilt((prev) => ({ ...prev, rotateX: 0, rotateY: 0, active: false }));
  };

  const reload = useCallback(() => {
    setTasks(getActiveTasks());
    setCoins(recalculateCoins());
  }, []);

  useEffect(() => {
    reload();
    updateStats();
  }, [reload]);

  const handleToggle = (id: string) => {
    triggerHaptic('medium');
    const taskBefore = tasks.find((t) => t.id === id);
    toggleTask(id);
    setTasks(getActiveTasks());
    onTasksChange?.();

    if (taskBefore) {
      const willBeDone = !taskBefore.done;
      const coinDiff = getTaskCoins(taskBefore.priority);

      if (willBeDone) {
        setFloatingCoin({ amount: coinDiff, key: Date.now() });
        setConfettiKey(Date.now());
        setTimeout(() => setFloatingCoin(null), 1800);
        setTimeout(() => setConfettiKey(null), 1400);

        // Nishonlar holatini tekshirish
        const result = checkAndUnlockBadges();
        if (result.newBadges.length > 0) {
          const nextBadge = result.newBadges[0];
          markBadgeAlertSeen(nextBadge.id);
          setUnlockedBadge(nextBadge);
        }
      }

      setCoins(recalculateCoins());
    }
  };

  const handleQuickAddPreset = (text: string, priority: TaskPriority, category: TaskCategory, duration: number) => {
    triggerHaptic('heavy');
    addTask(text, priority, category, duration, activeScopeTab);
    reload();
    updateStats();
    onTasksChange?.();
    const result = checkAndUnlockBadges();
    if (result.newBadges.length > 0) {
      const nextBadge = result.newBadges[0];
      markBadgeAlertSeen(nextBadge.id);
      setUnlockedBadge(nextBadge);
      setCoins(getUserCoins());
    }
  };

  const handleDelete = (id: string) => {
    triggerHaptic('heavy');
    deleteTask(id);
    setTasks(getActiveTasks());
    setCoins(recalculateCoins());
    onTasksChange?.();
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    triggerHaptic('heavy');
    addTask(newText.trim(), newPriority, newCategory, newDuration ?? undefined, newScope);
    setNewText('');
    setNewDuration(null);
    setShowModal(false);
    reload();
    updateStats();
    onTasksChange?.();

    // Yangi vazifa yaratilganida nishon tekshirish (masalan: birinchi vazifa nishoni)
    const result = checkAndUnlockBadges();
    if (result.newBadges.length > 0) {
      const nextBadge = result.newBadges[0];
      markBadgeAlertSeen(nextBadge.id);
      setUnlockedBadge(nextBadge);
      setCoins(getUserCoins());
    }
  };

  const dailyTasks = tasks.filter((t) => (t.scope || 'daily') === 'daily');
  const weeklyTasks = tasks.filter((t) => t.scope === 'weekly');
  const currentScopeTasks = activeScopeTab === 'daily' ? dailyTasks : weeklyTasks;

  const done = currentScopeTasks.filter((t) => t.done).length;
  const total = currentScopeTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const pendingCount = total - done;

  // B1: Smooth Count-Up animation for percentage
  useEffect(() => {
    if (displayPct === pct) return;
    const step = displayPct < pct ? 1 : -1;
    const diff = Math.abs(pct - displayPct);
    const intervalTime = Math.max(8, Math.floor(350 / Math.max(1, diff)));
    const timer = setTimeout(() => {
      setDisplayPct((prev) => prev + step);
    }, intervalTime);
    return () => clearTimeout(timer);
  }, [pct, displayPct]);

  // Streak hisoblash (seriya uchun)
  const weekDays = getLast7Days().reverse();
  let currentStreak = 0;
  for (const d of weekDays) {
    if (d.done > 0) currentStreak++;
    else break;
  }

  // SVG Circular ring hisobi
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (pct / 100) * ringCircumference;

  const filtered = filterCat === 'all'
    ? currentScopeTasks
    : currentScopeTasks.filter((t) => t.category === filterCat);

  // Hour-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech';

  const QUICK_PRESETS: { text: string; priority: TaskPriority; category: TaskCategory; duration: number; emoji: string }[] = [
    { emoji: '🎙️', text: '15 daqiqa AI Speaking mashqi (IELTS / CEFR)', priority: 'high', category: 'learning', duration: 15 },
    { emoji: '📖', text: '1 ta Reading Passage yechish va tahlil qilish', priority: 'high', category: 'learning', duration: 20 },
    { emoji: '✍️', text: 'Writing insho yozish va ballini tekshirish', priority: 'medium', category: 'learning', duration: 30 },
    { emoji: '💪', text: '30 daqiqa sport yoki kitob mutolaasi', priority: 'medium', category: 'health', duration: 30 },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#f6f7fb] pb-28 relative">
      <style>{`
        @keyframes energyOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes zapPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(196,248,42,0.6)); }
          50% { transform: scale(1.18); filter: drop-shadow(0 0 14px rgba(196,248,42,1)); }
        }
        @keyframes presetFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes confettiPop {
          0% { transform: translate(0, 0) scale(0.4) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1.1) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes cardShimmerSweep {
          0% { transform: translateX(-140%) skewX(-20deg); }
          45%, 100% { transform: translateX(240%) skewX(-20deg); }
        }
        @keyframes laserSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* B1: Dopamine Confetti & Coin Burst Overlay when checking off a task */}
      {confettiKey && (
        <div key={confettiKey} className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {[
            { tx: '-90px', ty: '-120px', rot: '-45deg', char: '🎉' },
            { tx: '95px', ty: '-110px', rot: '60deg', char: '🪙' },
            { tx: '-110px', ty: '-30px', rot: '-80deg', char: '✨' },
            { tx: '115px', ty: '-25px', rot: '75deg', char: '🔥' },
            { tx: '-60px', ty: '-150px', rot: '30deg', char: '🪙' },
            { tx: '60px', ty: '-145px', rot: '-35deg', char: '⚡' },
            { tx: '-75px', ty: '60px', rot: '-50deg', char: '🎉' },
            { tx: '80px', ty: '55px', rot: '45deg', char: '✨' },
          ].map((p, idx) => (
            <span
              key={idx}
              className="absolute text-2xl select-none"
              style={{
                ['--tx' as string]: p.tx,
                ['--ty' as string]: p.ty,
                ['--rot' as string]: p.rot,
                animation: 'confettiPop 950ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {p.char}
            </span>
          ))}
        </div>
      )}

      {/* ── Header + Animated Hero Hook Section (#7, #8, #10) ── */}
      <div className="px-5 pt-4 pb-2 space-y-3.5">
        <HeroHookSection
          userName={userName}
          greeting={greeting}
          coins={coins}
          floatingCoin={floatingCoin}
          onOpenEnglish={() => onOpenEnglish?.(null)}
          hideIeltsCard={true}
        />

        {/* ── YANGI DIZAYN: IELTS & Multilevel Practice (Kattaroq) + Bugungi Progress (To'rtburchak chekkada) ── */}
        <div className="flex items-stretch gap-2.5">
          {/* 1. IELTS & Multilevel Practice (Kattaroq, Dominant + 3D Dual-Portal Tugmalar) */}
          <div
            ref={ieltsCardRef}
            onClick={() => {
              triggerHaptic('heavy');
              onOpenEnglish?.(null);
            }}
            onMouseMove={(e) => handleIeltsPointerMove(e.clientX, e.clientY)}
            onMouseLeave={resetIeltsTilt}
            onTouchMove={(e) => {
              if (e.touches[0]) handleIeltsPointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={resetIeltsTilt}
            style={{
              background: 'linear-gradient(135deg, #100b2e 0%, #1e135e 50%, #341299 100%)',
              transform: `perspective(850px) rotateX(${ieltsTilt.rotateX}deg) rotateY(${ieltsTilt.rotateY}deg) scale(${ieltsTilt.active ? 1.02 : 1})`,
              transition: ieltsTilt.active ? 'transform 60ms linear' : 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
              boxShadow: ieltsTilt.active
                ? '0 20px 40px -12px rgba(112, 82, 255, 0.55), 0 0 24px rgba(196, 248, 42, 0.3)'
                : undefined,
            }}
            className="flex-1 rounded-[2rem] p-3.5 sm:p-4 text-white shadow-xl cursor-pointer border border-indigo-400/35 relative overflow-hidden select-none flex flex-col justify-between group transition-all"
          >
            {/* Ambient neon glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#c4f82a]/20 rounded-full blur-xl pointer-events-none" />

            {/* Interactive Finger/Mouse Spotlight */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: ieltsTilt.active ? 1 : 0,
                background: `radial-gradient(180px circle at ${ieltsTilt.spotX}% ${ieltsTilt.spotY}%, rgba(196, 248, 42, 0.24), rgba(112, 82, 255, 0.16) 45%, transparent 80%)`,
              }}
            />

            {/* Periodic Glass Shimmer Sweep */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ animation: 'cardShimmerSweep 4.5s infinite ease-in-out' }}
              />
            </div>

            {/* Top row: Badges */}
            <div className="flex items-center justify-between gap-1 relative z-10">
              <span className="animate-bounce inline-block text-[10px] font-black bg-[#c4f82a] text-[#121124] px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(196,248,42,0.9),0_0_22px_rgba(196,248,42,0.5)] whitespace-nowrap">
                Yangi 🔥
              </span>
              <span className="text-[9px] font-black text-[#c4f82a] bg-white/10 border border-[#c4f82a]/30 px-2 py-0.5 rounded-full tracking-wider uppercase">
                AI 9.0 & CEFR
              </span>
            </div>

            {/* Sarlavha */}
            <div className="my-1.5 relative z-10">
              <h4 className="text-[14px] sm:text-[15px] font-black text-white tracking-tight leading-tight">
                IELTS & Multilevel Practice
              </h4>
              <p className="text-[10px] text-purple-200/90 font-medium mt-0.5 leading-tight">
                AI Examiner, Writing & Jonli Sherik
              </p>
            </div>

            {/* ── EXPERT BUTTON #1: Dual Waving-Flag Direct Portal Mini-Buttons ── */}
            <div className="grid grid-cols-2 gap-1.5 my-1.5 relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('heavy');
                  onOpenEnglish?.('ielts');
                }}
                className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-indigo-300/30 hover:border-[#c4f82a]/70 rounded-xl px-2 py-1.5 transition-all cursor-pointer group/btn shadow-xs"
                title="IELTS Academic 9.0 bo'limiga to'g'ridan-to'g'ri o'tish"
              >
                <div className="shrink-0 overflow-hidden rounded-xs">
                  <UkFlagWave width={17} />
                </div>
                <span className="text-[10px] font-black text-white group-hover/btn:text-[#c4f82a] truncate transition-colors">
                  IELTS 9.0
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('heavy');
                  onOpenEnglish?.('multilevel');
                }}
                className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-cyan-300/30 hover:border-[#c4f82a]/70 rounded-xl px-2 py-1.5 transition-all cursor-pointer group/btn shadow-xs"
                title="Milliy Sertifikat (Multilevel CEFR) bo'limiga to'g'ridan-to'g'ri o'tish"
              >
                <div className="shrink-0 overflow-hidden rounded-xs">
                  <UzFlagWave width={17} />
                </div>
                <span className="text-[10px] font-black text-white group-hover/btn:text-[#c4f82a] truncate transition-colors">
                  CEFR 75b
                </span>
              </button>
            </div>

            {/* ── EXPERT BUTTON #2: 3D Tactile Cyber-Plasma CTA Button with Live Audio Waveform ── */}
            <div className="relative z-10 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('heavy');
                  onOpenEnglish?.(null);
                }}
                className="eng-cta w-full bg-gradient-to-r from-[#c4f82a] via-[#d4ff47] to-[#b8f014] text-[#121124] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-between shadow-[0_3.5px_0_#7aa300,0_8px_18px_rgba(196,248,42,0.35)] active:translate-y-[3px] active:shadow-[0_0.5px_0_#7aa300] transition-all select-none cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <SpeakingWaveform width={18} height={13} color="#121124" />
                  <span className="tracking-tight">Sinovni Boshlash</span>
                </div>
                <span className="w-5 h-5 rounded-lg bg-[#121124] text-[#c4f82a] flex items-center justify-center">
                  <span className="eng-cta__arrow font-sans font-bold text-xs leading-none" aria-hidden="true">→</span>
                </span>
              </button>
            </div>
          </div>

          {/* 2. Bugungi Progress (To'rtburchak qilib chekkaroqqa qo'yilgan) */}
          <div className="w-[125px] sm:w-[138px] shrink-0 rounded-[2rem] p-3.5 bg-[#1e1552] text-white shadow-xl relative overflow-hidden border border-indigo-400/25 flex flex-col justify-between items-center text-center">
            {/* Ambient energy glow */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#c4f82a]/15 rounded-full blur-xl pointer-events-none" />

            {/* Top Label */}
            <p className="text-[10px] font-extrabold text-[#9e91db] tracking-wider uppercase relative z-10">
              {activeScopeTab === 'daily' ? 'PROGRESS' : 'HAFTALIK'}
            </p>

            {/* Markaziy Circular Energy Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center my-1 relative z-10">
              {/* Outer rotating dashed ring */}
              <div
                className="absolute inset-0 rounded-full border border-dashed border-[#c4f82a]/30 pointer-events-none"
                style={{ animation: 'energyOrbit 10s linear infinite' }}
              />
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke="#33247d"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke="#c4f82a"
                  strokeWidth="5"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Foiz ko'rsatkichi markazda */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-white font-mono leading-none">
                  {displayPct}%
                </span>
                {pct === 100 ? (
                  <span className="text-xs mt-0.5">🏆</span>
                ) : (
                  <Zap size={11} className="text-[#c4f82a] fill-[#c4f82a] mt-0.5" />
                )}
              </div>
            </div>

            {/* Pastki qism: Bajarilgan vazifalar soni */}
            <div className="w-full bg-[#c4f82a] text-[#121124] rounded-xl py-1 px-1.5 shadow-xs relative z-10">
              <p className="text-[10px] font-black leading-tight truncate">
                {pendingCount === 0 && total > 0 ? (
                  `Bajarildi! 🔥 ${currentStreak || 1}k`
                ) : total === 0 ? (
                  `0 ta vazifa`
                ) : (
                  `${done}/${total} (${pendingCount} qoldi)`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Vazifalar bo'limi: Kunlik / Haftalik + Yonidagi Holographic Speed-Portal Tugmasi ── */}
      <div className="px-5 mt-3 mb-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/40 shadow-xs">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveScopeTab('daily');
                setFilterCat('all');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                activeScopeTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>☀️ Kunlik</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeScopeTab === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300/70 text-slate-600'
              }`}>
                {dailyTasks.length}
              </span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveScopeTab('weekly');
                setFilterCat('all');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                activeScopeTab === 'weekly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📅 Haftalik</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeScopeTab === 'weekly' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300/70 text-slate-600'
              }`}>
                {weeklyTasks.length}
              </span>
            </button>
          </div>

          {/* ── EXPERT BUTTON #3: Spinning-Laser Auto-Morphing Portal Button (IELTS ⇄ CEFR) ── */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              setShowExamPortal((prev) => !prev);
            }}
            className="relative p-[1.5px] rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 active:scale-95 transition-all shrink-0 cursor-pointer group"
            title="IELTS & Multilevel Tezkor Portalini ochish"
          >
            {/* Spinning Conic Laser Border */}
            <div
              className="absolute -inset-full pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, #c4f82a, #7052ff, #00f2fe, #c4f82a)',
                animation: 'laserSpin 3.5s linear infinite',
              }}
            />

            {/* Inner Dark Glass Core */}
            <div className="relative bg-[#140e38] hover:bg-[#1c144d] text-white px-2.5 py-1.5 rounded-[14.5px] flex items-center space-x-2 transition-colors">
              {/* Live Morphing Flag & Radar Dot */}
              <div className="relative w-7 h-7 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                {morphMode === 'ielts' ? (
                  <UkFlagWave width={18} />
                ) : (
                  <UzFlagWave width={18} />
                )}
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c4f82a] opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c4f82a]" />
                </span>
              </div>

              {/* Morphing Label */}
              <div className="text-left pr-0.5 min-w-[58px]">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black text-white tracking-tight leading-none">
                    {morphMode === 'ielts' ? 'IELTS' : 'CEFR'}
                  </span>
                  <span className="text-[8px] font-black bg-[#c4f82a] text-[#121124] px-1 py-0.2 rounded font-mono leading-tight">
                    {morphMode === 'ielts' ? '9.0' : 'C1'}
                  </span>
                </div>
                <span className="text-[9px] font-extrabold text-[#c4f82a] tracking-wide uppercase block mt-0.5">
                  {showExamPortal ? 'Yopish ▲' : 'Portal ▼'}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* ── Expandable Holographic 3-Portal Speed-Launcher Drawer ── */}
        {showExamPortal && (
          <div className="rounded-2xl p-2.5 bg-gradient-to-r from-[#120d31] via-[#1d1452] to-[#2c1678] border border-indigo-400/40 shadow-xl grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                setShowExamPortal(false);
                onOpenEnglish?.('ielts');
              }}
              className="flex flex-col items-center justify-center bg-white/10 hover:bg-[#c4f82a] text-white hover:text-[#121124] border border-white/15 rounded-xl py-2 px-1.5 transition-all active:scale-95 group cursor-pointer"
            >
              <div className="mb-1">
                <UkFlagWave width={22} />
              </div>
              <span className="text-[11px] font-black leading-tight">IELTS 9.0</span>
              <span className="text-[9px] font-bold text-indigo-200 group-hover:text-[#121124]/80">AI Mock →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                setShowExamPortal(false);
                onOpenEnglish?.('multilevel');
              }}
              className="flex flex-col items-center justify-center bg-white/10 hover:bg-[#c4f82a] text-white hover:text-[#121124] border border-white/15 rounded-xl py-2 px-1.5 transition-all active:scale-95 group cursor-pointer"
            >
              <div className="mb-1">
                <UzFlagWave width={22} />
              </div>
              <span className="text-[11px] font-black leading-tight">Multilevel</span>
              <span className="text-[9px] font-bold text-cyan-200 group-hover:text-[#121124]/80">CEFR 75b →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                setShowExamPortal(false);
                onOpenEnglish?.(null);
              }}
              className="flex flex-col items-center justify-center bg-[#c4f82a]/20 hover:bg-[#c4f82a] text-[#c4f82a] hover:text-[#121124] border border-[#c4f82a]/40 rounded-xl py-2 px-1.5 transition-all active:scale-95 group cursor-pointer"
            >
              <span className="text-base mb-0.5 leading-none">🏛️</span>
              <span className="text-[11px] font-black leading-tight">Markaz</span>
              <span className="text-[9px] font-bold opacity-85">Hammasi →</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Category Filters ── */}
      <div className="px-5 mb-3">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              filterCat === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            Hammasi {total > 0 && `(${total})`}
          </button>
          {CATEGORIES.map((cat) => {
            const count = currentScopeTasks.filter((t) => t.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center space-x-1 ${
                  filterCat === cat
                    ? 'text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
                style={filterCat === cat ? { backgroundColor: getCategoryColor(cat) } : {}}
              >
                <span>{CAT_EMOJIS[cat]}</span>
                <span>{getCategoryLabel(cat)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Task List ── */}
      <div className="px-5 flex-1 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="text-4xl mb-2" style={{ animation: 'presetFloat 2.8s infinite ease-in-out' }}>
              {activeScopeTab === 'daily' ? '☀️' : '📅'}
            </span>
            <p className="font-black text-slate-800 text-sm">
              {currentScopeTasks.length === 0
                ? activeScopeTab === 'daily'
                  ? "Bugungi kunga hali vazifa yo'q!"
                  : "Bu hafta uchun hali vazifa yo'q!"
                : "Bu toifada vazifa yo'q"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
              {currentScopeTasks.length === 0
                ? "Tayyor maqsadlardan birini 1 bosishda qo'shing yoki + tugmasini bosing:"
                : "Boshqa toifani tanlang"}
            </p>

            {/* B3: Floating 1-Tap Quick-Add Chips when task list is empty */}
            {currentScopeTasks.length === 0 && (
              <div className="w-full space-y-2 text-left max-w-sm mx-auto">
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAddPreset(preset.text, preset.priority, preset.category, preset.duration)}
                    style={{ animation: `presetFloat ${2.6 + idx * 0.3}s infinite ease-in-out ${idx * 0.15}s` }}
                    className="w-full bg-white hover:bg-indigo-50/80 border border-indigo-100 hover:border-[#7052ff]/40 rounded-2xl p-3 flex items-center justify-between shadow-xs transition-all active:scale-[0.98] group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-sm shrink-0">
                        {preset.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#7052ff] truncate transition-colors">
                          {preset.text}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">
                          ⏱ {preset.duration} daq • +{getTaskCoins(preset.priority)} 🪙
                        </span>
                      </div>
                    </div>
                    <span className="ml-2 text-[11px] font-black bg-[#7052ff]/10 group-hover:bg-[#7052ff] text-[#7052ff] group-hover:text-white px-2.5 py-1 rounded-xl transition-all shrink-0">
                      + Qo'shish
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          filtered.map((task) => (
            <SwipeableTaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* ── B4: 1-rasmdagi zamonaviy binafsha FAB (+) tugmasi Sonar To'lqini bilan ── */}
      <button
        onClick={() => {
          triggerHaptic('heavy');
          setNewScope(activeScopeTab);
          setShowModal(true);
        }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#7052ff] hover:bg-[#6242f6] text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition-all z-30"
      >
        {currentScopeTasks.length === 0 && (
          <span className="absolute inset-0 rounded-full bg-[#7052ff] opacity-50 animate-ping pointer-events-none" />
        )}
        <Plus size={26} strokeWidth={2.8} className="relative z-10" />
      </button>

      {/* ── Add Task Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-8 space-y-4 shadow-2xl">
            {/* Handle */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-lg">Yangi vazifa</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Scope Selector: Kunlik vs Haftalik (4-rasm talabi) */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setNewScope('daily');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  newScope === 'daily'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>☀️ Kunlik vazifa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setNewScope('weekly');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
                  newScope === 'weekly'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📅 Haftalik vazifa</span>
              </button>
            </div>

            {/* Input */}
            <textarea
              placeholder="Vazifani kiriting..."
              value={newText}
              autoFocus
              rows={2}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-sm rounded-2xl px-4 py-3 outline-none border border-slate-200 focus:border-indigo-400 resize-none transition-all"
            />

            {/* Category */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center space-x-1">
                <Tag size={12} /> <span>TOIFA</span>
              </p>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center space-x-1 ${
                      newCategory === cat ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                    }`}
                    style={newCategory === cat ? { backgroundColor: getCategoryColor(cat) } : {}}
                  >
                    <span>{CAT_EMOJIS[cat]}</span>
                    <span>{getCategoryLabel(cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center space-x-1">
                <Flag size={12} /> <span>MUHIMLIK</span>
              </p>
              <div className="flex space-x-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      newPriority === p ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                    }`}
                    style={newPriority === p ? { backgroundColor: getPriorityColor(p) } : {}}
                  >
                    {getPriorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration (optional) */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center space-x-1">
                <Clock size={12} /> <span>VAQT <span className="font-normal text-slate-400">(ixtiyoriy)</span></span>
              </p>
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
                {/* Clear button */}
                {newDuration !== null && (
                  <button
                    onClick={() => setNewDuration(null)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-red-50 text-red-400 border border-red-100 flex items-center space-x-1"
                  >
                    <X size={10} />
                    <span>O'chirish</span>
                  </button>
                )}
                {DURATION_PRESETS.map((min) => (
                  <button
                    key={min}
                    onClick={() => setNewDuration(newDuration === min ? null : min)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center space-x-1 ${
                      newDuration === min
                        ? 'text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    style={newDuration === min ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
                  >
                    <Clock size={10} />
                    <span>{min >= 60 ? `${min / 60} soat` : `${min} daqiqa`}</span>
                  </button>
                ))}
                {/* Custom input */}
                <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 shrink-0">
                  <input
                    type="number"
                    placeholder="?"
                    min={1}
                    max={480}
                    value={newDuration && !DURATION_PRESETS.includes(newDuration) ? newDuration : ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) setNewDuration(v);
                    }}
                    className="w-10 bg-transparent text-xs font-bold text-slate-700 outline-none text-center"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">daq</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-extrabold shadow-lg active:scale-95 transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
            >
              Qo'shish ✓{newDuration ? ` · ⏱ ${newDuration >= 60 ? `${Math.floor(newDuration / 60)} soat${newDuration % 60 ? ` ${newDuration % 60} daqiqa` : ''}` : `${newDuration} daqiqa`}` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Yangi Nishon Ochilganini ko'rsatuvchi tantanali pop-up modal */}
      <BadgeUnlockModal
        badge={unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
      />
    </div>
  );
};
