import React, { useState } from 'react';
import { ArrowLeft, Sparkles, BookOpen, Mic, Users, Trophy, Settings } from 'lucide-react';
import { EXAM_REGISTRY } from './exams';
import type { ExamType, EnglishUserProfile } from './types';
import { getEnglishProfile } from './utils/storage';
import { RegistrationModal } from './components/RegistrationModal';
import { SettingsSheet } from './components/SettingsSheet';
import { IeltsDashboard } from './components/IeltsDashboard';
import './tokens.css';

export interface TelegramUserProps {
  id?: number | string;
  first_name?: string;
  username?: string;
}

export interface EnglishPracticeModuleProps {
  telegramUser?: TelegramUserProps;
  apiBaseUrl?: string;
  onExit?: () => void;
}

export const EnglishPracticeModule: React.FC<EnglishPracticeModuleProps> = ({
  telegramUser,
  onExit,
}) => {
  const [profile, setProfile] = useState<EnglishUserProfile | null>(() => getEnglishProfile());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);

  // Active display name and gender
  const currentName = profile?.displayName || telegramUser?.first_name || 'Talaba';
  const currentGender = profile?.gender;

  if (selectedExam === 'ielts') {
    return (
      <div className="english-root">
        {!profile && (
          <RegistrationModal
            initialName={telegramUser?.first_name}
            telegramId={telegramUser?.id}
            onRegistered={(p) => setProfile(p)}
          />
        )}
        <IeltsDashboard
          onBack={() => setSelectedExam(null)}
          userName={currentName}
          userGender={currentGender}
        />
      </div>
    );
  }

  return (
    <div className="english-root">
      {/* ── First Open Registration Modal (Phase 1) ── */}
      {!profile && (
        <RegistrationModal
          initialName={telegramUser?.first_name}
          telegramId={telegramUser?.id}
          onRegistered={(p) => setProfile(p)}
        />
      )}

      {/* ── Settings Sheet (Phase 1) ── */}
      {showSettings && profile && (
        <SettingsSheet
          profile={profile}
          onClose={() => setShowSettings(false)}
          onUpdated={(p) => setProfile(p)}
        />
      )}

      {/* ── Top Scoped Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/70 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          {onExit && (
            <button
              onClick={onExit}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
              title="Chiqish"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#7052ff]">English Practice</span>
              <span className="text-[10px] font-bold bg-[#7052ff]/10 text-[#7052ff] px-2 py-0.5 rounded-full">v1.0</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Ingliz tili mashqlari 🇬🇧
            </h2>
          </div>
        </div>

        {/* Profile info & Settings button */}
        {profile && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-full transition-all active:scale-95 border border-indigo-100/80"
              title="Sozlamalar"
            >
              <span className="text-sm">{currentGender === 'female' ? '👧' : '👦'}</span>
              <span className="text-xs font-bold text-slate-800 max-w-[80px] truncate">{currentName}</span>
              <Settings size={14} className="text-slate-400 ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content Container ── */}
      <div className="flex-1 p-5 space-y-5">
        
        {/* Banner Card */}
        <div
          className="rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 50%, #351e8c 100%)' }}
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#c4f82a]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#c4f82a] border border-white/10 mb-3">
              <Sparkles size={11} />
              <span>IELTS & Multilevel AI</span>
            </span>
            <h3 className="text-xl font-black leading-snug">
              Xush kelibsiz, {currentName}! 🎯
            </h3>
            <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
              Qat'iy mezonlar asosida Writing insho tahlili, AI Examiner bilan Speaking va sherik bilan jonli muloqot.
            </p>
          </div>
        </div>

        {/* Exam Cards Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Imtihon turini tanlang
            </h4>
            <span className="text-[10px] font-bold text-slate-400">2 ta yo'nalish</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {/* IELTS Card */}
            {(() => {
              const ielts = EXAM_REGISTRY.ielts;
              return (
                <div
                  onClick={() => setSelectedExam('ielts')}
                  className="p-5 rounded-[2rem] border border-slate-100 hover:border-[#7052ff]/40 bg-white cursor-pointer transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#7052ff]/10 text-2xl flex items-center justify-center shrink-0">
                        {ielts.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-black text-slate-900">{ielts.title}</h4>
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Faol</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{ielts.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <BookOpen size={16} className="mx-auto text-[#7052ff] mb-1" />
                      <p className="text-[10px] font-bold text-slate-700">Writing (Task 2)</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <Mic size={16} className="mx-auto text-amber-500 mb-1" />
                      <p className="text-[10px] font-bold text-slate-700">AI Speaking</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <Users size={16} className="mx-auto text-emerald-500 mb-1" />
                      <p className="text-[10px] font-bold text-slate-700">Sherik bilan</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Multilevel Card */}
            {(() => {
              const ml = EXAM_REGISTRY.multilevel;
              return (
                <div
                  className="p-5 rounded-[2rem] border border-dashed border-teal-200/80 bg-teal-50/30 transition-all opacity-85"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100/60 text-2xl flex items-center justify-center shrink-0">
                        {ml.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-black text-slate-900">{ml.title}</h4>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Tez orada</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{ml.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-teal-800/80 mt-3 bg-teal-100/50 p-2.5 rounded-xl leading-relaxed">
                    💡 Rasmiy milliy sertifikat mezonlari kiritilmoqda. Tez orada to'liq ishga tushiriladi.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Quick Health & Isolation Status */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center space-x-1.5">
              <Trophy size={14} className="text-[#7052ff]" />
              <span>Modul Holati:</span>
            </span>
            <span className="text-emerald-600 font-black">PHASE 0 & 1 Tayyor ✓</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Mavjud To-Do ilovangizdan to'liq ajratilgan (Zero-conflict). Faqat <code>src/english/</code> va <code>server/english/</code> ichida ishlaydi.
          </p>
        </div>

      </div>
    </div>
  );
};
