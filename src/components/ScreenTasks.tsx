import { useState } from 'react';
import { Menu, Search, Bell, Plus, Check } from 'lucide-react';
import type { TelegramUser } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface Task {
  id: string;
  text: string;
  done: boolean;
  color: 'pink' | 'blue';
}

interface Category {
  id: string;
  name: string;
  count: number;
  accent: string;
  progressWidth: string;
}

interface Props {
  user: TelegramUser;
}

const initialTasks: Task[] = [
  { id: '1', text: 'Daily meeting with team', done: false, color: 'pink' },
  { id: '2', text: 'Pay for rent', done: true, color: 'blue' },
  { id: '3', text: 'Check emails', done: false, color: 'blue' },
  { id: '4', text: 'Lunch with Emma', done: false, color: 'pink' },
  { id: '5', text: 'Meditation', done: false, color: 'blue' },
];

const categories: Category[] = [
  {
    id: 'business',
    name: 'Business',
    count: 40,
    accent: 'bg-pink-500',
    progressWidth: 'w-2/3',
  },
  {
    id: 'personal',
    name: 'Personal',
    count: 18,
    accent: 'bg-blue-400',
    progressWidth: 'w-1/3',
  },
];

export const ScreenTasks: React.FC<Props> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskColor, setNewTaskColor] = useState<'pink' | 'blue'>('pink');

  const toggleTask = (id: string) => {
    triggerHaptic('medium');
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    triggerHaptic('heavy');
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        done: false,
        color: newTaskColor,
      },
    ]);
    setNewTaskText('');
    setShowAddModal(false);
  };

  const doneTasks = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;

  return (
    <div className="flex flex-col min-h-full bg-[#3d51c5] text-white pb-24 select-none relative">
      {/* Status progress bar at top */}
      <div className="h-1 bg-white/10">
        <div
          className="h-1 bg-gradient-to-r from-pink-500 to-purple-400 transition-all duration-700"
          style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <button
          onClick={() => triggerHaptic('light')}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:text-white active:scale-95 transition-all"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => triggerHaptic('light')}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:text-white active:scale-95 transition-all"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => triggerHaptic('light')}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:text-white active:scale-95 transition-all"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#3d51c5]" />
          </button>
        </div>
      </div>

      {/* Big Greeting */}
      <div className="px-6 pt-3 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          What's up,<br />
          <span className="text-white">{user.first_name}!</span>
        </h1>
      </div>

      {/* Categories */}
      <div className="px-6 mb-6">
        <p className="text-[11px] font-bold tracking-widest text-white/50 uppercase mb-3">
          Categories
        </p>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => triggerHaptic('light')}
              className="bg-[#2d3f9e] rounded-2xl p-4 cursor-pointer active:scale-[0.97] transition-all shadow-md"
            >
              <p className="text-xs text-white/60 font-semibold mb-1">
                {cat.count} tasks
              </p>
              <h3 className="font-extrabold text-white text-base mb-4">{cat.name}</h3>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-1.5 ${cat.accent} ${cat.progressWidth} rounded-full transition-all duration-500`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="px-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold tracking-widest text-white/50 uppercase">
            Today's Tasks
          </p>
          <span className="text-[11px] font-semibold text-white/40">
            {doneTasks}/{totalTasks} done
          </span>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center space-x-4 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all ${
                task.done
                  ? 'bg-[#2d3f9e]/70'
                  : 'bg-[#2d3f9e] shadow-sm'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  task.done
                    ? 'bg-[#2d3f9e] border-white/40'
                    : task.color === 'pink'
                    ? 'border-pink-500 bg-transparent'
                    : 'border-blue-400 bg-transparent'
                }`}
              >
                {task.done && (
                  <Check size={14} className="text-white/70" strokeWidth={3} />
                )}
              </div>

              {/* Task Label */}
              <span
                className={`text-sm font-semibold transition-all ${
                  task.done
                    ? 'text-white/40 line-through'
                    : 'text-white'
                }`}
              >
                {task.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => {
          triggerHaptic('heavy');
          setShowAddModal(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#e040fb] rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all z-30 shadow-pink-500/30"
        style={{ boxShadow: '0 8px 30px rgba(224,64,251,0.5)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-[#2d3f9e] rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-white text-lg">Yangi vazifa qo'shish</h3>

            <input
              type="text"
              placeholder="Vazifa nomini kiriting..."
              value={newTaskText}
              autoFocus
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="w-full bg-[#3d51c5] text-white placeholder-white/40 text-sm rounded-2xl px-4 py-3 outline-none border border-white/10 focus:border-pink-400/60 transition-all"
            />

            {/* Color Selector */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/50 font-semibold">Rang:</span>
              <button
                onClick={() => setNewTaskColor('pink')}
                className={`w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center transition-all ${
                  newTaskColor === 'pink' ? 'ring-2 ring-offset-2 ring-pink-500 ring-offset-[#2d3f9e]' : 'opacity-60'
                }`}
              >
                {newTaskColor === 'pink' && <Check size={13} />}
              </button>
              <button
                onClick={() => setNewTaskColor('blue')}
                className={`w-7 h-7 rounded-full bg-blue-400 flex items-center justify-center transition-all ${
                  newTaskColor === 'blue' ? 'ring-2 ring-offset-2 ring-blue-400 ring-offset-[#2d3f9e]' : 'opacity-60'
                }`}
              >
                {newTaskColor === 'blue' && <Check size={13} />}
              </button>
            </div>

            <div className="flex space-x-3 pt-1">
              <button
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="flex-1 py-3 bg-[#e040fb] text-white text-sm font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-40 shadow-lg"
                style={{ boxShadow: newTaskText.trim() ? '0 6px 20px rgba(224,64,251,0.4)' : 'none' }}
              >
                Qo'shish
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowAddModal(false);
                }}
                className="px-5 py-3 bg-white/10 text-white/70 text-sm font-semibold rounded-2xl active:scale-95 transition-all"
              >
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
