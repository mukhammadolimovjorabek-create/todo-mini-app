import React, { useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import type { EnglishUserProfile } from '../types';
import { saveEnglishProfile, acceptEnglishRules } from '../utils/storage';

interface Props {
  initialName?: string;
  telegramId?: number | string;
  onRegistered: (profile: EnglishUserProfile) => void;
}

export const RegistrationModal: React.FC<Props> = ({
  initialName = '',
  telegramId = 1,
  onRegistered,
}) => {
  const [name, setName] = useState(initialName.trim() || 'Talaba');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2 || name.trim().length > 30) {
      setError("Ism 2 dan 30 tagacha belgidan iborat bo'lishi kerak.");
      return;
    }
    if (!gender) {
      setError("Iltimos, jinsingizni tanlang.");
      return;
    }
    if (!rulesAccepted) {
      setError("Iltimos, modul qoidalarini tasdiqlang.");
      return;
    }

    const newProfile: EnglishUserProfile = {
      telegramId,
      displayName: name.trim(),
      gender,
      rulesAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    saveEnglishProfile(newProfile);
    acceptEnglishRules();
    onRegistered(newProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0818]/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-[2.5rem] bg-white text-slate-900 p-6 shadow-2xl border border-indigo-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#7052ff]/10 text-[#7052ff] flex items-center justify-center text-2xl mx-auto mb-3">
            🇬🇧
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Tanishib olamiz! 👋
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Speaking sherik tanlash va AI mashg'ulotlar uchun profilingizni tasdiqlang.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ism kiritish */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Ismingiz (taxallusingiz)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={30}
              placeholder="Ismingizni yozing..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#7052ff] outline-none transition-all"
            />
          </div>

          {/* Jinsni tanlash (Two big gender buttons) */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Jinsingiz (sherik tanlash uchun)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setGender('male'); setError(null); }}
                className={`py-3.5 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center space-x-2 transition-all ${
                  gender === 'male'
                    ? 'border-[#7052ff] bg-[#7052ff]/10 text-[#7052ff] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">👦</span>
                <span>O'g'il bola</span>
              </button>

              <button
                type="button"
                onClick={() => { setGender('female'); setError(null); }}
                className={`py-3.5 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center space-x-2 transition-all ${
                  gender === 'female'
                    ? 'border-[#7052ff] bg-[#7052ff]/10 text-[#7052ff] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">👧</span>
                <span>Qiz bola</span>
              </button>
            </div>
          </div>

          {/* Qoidalar bloki */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-[11px] text-slate-700">
            <div className="flex items-center space-x-1.5 font-black text-[#534ab7] text-xs mb-1">
              <ShieldCheck size={14} />
              <span>Modul qoidalari</span>
            </div>
            <p>• Sheriklar bilan xushmuomala bo'ling, haqorat taqiqlanadi.</p>
            <p>• Shaxsiy yoki maxfiy ma'lumotlaringizni baham ko'rmang.</p>
            <p>• AI bergan ballar rasmiy emas, taxminiy tayyorgarlik uchundir.</p>

            <label className="flex items-center space-x-2 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => {
                  setRulesAccepted(e.target.checked);
                  setError(null);
                }}
                className="w-4 h-4 rounded text-[#7052ff] accent-[#7052ff] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Qoidalarni qabul qilaman
              </span>
            </label>
          </div>

          {/* Xatolik xabari */}
          {error && (
            <p className="text-xs font-bold text-red-500 text-center animate-fade-in">
              {error}
            </p>
          )}

          {/* Davom etish tugmasi */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all hover:brightness-105"
          >
            <Sparkles size={16} />
            <span>Mashqlarni boshlash 🚀</span>
          </button>
        </form>

      </div>
    </div>
  );
};
