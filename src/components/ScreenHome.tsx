import React, { useState, useEffect, useCallback } from 'react';
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
  onOpenEnglish?: () => void;
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

  // Streak hisoblash (2-rasmdagi seriya uchun)
  const weekDays = getLast7Days().reverse();
  let currentStreak = 0;
  for (const d of weekDays) {
    if (d.done > 0) currentStreak++;
    else break;
  }
  const nextStreak = currentStreak + (done > 0 ? 1 : 1);

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
          onOpenEnglish={onOpenEnglish}
        />

        {/* ── 2-rasmdagi zamonaviy to'q binafsha Progress Card + B2: Living Energy Core ── */}
        <div className="rounded-[2rem] p-5 bg-[#1e1552] text-white shadow-xl relative overflow-hidden border border-indigo-400/20">
          {/* Ambient energy glow */}
          <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#c4f82a]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            {/* Chap tomon: Foiz va vazifalar soni */}
            <div>
              <p className="text-[11px] font-extrabold text-[#9e91db] tracking-wider uppercase flex items-center space-x-1.5">
                <span>{activeScopeTab === 'daily' ? 'BUGUNGI PROGRESS' : 'HAFTALIK PROGRESS'}</span>
                {pct === 100 && <span className="animate-bounce">🏆</span>}
              </p>
              <p className="text-5xl font-black text-white tracking-tight my-1.5 font-mono">
                {displayPct}%
              </p>
              <p className="text-xs font-semibold text-[#b8ace8]">
                {done} / {total} {activeScopeTab === 'daily' ? 'kunlik' : 'haftalik'} vazifa bajarildi
              </p>
            </div>

            {/* O'ng tomon: B2 Living Energy Core (Orbiting spark + Pulsing Zap/Crown) */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              {/* Outer rotating dashed energy orbit */}
              <div
                className="absolute inset-0 rounded-full border border-dashed border-[#c4f82a]/35 pointer-events-none"
                style={{ animation: 'energyOrbit 10s linear infinite' }}
              />
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                {/* Background ring */}
                <circle
                  cx="32"
                  cy="32"
                  r={ringRadius}
                  stroke="#33247d"
                  strokeWidth="5"
                  fill="none"
                />
                {/* Neon Lime progress arc */}
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
              {/* Markaziy jonli energiya chaqmog'i */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ animation: 'zapPulse 2.2s infinite ease-in-out' }}
              >
                {pct === 100 ? (
                  <span className="text-2xl">🔥</span>
                ) : (
                  <Zap size={22} className="text-[#c4f82a] fill-[#c4f82a]" />
                )}
              </div>
            </div>
          </div>

          {/* 2-rasmdagi och laym-yashil streak banner */}
          <div className="mt-4 bg-[#c4f82a] text-[#121124] rounded-2xl p-3.5 shadow-sm relative z-10">
            <p className="text-xs font-black tracking-tight leading-snug">
              {activeScopeTab === 'daily' ? (
                total === 0
                  ? "Bugungi rejalaringizni kiriting va seriyani boshlang!"
                  : pendingCount === 0
                  ? "Ajoyib! Bugungi barcha vazifalar bajarildi 🔥"
                  : `Yana ${pendingCount} ta vazifa, va ${nextStreak} kunlik seriya ochiladi`
              ) : (
                total === 0
                  ? "Haftalik maqsadlaringizni rejalashtiring va hafta davomida bajaring!"
                  : pendingCount === 0
                  ? "Qoyilmaqom! Ushbu haftaning barcha rejalari bajarildi! 🏆"
                  : `Hafta davomida yana ${pendingCount} ta vazifangiz qoldi. Olg'a!`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Vazifalar bo'limi: Kunlik va Haftalik (Foydalanuvchi talabi) ── */}
      <div className="px-5 mt-3 mb-2.5">
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/40 shadow-xs">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveScopeTab('daily');
              setFilterCat('all');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
              activeScopeTab === 'daily'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>☀️ Kunlik</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
              activeScopeTab === 'weekly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📅 Haftalik</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeScopeTab === 'weekly' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300/70 text-slate-600'
            }`}>
              {weeklyTasks.length}
            </span>
          </button>
        </div>
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
