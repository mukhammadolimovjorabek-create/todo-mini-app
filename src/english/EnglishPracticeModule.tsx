import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Settings, Award, ChevronRight, Clock, Trophy, Users } from 'lucide-react';
import type { ExamType, EnglishUserProfile, TestResultItem } from './types';
import { getEnglishProfile, getTestResults } from './utils/storage';
import { RegistrationModal } from './components/RegistrationModal';
import { SettingsSheet } from './components/SettingsSheet';
import { IeltsDashboard } from './components/IeltsDashboard';
import { MultilevelDashboard } from './components/MultilevelDashboard';
import { triggerHaptic } from '../utils/telegram';
import {
  SpeakingWaveform,
  TilePulseRing,
  ReadingAnimatedBook,
  WritingAnimatedPencil,
} from './components/AnimatedSectionIcons';
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
  const [ieltsInitialView, setIeltsInitialView] = useState<'menu' | 'reading' | 'writing' | 'speaking' | 'ai_speaking' | 'partner_speaking'>('menu');
  const [results, setResults] = useState<TestResultItem[]>(() => getTestResults());
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  // Compute last scores from test history (only if test has actually been taken)
  const { readingScore, writingScore } = useMemo(() => {
    const lastReading = results.find((r) => r.testType === 'reading');
    const lastWriting = results.find((r) => r.testType === 'writing_task1' || r.testType === 'writing_task2');
    return {
      readingScore: lastReading?.overallBand ? lastReading.overallBand.toFixed(1) : null,
      writingScore: lastWriting?.overallBand ? lastWriting.overallBand.toFixed(1) : null,
    };
  }, [results]);

  // Active display name and gender
  const currentName = profile?.displayName || telegramUser?.first_name || 'Talaba';
  const currentGender = profile?.gender;

  const handleReturnFromExam = () => {
    setSelectedExam(null);
    setIeltsInitialView('menu');
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

        {/* ── Section Picker ("Bo'limni tanlang" from Video & Prompt) ── */}
        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              BO'LIMNI TANLANG
            </span>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              Bugun nimani kuchaytiramiz?
            </h2>
          </div>

          {/* 1. SPEAKING CARD (Full Width with 7-Bar SMIL Waveform from Prompt) */}
          <div className="bg-[#181630] border border-white/10 rounded-[2.2rem] p-5 shadow-xl relative overflow-hidden space-y-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-[#c4f82a] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                AI EXAMINER • YANGI
              </span>

              {/* 7-bar SVG native waveform (SMIL) */}
              <SpeakingWaveform width={65} height={44} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Speaking
              </h3>
              <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
                AI bilan jonli suhbat yoki sherik topib mashq qiling.
              </p>
            </div>

            {/* Bottom Chips & Start Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIeltsInitialView('ai_speaking');
                    setSelectedExam('ielts');
                  }}
                  className="text-[11px] font-bold text-white/90 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
                >
                  Part 1-3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIeltsInitialView('partner_speaking');
                    setSelectedExam('ielts');
                  }}
                  className="text-[11px] font-extrabold text-indigo-100 bg-gradient-to-r from-indigo-500/30 to-purple-500/25 hover:from-indigo-500/40 hover:to-purple-500/35 px-3 py-1.5 rounded-xl border border-indigo-400/40 shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <Users size={12} className="text-indigo-300 shrink-0" />
                  <span>Sherik bilan</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setIeltsInitialView('ai_speaking');
                  setSelectedExam('ielts');
                }}
                className="bg-[#c4f82a] hover:brightness-105 active:scale-95 text-[#121124] font-black text-xs px-4.5 py-2.5 rounded-full flex items-center space-x-1.5 shadow-md transition-all"
              >
                <span>Boshlash</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* 2-COLUMN GRID: READING & WRITING WITH ANIMATED SVG SMIL ICONS */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* READING CARD */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                triggerHaptic('medium');
                setIeltsInitialView('reading');
                setSelectedExam('ielts');
              }}
              className="bg-[#181630] border border-white/10 hover:border-sky-400/50 rounded-[2rem] p-4.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md group text-white"
            >
              <div className="flex items-start justify-between">
                {/* 52x52 Tile with Pulse Ring & Turning Page Book */}
                <div
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 relative"
                  style={{ background: 'rgba(108,199,255,.16)', position: 'relative' }}
                >
                  <TilePulseRing color="#6CC7FF" />
                  <ReadingAnimatedBook size={32} />
                </div>

                <div className="w-7 h-7 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                  <ArrowRight size={14} />
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-black text-white">
                  Reading
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  T/F/NG • 20 daqiqa
                </p>
              </div>

              {readingScore && (
                <div className="mt-3.5">
                  <span className="inline-block text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                    Oxirgi: {readingScore}
                  </span>
                </div>
              )}
            </div>

            {/* WRITING CARD */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                triggerHaptic('medium');
                setIeltsInitialView('writing');
                setSelectedExam('ielts');
              }}
              className="bg-[#181630] border border-white/10 hover:border-violet-400/50 rounded-[2rem] p-4.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md group text-white"
            >
              <div className="flex items-start justify-between">
                {/* 52x52 Tile with Pulse Ring & Drawing Pencil */}
                <div
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 relative"
                  style={{ background: 'rgba(169,155,255,.18)', position: 'relative' }}
                >
                  <TilePulseRing color="#A99BFF" />
                  <WritingAnimatedPencil size={32} />
                </div>

                <div className="w-7 h-7 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-[#7052ff] group-hover:text-white transition-all">
                  <ArrowRight size={14} />
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-black text-white">
                  Writing
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Task 1 & 2 • 4 mezon
                </p>
              </div>

              {writingScore && (
                <div className="mt-3.5">
                  <span className="inline-block text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                    Oxirgi: {writingScore}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-0.5">
            AI baholari taxminiy, rasmiy IELTS natijasi emas.
          </p>

          {/* Multilevel Quick Switch Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setSelectedExam('multilevel');
            }}
            className="p-4.5 rounded-[1.8rem] border border-teal-200 bg-white hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                🇺🇿
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                    Milliy Multilevel (CEFR)
                  </h4>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Faol ✓
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  DTM & CEFR B1-C1 · Speaking, Writing, Mock
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <ChevronRight size={16} />
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
                        <span className="inline-block text-xs font-black bg-[#7052ff]/10 text-[#7052ff] px-2.5 py-1 rounded-xl">
                          Band {res.overallBand.toFixed(1)}
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
                            <span className="font-black text-slate-900 block">{res.criteriaScores.c1Score.toFixed(1)}</span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c1Name}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">{res.criteriaScores.c2Score.toFixed(1)}</span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c2Name}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">{res.criteriaScores.c3Score.toFixed(1)}</span>
                            <span className="text-[8px] text-slate-400 truncate">{res.criteriaScores.c3Name}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">{res.criteriaScores.c4Score.toFixed(1)}</span>
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
