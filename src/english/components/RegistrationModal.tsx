import React, { useState } from 'react';
import { Sparkles, Scale } from 'lucide-react';
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
  const [showFullTerms, setShowFullTerms] = useState(false);
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
      setError("Iltimos, huquqiy shartlarni o'qib, shaxsiy javobgarlikni tasdiqlang.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0818]/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-[2.5rem] bg-white text-slate-900 p-6 shadow-2xl border border-indigo-100 my-auto">
        
        {/* Top Header */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#7052ff]/10 text-[#7052ff] flex items-center justify-center text-2xl mx-auto mb-2.5">
            🇬🇧
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Tanishib olamiz! 👋
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            IELTS Speaking, Writing va sherik bilan muloqot xonasi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Ism kiritish */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
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
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:bg-white focus:border-[#7052ff] outline-none transition-all"
            />
          </div>

          {/* Jinsni tanlash */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Jinsingiz (sherik tanlash filtri uchun)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setGender('male'); setError(null); }}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center space-x-2 transition-all ${
                  gender === 'male'
                    ? 'border-[#7052ff] bg-[#7052ff]/10 text-[#7052ff] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">👦</span>
                <span>O'g'il bola</span>
              </button>

              <button
                type="button"
                onClick={() => { setGender('female'); setError(null); }}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center space-x-2 transition-all ${
                  gender === 'female'
                    ? 'border-[#7052ff] bg-[#7052ff]/10 text-[#7052ff] shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">👧</span>
                <span>Qiz bola</span>
              </button>
            </div>
          </div>

          {/* Qonuniy Huquqiy Ogohlantirish & Foydalanish Shartlari */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-[11px] text-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-black text-amber-900 text-xs">
                <Scale size={14} className="text-amber-600" />
                <span>Huquqiy Ogohlantirish & Shartlar</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullTerms(!showFullTerms)}
                className="text-[10px] font-bold text-[#7052ff] underline"
              >
                {showFullTerms ? 'Yopish' : "Batafsil"}
              </button>
            </div>

            <p className="leading-snug text-slate-700">
              ⚖️ <b>To'liq Shaxsiy Javobgarlik:</b> Foydalanuvchi boshqa ishtirokchilar bilan muloqotda o'zining barcha xatti-harakatlari, shaxsiy axborotlarini o'z ixtiyori bilan ulashishi va o'z xavfsizligi uchun <b>O'zbekiston Respublikasi qonunchiligiga muvofiq to'liq shaxsan javobgar</b> hisoblanadi.
            </p>

            {showFullTerms && (
              <div className="mt-2 pt-2 border-t border-amber-200/60 text-[10px] text-slate-600 space-y-1.5 leading-relaxed animate-fade-in">
                <p>• <b>Daxlsizlik:</b> Platforma va ma'muriyat uchinchi shaxslarning harakatlari, odob-axloq buzilishlari uchun huquqiy yoki moddiy javobgarlikni o'z zimmasiga olmaydi.</p>
                <p>• <b>Taqiqlangan harakatlar:</b> Haqorat, noqonuniy materiallar, spam yoki bezorilik qat'iyan man etiladi va hisob darhol bloklanadi.</p>
                <p>• <b>AI baholari:</b> Sun'iy intellekt qo'ygan baholar taxminiy tavsiya bo'lib, rasmiy natija kuchi ga ega emas.</p>
              </div>
            )}

            <label className="flex items-start space-x-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => {
                  setRulesAccepted(e.target.checked);
                  setError(null);
                }}
                className="w-4 h-4 mt-0.5 rounded text-[#7052ff] accent-[#7052ff] cursor-pointer shrink-0"
              />
              <span className="text-xs font-black text-slate-900 leading-tight">
                Shartlar bilan tanishdim va barcha shaxsiy javobgarlikni to'liq o'z zimmamga olaman.
              </span>
            </label>
          </div>

          {/* Xatolik xabari */}
          {error && (
            <p className="text-xs font-bold text-red-500 text-center animate-fade-in">
              {error}
            </p>
          )}

          {/* Tasdiqlash tugmasi */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all hover:brightness-105"
          >
            <Sparkles size={16} />
            <span>Roziman va Boshlash 🚀</span>
          </button>
        </form>

      </div>
    </div>
  );
};
