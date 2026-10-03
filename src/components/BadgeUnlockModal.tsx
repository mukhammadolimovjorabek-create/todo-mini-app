import React, { useEffect } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import type { BadgeItem } from '../utils/gamification';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  badge: BadgeItem | null;
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<Props> = ({ badge, onClose }) => {
  useEffect(() => {
    if (badge) {
      triggerHaptic('heavy');
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0818]/80 backdrop-blur-md animate-fade-in">
      {/* Container with radiant glow */}
      <div className="relative w-full max-w-sm rounded-[2.5rem] bg-[#121124] text-white p-7 text-center border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-up">
        
        {/* Glowing background flares */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#c4f82a]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#7052ff]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Sparkles & Confetti Dots */}
        <div className="absolute top-6 left-6 text-amber-300 animate-pulse text-lg">✨</div>
        <div className="absolute top-10 right-8 text-pink-400 animate-ping text-sm">🎉</div>
        <div className="absolute bottom-12 left-8 text-purple-300 animate-bounce text-sm">🌟</div>

        {/* Top Tag */}
        <div className="inline-flex items-center space-x-1.5 bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-5">
          <Trophy size={14} className="text-[#c4f82a]" />
          <span>Yangi Yutuq Ochildi!</span>
        </div>

        {/* Central Big Radiant Icon */}
        <div className="relative mx-auto my-3 w-28 h-28 flex items-center justify-center">
          {/* Rotating halo ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#c4f82a]/60 animate-spin-slow" />
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#7052ff] via-[#8b5cf6] to-[#c4f82a] p-1 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-[#121124] rounded-[1.4rem] flex items-center justify-center text-5xl select-none">
              {badge.icon}
            </div>
          </div>
        </div>

        {/* Sarlavha va Tavsif */}
        <h3 className="text-2xl font-black tracking-tight text-white mt-4">
          {badge.label}
        </h3>
        <p className="text-xs text-purple-200/80 mt-1.5 leading-relaxed px-2">
          {badge.desc}
        </p>

        {/* Tangalar Bonusi Qutisi */}
        {badge.rewardCoins > 0 && (
          <div className="my-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center space-x-2">
            <span className="text-2xl">🪙</span>
            <div>
              <p className="text-sm font-black text-amber-400">
                +{badge.rewardCoins} Tanga Bonusi!
              </p>
              <p className="text-[10px] text-slate-300 font-semibold">
                Balansingizga darhol qo'shildi
              </p>
            </div>
          </div>
        )}

        {/* Qabul qilish tugmasi */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onClose();
          }}
          className="w-full mt-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#c4f82a] to-[#a3e635] text-[#121124] font-black text-sm uppercase tracking-wider shadow-lg shadow-lime-400/25 flex items-center justify-center space-x-2 active:scale-95 transition-all hover:brightness-105"
        >
          <Sparkles size={18} />
          <span>Ajoyib, Rahmat!</span>
        </button>

      </div>
    </div>
  );
};
