import React, { useState } from 'react';
import { Bell, Search, Sparkles } from 'lucide-react';
import type { TelegramUser } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  user: TelegramUser;
  onSelectCourse: (courseTitle: string) => void;
  onOpenAI: () => void;
}

export const ScreenDashboard: React.FC<Props> = ({ user, onSelectCourse, onOpenAI }) => {
  const [selectedTag, setSelectedTag] = useState<'Logic' | 'Visual' | 'Focus'>('Logic');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-amber-400 to-indigo-600 p-0.5 shadow-sm">
            <img
              src={user.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base leading-tight">
              Hello, {user.first_name || 'Roam'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Level Up</p>
          </div>
        </div>

        <button
          onClick={() => triggerHaptic('light')}
          className="relative w-11 h-11 rounded-full bg-white shadow-xs border border-slate-200/80 flex items-center justify-center active:scale-95 transition-all text-slate-700"
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-2">
        <div className="flex items-center bg-slate-200/70 rounded-full px-4 py-2.5 space-x-2 text-slate-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search courses, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Featured Large Card: Blue Rounded */}
      <div className="px-6 py-3">
        <div
          onClick={() => {
            triggerHaptic('medium');
            onSelectCourse('UX Lab: Motion Edition');
          }}
          className="relative overflow-hidden bg-[#99bbf9] rounded-[2rem] p-5 shadow-sm cursor-pointer active:scale-[0.99] transition-all"
        >
          {/* Top Row: Icon & Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs">
              <span className="text-base">🎯</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-900 bg-white/40">
              2/3
            </div>
          </div>

          {/* Titles */}
          <div className="mb-4">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              UX Lab: Motion Edition
            </h3>
            <p className="text-xs text-slate-700 font-medium mt-0.5">Joseph Smith</p>
          </div>

          {/* Bottom Row: Join Button & Avatars */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('heavy');
                onSelectCourse('UX Lab: Motion Edition');
              }}
              className="px-5 py-2.5 bg-[#111827] text-white text-xs font-bold tracking-wider rounded-full shadow-md active:scale-95 transition-all"
            >
              JOIN NOW
            </button>

            {/* Avatars Cluster */}
            <div className="flex items-center -space-x-2 bg-white/40 backdrop-blur-xs p-1 rounded-full border border-white/40">
              <img
                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"
                alt="member"
              />
              <img
                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                alt="member"
              />
              <img
                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80"
                alt="member"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-6 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {(['Logic', 'Visual', 'Focus'] as const).map((tag) => (
          <button
            key={tag}
            onClick={() => {
              triggerHaptic('light');
              setSelectedTag(tag);
            }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              selectedTag === tag
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{tag === 'Logic' ? '💡' : tag === 'Visual' ? '👁️' : '🎯'}</span>
            <span>{tag}</span>
          </button>
        ))}

        {/* AI Quick Banner */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAI();
          }}
          className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0 active:scale-95 transition-all"
        >
          <Sparkles size={13} />
          <span>AI Assist</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="px-6 py-3 grid grid-cols-2 gap-3.5">
        {/* Card 1: Purple (Design Odyssey) */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            onSelectCourse('Design Odyssey');
          }}
          className="bg-[#d8b4fe] rounded-[2rem] p-4 flex flex-col justify-between shadow-xs cursor-pointer active:scale-[0.98] transition-all min-h-[190px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
              ▲
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-900">
              1/3
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center space-x-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-slate-800 text-[8px] text-white flex items-center justify-center">
                M
              </div>
              <span className="text-[10px] text-slate-800 font-medium">by Maksym B.</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-950 leading-tight">
              Design Odyssey
            </h4>
            <p className="text-[11px] text-slate-700 font-medium">Brief 001</p>
          </div>

          {/* Doodles */}
          <div className="flex items-center justify-end space-x-2 pt-2 text-sm opacity-80">
            <span>📖</span>
            <span>💻</span>
            <span>📣</span>
          </div>
        </div>

        {/* Card 2: Orange (Focus Mode) */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            onSelectCourse('Focus Mode');
          }}
          className="bg-[#fb923c] rounded-[2rem] p-4 flex flex-col justify-between shadow-xs cursor-pointer active:scale-[0.98] transition-all min-h-[190px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
              ⚡
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-900">
              2/4
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center space-x-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-slate-800 text-[8px] text-white flex items-center justify-center">
                M
              </div>
              <span className="text-[10px] text-slate-800 font-medium">by Maksym B.</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-950 leading-tight">
              Focus Mode
            </h4>
            <p className="text-[11px] text-slate-800 font-medium">Brief 002</p>
          </div>

          {/* Doodles */}
          <div className="flex items-center justify-end space-x-2 pt-2 text-sm opacity-80">
            <span>☕</span>
            <span>🎯</span>
            <span>🎺</span>
          </div>
        </div>
      </div>
    </div>
  );
};
