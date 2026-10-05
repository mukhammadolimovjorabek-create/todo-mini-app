import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Settings, Award, Clock, Trophy } from 'lucide-react';
import type { ExamType, EnglishUserProfile, TestResultItem } from './types';
import { getEnglishProfile, getTestResults } from './utils/storage';
import { RegistrationModal } from './components/RegistrationModal';
import { SettingsSheet } from './components/SettingsSheet';
import { IeltsDashboard } from './components/IeltsDashboard';
import { MultilevelDashboard } from './components/MultilevelDashboard';
import { triggerHaptic } from '../utils/telegram';
import { SpeakingWaveform } from './components/AnimatedSectionIcons';
import { UzFlagWave } from './components/UzFlagWave';
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
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('room')) return 'ielts';
    } catch {}
    return null;
  });
  const [ieltsInitialView, setIeltsInitialView] = useState<'menu' | 'reading' | 'writing' | 'speaking' | 'ai_speaking' | 'partner_speaking'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('room')) return 'partner_speaking';
    } catch {}
    return 'menu';
  });
  const [multilevelInitialView, setMultilevelInitialView] = useState<'menu' | 'speaking' | 'writing' | 'partner_speaking'>('menu');
  const [results, setResults] = useState<TestResultItem[]>(() => getTestResults());
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  // Active display name and gender
  const currentName = profile?.displayName || telegramUser?.first_name || 'Talaba';
  const currentGender = profile?.gender;

  const handleReturnFromExam = () => {
    setSelectedExam(null);
    setIeltsInitialView('menu');
    setMultilevelInitialView('menu');
    setResults(getTestResults()); // Refresh test results history
  };

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
          initialView={ieltsInitialView}
          onBack={handleReturnFromExam}
          userName={currentName}
          userGender={currentGender}
        />
      </div>
    );
  }

  if (selectedExam === 'multilevel') {
    return (
      <div className="english-root">
        {!profile && (
          <RegistrationModal
            initialName={telegramUser?.first_name}
            telegramId={telegramUser?.id}
            onRegistered={(p) => setProfile(p)}
          />
        )}
        <MultilevelDashboard
          initialView={multilevelInitialView}
          onBack={handleReturnFromExam}
          userName={currentName}
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
              <span className="text-[10px] font-bold bg-[#7052ff]/10 text-[#7052ff] px-2 py-0.5 rounded-full">v1.2</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Ingliz tili mashqlari
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

        {/* ── Section Picker (IELTS va Multilevel dastlabki ekrani) ── */}
        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              IMTIHON DASTURINI TANLANG
            </span>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              Qaysi yo'nalishda tayyorlanasiz?
            </h2>
          </div>

          {/* ── 1. KATTA IELTS KARTASI (Speaking, Reading, Writing shu bo'lim ichida) ── */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setIeltsInitialView('menu');
              setSelectedExam('ielts');
            }}
            className="bg-[#181630] border border-indigo-500/30 hover:border-indigo-400/60 rounded-[2.2rem] p-6 shadow-xl relative overflow-hidden space-y-4 text-white group cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-[#7052ff]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Badge & Animated Waveform */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#c4f82a] bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  🇬🇧 HALQARO DASTUR
                </span>
                <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-400/20">
                  Band 9.0
                </span>
              </div>

              {/* 7-bar SVG native waveform (SMIL) */}
              <SpeakingWaveform width={55} height={36} />
            </div>

            {/* Title & Description */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                IELTS Exam Practice
              </h3>
              <p className="text-xs text-slate-300/90 leading-relaxed">
                Speaking (AI Examiner & Jonli sherik), Reading (T/F/NG) va Writing Task 1-2 baholash mezonlari.
              </p>
            </div>

            {/* Sub-section Pills */}
            <div className="flex flex-wrap gap-2 pt-1 relative z-10">
              <span className="text-[10px] font-extrabold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                🎙️ Speaking (AI & Sherik)
              </span>
              <span className="text-[10px] font-extrabold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                📖 Reading
              </span>
              <span className="text-[10px] font-extrabold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                ✍️ Writing Task 1 & 2
              </span>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10">
              <span className="text-[11px] font-semibold text-slate-400">
                Barcha IELTS bo'limlariga o'tish
              </span>
              <div className="bg-[#c4f82a] group-hover:brightness-105 text-[#121124] font-black text-xs px-4 py-2 rounded-full flex items-center space-x-1.5 shadow-md transition-all">
                <span>IELTS ga kirish</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>

          {/* ── 2. KATTALASHTIRILGAN MULTILEVEL (CEFR) KARTASI ── */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setMultilevelInitialView('menu');
              setSelectedExam('multilevel');
            }}
            className="bg-[#181630] border border-emerald-500/35 hover:border-emerald-400/60 rounded-[2.2rem] p-6 shadow-xl relative overflow-hidden space-y-4 text-white group cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Badge & UZ Flag Shield */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 rounded-full flex items-center space-x-1">
                  <span className="animate-flag-wave inline-block">🇺🇿</span>
                  <span>MILLIY SERTIFIKAT</span>
                </span>
                <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  CEFR B1 - C1
                </span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner overflow-hidden">
                <UzFlagWave width={28} />
              </div>
            </div>

            {/* Title & Description */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                Milliy Multilevel (CEFR)
              </h3>
              <p className="text-xs text-slate-300/90 leading-relaxed">
                DTM formati asosida: Part 1-3 Speaking sinovlari va Task 1 (Do'stga/rasmiy xat) hamda Task 2 (Insho) Writing.
              </p>
            </div>

            {/* Sub-section Pills */}
            <div className="flex flex-wrap gap-2 pt-1 relative z-10">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setMultilevelInitialView('speaking');
                  setSelectedExam('multilevel');
                }}
                className="text-[10px] font-extrabold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-800/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 cursor-pointer transition-all active:scale-95"
              >
                🎙️ Multilevel Speaking Sinovlari
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setMultilevelInitialView('writing');
                  setSelectedExam('multilevel');
                }}
                className="text-[10px] font-extrabold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-800/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 cursor-pointer transition-all active:scale-95"
              >
                ✉️ Task 1: Xatlar (20 daq)
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setMultilevelInitialView('writing');
                  setSelectedExam('multilevel');
                }}
                className="text-[10px] font-extrabold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-800/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 cursor-pointer transition-all active:scale-95"
              >
                📝 Task 2: Insho (40 daq)
              </span>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10">
              <span className="text-[11px] font-semibold text-slate-400">
                DTM & Milliy baholash sinovlariga o'tish
              </span>
              <div className="bg-emerald-500 group-hover:bg-emerald-400 text-[#091f1a] font-black text-xs px-4 py-2 rounded-full flex items-center space-x-1.5 shadow-md transition-all">
                <span>Multilevel ga kirish</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-rasm talabi: Topshirilgan Sinovlar va Natijalar Tarixi ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <Award size={14} className="text-[#7052ff]" />
              <span>Topshirilgan sinovlar va natijalar</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 font-mono">{results.length} ta natija</span>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 border border-dashed border-slate-200 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">Hozircha topshirilgan sinovlar yo'q</p>
              <p className="text-[11px] text-slate-400">
                AI Speaking yoki Writing bo'limida birinchi sinovingizni topshiring, natijasi vaqti bilan shu yerda saqlanadi.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.map((res) => {
                const isExpanded = expandedResultId === res.id;
                return (
                  <div
                    key={res.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setExpandedResultId(isExpanded ? null : res.id);
                    }}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-indigo-100 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {/* 4-rasm: 1.09.2026 soat 8dan 8:20gacha ko'rinishidagi vaqt */}
                        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400">
                          <Clock size={11} />
                          <span>{res.date} • soat {res.startTime} dan {res.endTime} gacha</span>
                        </div>
                        <h5 className="text-xs font-black text-slate-900 mt-1">{res.title}</h5>
                        <p className="text-[11px] text-slate-500 font-medium">Mavzu: {res.topic}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-xl ${
                          res.title.includes('Multilevel')
                            ? 'bg-teal-500/10 text-teal-700'
                            : 'bg-[#7052ff]/10 text-[#7052ff]'
                        }`}>
                          {res.title.includes('Multilevel')
                            ? `${Math.round(res.overallBand)} / 75 ball`
                            : `Band ${res.overallBand.toFixed(1)}`}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-1">
                          {isExpanded ? "Yopish ▲" : "Batafsil ▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expandable criteria breakdown */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 p-2 rounded-xl text-[10px]">
                          <div>
                            <span className="font-black text-slate-900 block">
                              {res.title.includes('Multilevel') ? Math.round(res.criteriaScores.c1Score) : res.criteriaScores.c1Score.toFixed(1)}
                            </span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c1Name}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">
                              {res.title.includes('Multilevel') ? Math.round(res.criteriaScores.c2Score) : res.criteriaScores.c2Score.toFixed(1)}
                            </span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c2Name}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">
                              {res.title.includes('Multilevel') ? Math.round(res.criteriaScores.c3Score) : res.criteriaScores.c3Score.toFixed(1)}
                            </span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c3Name}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">
                              {res.title.includes('Multilevel') ? Math.round(res.criteriaScores.c4Score) : res.criteriaScores.c4Score.toFixed(1)}
                            </span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c4Name}</span>
                          </div>
                        </div>

                        {res.improvements && res.improvements.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-700 block">Asosiy tavsiyalar:</span>
                            {res.improvements.map((imp, idx) => (
                              <p key={idx} className="text-[11px] text-slate-600 leading-snug pl-2 border-l-2 border-amber-300">
                                • {imp}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Health & Isolation Status */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center space-x-1.5">
              <Trophy size={14} className="text-[#7052ff]" />
              <span>Modul Holati:</span>
            </span>
            <span className="text-emerald-600 font-black">PHASE 0 & 1 & 2 Tayyor ✓</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Mavjud To-Do ilovangizdan to'liq ajratilgan (Zero-conflict). Faqat <code>src/english/</code> va <code>server/english/</code> ichida ishlaydi.
          </p>
        </div>

      </div>
    </div>
  );
};
