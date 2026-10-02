import React from 'react';
import { Home, Sparkles } from 'lucide-react';
import type { ScreenType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  activeScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
  pendingCount?: number;
  userInitial?: string;
  progressPct?: number;
}

export const BottomNav: React.FC<Props> = ({
  activeScreen,
  onChangeScreen,
  pendingCount = 0,
  userInitial = 'J',
  progressPct = 0,
}) => {
  // SVG circular ring circumference for profile (radius 18)
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 px-4 pb-4 select-none">
      {/* 1-rasmdagi to'q qora-binafsha pill dock */}
      <div className="bg-[#121124] rounded-full p-2 flex items-center justify-between shadow-2xl border border-white/5">
        
        {/* 1. Vazifalar (Home) Tab */}
        {activeScreen === 'home' ? (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('home'); }}
            className="flex items-center space-x-2 bg-[#c4f82a] text-[#121124] px-4 py-2.5 rounded-full font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <Home size={18} strokeWidth={2.5} />
            <span className="tracking-tight text-[13px] font-extrabold">Vazifalar</span>
            <span className="w-5 h-5 rounded-full bg-[#121124] text-[#c4f82a] text-[11px] font-black flex items-center justify-center">
              {pendingCount}
            </span>
          </button>
        ) : (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('home'); }}
            className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <Home size={20} />
          </button>
        )}

        {/* 2. AI Tahlil Tab (Neon Purple Orb with Orange notification dot) */}
        <button
          onClick={() => { triggerHaptic('medium'); onChangeScreen('ai'); }}
          className="relative group transition-all active:scale-90"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              activeScreen === 'ai'
                ? 'bg-[#5e43f3] text-white shadow-lg ring-2 ring-[#c4f82a]/50 scale-105'
                : 'bg-[#5e43f3] text-white/90 hover:opacity-90'
            }`}
          >
            <Sparkles size={18} fill="currentColor" />
          </div>
          {/* 1-rasmdagi to'q sariq bildirishnoma nuqtasi 🟠 */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-[#ff5e3a] rounded-full border-2 border-[#121124]" />
        </button>

        {/* 3. Analitika Tab (3-bar chart icon inside dark circular container) */}
        <button
          onClick={() => { triggerHaptic('light'); onChangeScreen('analytics'); }}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            activeScreen === 'analytics'
              ? 'bg-[#222138] text-[#c4f82a] ring-2 ring-[#c4f82a]/40 scale-105'
              : 'bg-[#222138] text-slate-300 hover:text-white'
          }`}
        >
          {/* Custom 3-bar icon styled exactly like the screenshot */}
          <div className="flex items-end space-x-[3px] h-4">
            <span className="w-1 h-2 bg-[#c4f82a] rounded-full" />
            <span className="w-1 h-4 bg-white rounded-full" />
            <span className="w-1 h-3 bg-purple-300 rounded-full" />
          </div>
        </button>

        {/* 4. Profil Tab (User letter with animated circular lime progress ring) */}
        <button
          onClick={() => { triggerHaptic('light'); onChangeScreen('profile'); }}
          className={`relative w-11 h-11 flex items-center justify-center transition-all active:scale-90 ${
            activeScreen === 'profile' ? 'scale-105' : ''
          }`}
        >
          {/* Circular progress SVG */}
          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2.5"
              fill="none"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="#c4f82a"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-700"
            />
          </svg>

          {/* Central initial bubble */}
          <div className="absolute inset-1.5 rounded-full bg-[#5e43f3] flex items-center justify-center text-white text-xs font-black">
            {userInitial.toUpperCase()}
          </div>
        </button>

      </div>
    </div>
  );
};
