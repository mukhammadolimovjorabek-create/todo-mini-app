import React, { useState, useRef } from 'react';
import { 
  Zap, 
  Target, 
  Flame, 
  Camera, 
  Check, 
  Pencil 
} from 'lucide-react';
import type { TelegramUser } from '../types';
import { 
  loadTasks, 
  getLast7Days, 
  today, 
  getCustomProfile, 
  saveCustomProfile 
} from '../utils/storage';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  user: TelegramUser;
  onProfileUpdate?: () => void;
}

export const ScreenProfile: React.FC<Props> = ({ user, onProfileUpdate }) => {
  const [profile, setProfile] = useState(() => getCustomProfile());
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTasks = loadTasks();
  const done = allTasks.filter((t) => t.done).length;
  const total = allTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Streak
  const days = getLast7Days().reverse();
  let streak = 0;
  for (const d of days) {
    if (d.done > 0) streak++;
    else break;
  }

  const todayTasks = allTasks.filter((t) => t.createdAt === today());
  const todayDone = todayTasks.filter((t) => t.done).length;

  // Hozirgi ism va rasm
  const displayName = profile.displayName || user.first_name || 'Foydalanuvchi';
  const avatarUrl = profile.avatarUrl || user.photo_url || '';

  // Galereyadan rasm yuklash
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('medium');
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const updated = saveCustomProfile({ avatarUrl: base64 });
        setProfile(updated);
        onProfileUpdate?.();
        triggerHaptic('heavy');
      }
    };
    reader.readAsDataURL(file);
  };

  // Ismni saqlash
  const handleSaveName = () => {
    if (tempName.trim()) {
      triggerHaptic('medium');
      const updated = saveCustomProfile({ displayName: tempName.trim() });
      setProfile(updated);
      setIsEditingName(false);
      onProfileUpdate?.();
    }
  };

  // Badges (Yutuqlar)
  const badges: { icon: string; label: string; earned: boolean; desc: string }[] = [
    { icon: '🚀', label: 'Tezkor start', earned: total >= 1, desc: 'Birinchi vazifani yaratish' },
    { icon: '🔥', label: '3 kun streak', earned: streak >= 3, desc: '3 kun uzluksiz reja' },
    { icon: '🏆', label: '10 vazifa', earned: done >= 10, desc: '10 ta vazifani tugatish' },
    { icon: '💎', label: '50 vazifa', earned: done >= 50, desc: 'Haqiqiy mahsuldorlik' },
    { icon: '⚡', label: 'Bir kunda 5ta', earned: todayDone >= 5, desc: 'Kunlik rekord' },
    { icon: '🎯', label: '100% kun', earned: todayTasks.length > 0 && todayDone === todayTasks.length, desc: 'Barcha rejalarni yopish' },
    { icon: '👥', label: 'Do\'stlar lideri', earned: true, desc: 'Haftalik reytingda ishtirok' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#f6f7fb] pb-28 select-none">
      {/* ── Header gradient card ── */}
      <div
        className="relative px-6 pt-10 pb-8 text-white overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1e1552 0%, #351e8c 100%)' }}
      >
        <div className="flex items-center space-x-4 relative z-10">
          
          {/* Avatar (Galereyadan yuklash tugmasi bilan) */}
          <div className="relative group">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-3xl overflow-hidden border-3 border-[#c4f82a] shadow-xl bg-[#261769] cursor-pointer flex items-center justify-center relative active:scale-95 transition-all"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-[#5e43f3]">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Kamera ikonka overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-[#c4f82a]" />
              </div>
            </div>

            {/* Yashirin fayl tanlagich */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>

          {/* Ism va Tahrirlash */}
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={tempName}
                  autoFocus
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="bg-white/20 text-white font-bold text-base px-2.5 py-1 rounded-xl outline-none border border-[#c4f82a] w-full"
                  placeholder="Ismingiz..."
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-xl bg-[#c4f82a] text-[#121124] active:scale-90"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight">{displayName}</h2>
                <button
                  onClick={() => {
                    setTempName(displayName);
                    setIsEditingName(true);
                  }}
                  className="p-1 text-[#c4f82a] hover:opacity-80 active:scale-90"
                  title="Ismni o'zgartirish"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}

            <p className="text-purple-200 text-xs mt-0.5">@{user.username || 'foydalanuvchi'}</p>

            <div className="flex items-center space-x-1.5 mt-2 bg-white/10 rounded-full px-3 py-1 w-fit border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#c4f82a] animate-pulse" />
              <span className="text-[11px] font-bold text-white/90">Faol Rejalashtiruvchi</span>
            </div>
          </div>
        </div>

        {/* Maslahat */}
        <p className="text-[10px] text-purple-200/80 mt-4 relative z-10">
          💡 Rasm ustiga bosib galereyangizdan xohlagan rasmni o'rnatishingiz mumkin.
        </p>
      </div>

      {/* ── Stats 3 grid ── */}
      <div className="px-5 -mt-4 relative z-20">
        <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-amber-500 mb-1">
              <Flame size={18} />
            </div>
            <p className="text-xl font-black text-slate-900">{streak}</p>
            <p className="text-[10px] text-slate-400 font-bold">Kun streak</p>
          </div>
          <div className="border-x border-slate-100">
            <div className="flex items-center justify-center space-x-1 text-[#7052ff] mb-1">
              <Target size={18} />
            </div>
            <p className="text-xl font-black text-slate-900">{done}</p>
            <p className="text-[10px] text-slate-400 font-bold">Bajarildi</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-emerald-500 mb-1">
              <Zap size={18} />
            </div>
            <p className="text-xl font-black text-slate-900">{pct}%</p>
            <p className="text-[10px] text-slate-400 font-bold">Samaradorlik</p>
          </div>
        </div>
      </div>

      {/* ── Badges Section ── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Yutuqlar va Nishonlar</h3>
          <span className="text-[11px] font-bold text-[#7052ff]">
            {badges.filter((b) => b.earned).length} / {badges.length} ochildi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((b) => (
            <div
              key={b.label}
              className={`p-3.5 rounded-2xl border transition-all ${
                b.earned
                  ? 'bg-white border-slate-100 shadow-xs'
                  : 'bg-slate-50/60 border-dashed border-slate-200 opacity-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-xs font-black text-slate-800">{b.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{b.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
