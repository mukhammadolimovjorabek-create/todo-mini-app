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
}

export const ScreenHome: React.FC<ScreenHomeProps> = ({ userName, onTasksChange, onOpenEnglish }) => {
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
        setTimeout(() => setFloatingCoin(null), 1800);

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

  return (
    <div className="flex flex-col min-h-full bg-[#f6f7fb] pb-28">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">{greeting},</p>
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{userName}! 👋</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Yuqoridagi Tangalar Hisoblagichi (Coins Counter) */}
          <div className="relative">
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full shadow-xs backdrop-blur-xs">
              <span className="text-lg select-none">🪙</span>
              <span className="text-sm font-black text-amber-700 tracking-tight">{coins}</span>
            </div>

            {/* Uchib chiqadigan +🪙 animatsiyasi */}
            {floatingCoin && (
              <div
                key={floatingCoin.key}
                className="absolute -top-7 right-1 pointer-events-none text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm animate-bounce"
              >
                +{floatingCoin.amount} 🪙
              </div>
            )}
          </div>
        </div>

        {/* ── 2-rasmdagi zamonaviy to'q binafsha Progress Card ── */}
        <div className="mt-4 rounded-[2rem] p-5 bg-[#1e1552] text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Chap tomon: Foiz va vazifalar soni */}
            <div>
              <p className="text-[11px] font-extrabold text-[#9e91db] tracking-wider uppercase">
                {activeScopeTab === 'daily' ? 'BUGUNGI PROGRESS' : 'HAFTALIK PROGRESS'}
              </p>
              <p className="text-5xl font-black text-white tracking-tight my-1.5">
                {pct}%
              </p>
              <p className="text-xs font-semibold text-[#b8ace8]">
                {done} / {total} {activeScopeTab === 'daily' ? 'kunlik' : 'haftalik'} vazifa bajarildi
              </p>
            </div>

            {/* O'ng tomon: Circular neon progress ring va chaqmoq ⚡ */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
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
              {/* Markaziy yashil chaqmoq belgisi */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={22} className="text-[#c4f82a] fill-[#c4f82a]" />
              </div>
            </div>
          </div>

          {/* 2-rasmdagi och laym-yashil streak banner */}
          <div className="mt-4 bg-[#c4f82a] text-[#121124] rounded-2xl p-3.5 shadow-sm">
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

        {/* 🇬🇧 Ingliz tili (IELTS / Multilevel) Premium Boshlash Card */}
        {onOpenEnglish && (
          <div
            onClick={onOpenEnglish}
            className="mt-3.5 rounded-2xl p-4 text-white shadow-lg cursor-pointer border border-indigo-400/25 active:scale-[0.98] transition-all relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #120e2c 0%, #1e1552 50%, #321884 100%)' }}
          >
            {/* Ambient neon glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#c4f82a]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shrink-0 shadow-inner backdrop-blur-xs">
                  🇬🇧
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="animate-wiggle text-[9px] font-black bg-[#c4f82a] text-[#121124] px-1.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                      Yangi 🔥
                    </span>
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">IELTS & CEFR</span>
                  </div>
                  <h4 className="text-xs font-black text-white tracking-tight leading-tight">
                    IELTS & Multilevel Practice
                  </h4>
                  <p className="text-[10.5px] text-purple-200/90 truncate mt-0.5 font-medium">
                    AI Examiner (9.0), Writing & Sheriklik
                  </p>
                </div>
              </div>

              {/* Boshlash tugmasi: qimirlamaydi (mutlaqo barqaror) */}
              <div className="pl-2 shrink-0">
                <div className="inline-flex items-center space-x-1 bg-[#c4f82a] text-[#121124] px-3.5 py-2 rounded-full text-xs font-black shadow-md select-none">
                  <span>Boshlash</span>
                  <span className="font-sans font-bold">→</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">
              {activeScopeTab === 'daily' ? '☀️' : '📅'}
            </span>
            <p className="font-bold text-slate-700 text-base">
              {currentScopeTasks.length === 0
                ? activeScopeTab === 'daily'
                  ? "Bugungi kunga hali vazifa yo'q!"
                  : "Bu hafta uchun hali vazifa yo'q!"
                : "Bu toifada vazifa yo'q"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {currentScopeTasks.length === 0
                ? activeScopeTab === 'daily'
                  ? "Pastdagi + tugmasini bosib bugun rejalingizni kiriting"
                  : "Pastdagi + tugmasini bosib hafta davomidagi rejalaringizni kiriting"
                : "Boshqa toifani tanlang"}
            </p>
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

      {/* ── 1-rasmdagi zamonaviy binafsha FAB (+) tugmasi ── */}
      <button
        onClick={() => {
          triggerHaptic('heavy');
          setNewScope(activeScopeTab);
          setShowModal(true);
        }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-[#7052ff] hover:bg-[#6242f6] text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition-all z-30"
      >
        <Plus size={26} strokeWidth={2.8} />
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
