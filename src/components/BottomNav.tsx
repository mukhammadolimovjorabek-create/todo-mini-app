import React from 'react';
import { Home, Sparkles, Trophy } from 'lucide-react';
import type { ScreenType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  activeScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
  pendingCount?: number;
  userInitial?: string;
  userAvatar?: string;
  progressPct?: number;
}

export const BottomNav: React.FC<Props> = ({
  activeScreen,
  onChangeScreen,
  pendingCount = 0,
  userInitial = 'J',
  userAvatar = '',
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 px-4 pb-4 select-none">
      {/* Zamonaviy suzuvchi dock */}
      <div className="bg-[#121124]/95 backdrop-blur-xl rounded-full p-2 flex items-center justify-between shadow-[0_12px_36px_rgba(0,0,0,0.45)] border border-white/10">
        
        {/* 1. Vazifalar (Home) Tab */}
        {activeScreen === 'home' ? (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('home'); }}
            className="flex items-center space-x-2 bg-[#c4f82a] text-[#121124] px-4 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-lime-400/20 transition-all duration-300 active:scale-95"
          >
            <Home size={18} strokeWidth={2.5} />
            <span className="tracking-tight text-[13px] font-black">Vazifalar</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#121124] text-[#c4f82a] text-[10px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('home'); }}
            className="relative w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-90"
            title="Vazifalar"
          >
            <Home size={20} strokeWidth={2} />
            {pendingCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#c4f82a] ring-2 ring-[#121124]" />
            )}
          </button>
        )}

        {/* 2. AI Murabbiy Tab */}
        {activeScreen === 'ai' ? (
          <button
            onClick={() => { triggerHaptic('medium'); onChangeScreen('ai'); }}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#7052ff] to-[#9333ea] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-purple-500/30 transition-all duration-300 active:scale-95"
          >
            <Sparkles size={18} fill="currentColor" />
            <span className="tracking-tight text-[13px] font-black">AI Murabbiy</span>
          </button>
        ) : (
          <button
            onClick={() => { triggerHaptic('medium'); onChangeScreen('ai'); }}
            className="relative w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-[#a78bfa] hover:bg-white/5 transition-all duration-200 active:scale-90"
            title="AI Murabbiy"
          >
            <Sparkles size={20} strokeWidth={2} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ff5e3a] ring-2 ring-[#121124]" />
          </button>
        )}

        {/* 3. Reyting Tab */}
        {activeScreen === 'analytics' ? (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('analytics'); }}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#c4f82a] to-[#a3e635] text-[#121124] px-4 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-lime-400/20 transition-all duration-300 active:scale-95"
          >
            <Trophy size={18} strokeWidth={2.5} />
            <span className="tracking-tight text-[13px] font-black">Reyting</span>
          </button>
        ) : (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('analytics'); }}
            className="relative w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-90"
            title="Reyting"
          >
            <Trophy size={20} strokeWidth={2} />
          </button>
        )}

        {/* 4. Profil Tab */}
        {activeScreen === 'profile' ? (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('profile'); }}
            className="flex items-center space-x-2 bg-[#7052ff] text-white px-3.5 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all duration-300 active:scale-95"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/50" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                {userInitial.toUpperCase()}
              </div>
            )}
            <span className="tracking-tight text-[13px] font-black">Profil</span>
          </button>
        ) : (
          <button
            onClick={() => { triggerHaptic('light'); onChangeScreen('profile'); }}
            className="relative w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-200 active:scale-90"
            title="Profil"
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#5e43f3]/60 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/20">
                {userInitial.toUpperCase()}
              </div>
            )}
          </button>
        )}

      </div>
    </div>
  );
};
