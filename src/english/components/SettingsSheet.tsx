import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';
import type { EnglishUserProfile } from '../types';
import { saveEnglishProfile } from '../utils/storage';

interface Props {
  profile: EnglishUserProfile;
  onClose: () => void;
  onUpdated: (profile: EnglishUserProfile) => void;
}

export const SettingsSheet: React.FC<Props> = ({ profile, onClose, onUpdated }) => {
  const [name, setName] = useState(profile.displayName);
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim() || name.trim().length < 2 || name.trim().length > 30) {
      setError("Ism 2 dan 30 tagacha belgidan iborat bo'lishi kerak.");
      return;
    }

    const updated: EnglishUserProfile = {
      ...profile,
      displayName: name.trim(),
      gender,
    };

    saveEnglishProfile(updated);
    onUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end">
      <div className="w-full max-w-md mx-auto bg-white rounded-t-[2.5rem] p-6 pb-8 space-y-4 shadow-2xl border-t border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User size={18} className="text-[#7052ff]" />
            <h3 className="font-black text-slate-900 text-base">Profil sozlamalari</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Ismni tahrirlash */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
            Ismingiz
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            maxLength={30}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#7052ff] outline-none"
          />
        </div>

        {/* Jinsni tahrirlash */}
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
            Jinsingiz
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 ${
                gender === 'male'
                  ? 'border-[#7052ff] bg-[#7052ff]/10 text-[#7052ff]'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span>👦 O'g'il bola</span>
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 ${
                gender === 'female'
                  ? 'border-[#7052ff] bg-[#7052ff]/10 text-[#7052ff]'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span>👧 Qiz bola</span>
            </button>
          </div>
        </div>

        {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-[#7052ff] text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5"
        >
          <Check size={16} />
          <span>Saqlash</span>
        </button>
      </div>
    </div>
  );
};
