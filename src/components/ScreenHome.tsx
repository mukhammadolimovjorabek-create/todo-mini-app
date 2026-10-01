import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Flag, Tag, ChevronDown, X, Clock } from 'lucide-react';
import type { Task, TaskCategory, TaskPriority } from '../types';
import {
  loadTasks, addTask, toggleTask, deleteTask,
  getCategoryColor, getCategoryLabel,
  getPriorityColor, getPriorityLabel,
  today, updateStats,
} from '../utils/storage';
import { triggerHaptic } from '../utils/telegram';

const CATEGORIES: TaskCategory[] = ['work', 'personal', 'health', 'learning', 'other'];
const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

const CAT_EMOJIS: Record<TaskCategory, string> = {
  work: '💼', personal: '🌟', health: '💪', learning: '📚', other: '✨',
};

// Quick duration presets (minutes)
const DURATION_PRESETS = [15, 30, 60, 90, 120];

export const ScreenHome: React.FC<{ userName: string }> = ({ userName }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterCat, setFilterCat] = useState<TaskCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<TaskCategory>('personal');
  const [newDuration, setNewDuration] = useState<number | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);


  const reload = useCallback(() => {
    setTasks(loadTasks().filter((t) => t.createdAt === today()));
  }, []);

  useEffect(() => {
    reload();
    updateStats();
  }, [reload]);

  const handleToggle = (id: string) => {
    triggerHaptic('medium');
    setTasks(toggleTask(id).filter((t) => t.createdAt === today()));
  };

  const handleDelete = (id: string) => {
    triggerHaptic('heavy');
    setTasks(deleteTask(id).filter((t) => t.createdAt === today()));
    setSwipedId(null);
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    triggerHaptic('heavy');
    addTask(newText.trim(), newPriority, newCategory, newDuration ?? undefined);
    setNewText('');
    setNewDuration(null);
    setShowModal(false);
    reload();
    updateStats();
  };

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const filtered = filterCat === 'all' ? tasks : tasks.filter((t) => t.category === filterCat);

  // Hour-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech';

  return (
    <div className="flex flex-col min-h-full bg-[#f0f2ff] pb-24">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-sm font-semibold text-indigo-400">{greeting},</p>
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{userName}! 👋</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {/* ── Progress Card ── */}
        <div
          className="mt-4 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #ec4899 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -right-2 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative z-10">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Bugungi progress</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-black">{pct}%</p>
                <p className="text-sm text-white/80 mt-1">{done} / {total} vazifa bajarildi</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10">
                  <span className="text-2xl">{pct >= 80 ? '🔥' : pct >= 50 ? '💪' : '⚡'}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
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
            const count = tasks.filter((t) => t.category === cat).length;
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
            <span className="text-5xl mb-4">✅</span>
            <p className="font-bold text-slate-700 text-base">
              {tasks.length === 0 ? 'Hali vazifa yo\'q!' : 'Bu toifada vazifa yo\'q'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {tasks.length === 0 ? 'Pastdagi + tugmani bosib bugun rejalingizni kiriting' : 'Boshqa toifani tanlang'}
            </p>
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              className="relative overflow-hidden"
              onMouseLeave={() => setSwipedId(null)}
            >
              {/* Delete reveal */}
              {swipedId === task.id && (
                <button
                  onClick={() => handleDelete(task.id)}
                  className="absolute right-0 top-0 bottom-0 w-16 bg-red-500 rounded-2xl flex items-center justify-center z-10"
                >
                  <Trash2 size={18} className="text-white" />
                </button>
              )}

              <div
                className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${
                  task.done
                    ? 'bg-white/60 border-slate-100 opacity-70'
                    : 'bg-white border-slate-100 shadow-xs'
                }`}
                onClick={() => handleToggle(task.id)}
                onContextMenu={(e) => { e.preventDefault(); setSwipedId(task.id); }}
              >
                {/* Checkbox */}
                <div className="shrink-0">
                  {task.done ? (
                    <CheckCircle2 size={24} style={{ color: getCategoryColor(task.category) }} />
                  ) : (
                    <Circle size={24} style={{ color: getCategoryColor(task.category) }} className="opacity-50" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5 flex-wrap gap-y-0.5">
                    <span className="text-[10px] font-bold" style={{ color: getCategoryColor(task.category) }}>
                      {CAT_EMOJIS[task.category]} {getCategoryLabel(task.category)}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] font-bold" style={{ color: getPriorityColor(task.priority) }}>
                      ● {getPriorityLabel(task.priority)}
                    </span>
                    {task.duration && (
                      <>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-0.5">
                          <Clock size={9} />
                          <span>{task.duration >= 60 ? `${Math.floor(task.duration / 60)} soat${task.duration % 60 ? ` ${task.duration % 60} daqiqa` : ''}` : `${task.duration} daqiqa`}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete btn (long press alternative) */}
                <button
                  onClick={(e) => { e.stopPropagation(); setSwipedId(swipedId === task.id ? null : task.id); }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-300 shrink-0"
                >
                  <ChevronDown size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => { triggerHaptic('heavy'); setShowModal(true); }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center active:scale-90 transition-all z-30"
        style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', boxShadow: '0 8px 30px rgba(99,102,241,0.45)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
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
    </div>
  );
};
