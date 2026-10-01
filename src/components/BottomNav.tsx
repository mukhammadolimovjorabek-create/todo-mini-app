import React from 'react';
import { Home, Bot, BarChart2, User } from 'lucide-react';
import type { ScreenType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  activeScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
}

const NAV_ITEMS: { id: ScreenType; label: string; icon: React.FC<any>; gradient: string }[] = [
  { id: 'home',      label: 'Vazifalar', icon: Home,      gradient: 'from-indigo-500 to-purple-500' },
  { id: 'ai',        label: 'AI Tahlil', icon: Bot,       gradient: 'from-purple-500 to-pink-500' },
  { id: 'analytics', label: 'Analitika', icon: BarChart2,  gradient: 'from-pink-500 to-rose-500' },
  { id: 'profile',   label: 'Profil',    icon: User,      gradient: 'from-amber-400 to-orange-500' },
];

export const BottomNav: React.FC<Props> = ({ activeScreen, onChangeScreen }) => (
  <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40">
    {/* Frosted glass bar */}
    <div className="mx-3 mb-3 bg-white/90 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl px-4 py-2.5 flex items-center justify-between">
      {NAV_ITEMS.map(({ id, label, icon: Icon, gradient }) => {
        const active = activeScreen === id;
        return (
          <button
            key={id}
            onClick={() => { triggerHaptic('light'); onChangeScreen(id); }}
            className="flex flex-col items-center justify-center space-y-1 transition-all active:scale-90 flex-1"
          >
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                active
                  ? `bg-gradient-to-br ${gradient} shadow-md scale-110 text-white`
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold tracking-tight transition-all ${
              active ? 'text-slate-800' : 'text-slate-400'
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);
