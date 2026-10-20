import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Award, Users } from 'lucide-react';
import { MultilevelSpeakingView } from './MultilevelSpeakingView';
import { MultilevelWritingView } from './MultilevelWritingView';
import { PartnerSpeakingView } from './PartnerSpeakingView';
import { IeltsReadingView } from './IeltsReadingView';
import { GrammarPlacementView } from './GrammarPlacementView';
import { triggerHaptic } from '../../utils/telegram';
import { getTestResults } from '../utils/storage';
import {
  SpeakingWaveform,
  TilePulseRing,
  ReadingAnimatedBook,
  WritingAnimatedPencil,
} from './AnimatedSectionIcons';

interface Props {
  onBack: () => void;
  userName: string;
  userGender?: 'male' | 'female';
  initialView?: ActiveView;
  initialWritingTab?: 'task1' | 'task2';
}

type ActiveView = 'menu' | 'speaking' | 'writing' | 'reading' | 'partner_speaking' | 'placement';

export const MultilevelDashboard: React.FC<Props> = ({
  onBack,
  userName,
  userGender,
  initialView = 'menu',
  initialWritingTab = 'task2',
}) => {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);
  const [writingTab, setWritingTab] = useState<'task1' | 'task2'>(initialWritingTab);
  const [showSpeakingModal, setShowSpeakingModal] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);

  const { speakingScore, writingScore, readingScore, targetOrAvgPoints, hasRealScore } = useMemo(() => {
    const results = getTestResults();
    const lastSpeaking = results.find(
      (r) => (r.id.startsWith('ml_speaking_') || r.id.startsWith('ml_test_')) && r.overallBand > 0
    );
    const lastWriting = results.find((r) => r.id.startsWith('ml_writing_') && r.overallBand > 0);
    const lastReading = results.find((r) => r.id.startsWith('ml_reading_') && r.overallBand > 0);

    const validScores = [
      lastSpeaking?.overallBand,
      lastWriting?.overallBand,
      lastReading?.overallBand,
    ].filter((v): v is number => typeof v === 'number' && v > 0);

    const avg =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;

    return {
      speakingScore: lastSpeaking ? `${lastSpeaking.overallBand}/75` : null,
      writingScore: lastWriting ? `${lastWriting.overallBand}/75` : null,
      readingScore: lastReading ? `${Math.round(lastReading.overallBand)}/75` : null,
      targetOrAvgPoints: avg,
      hasRealScore: validScores.length > 0,
    };
  }, [activeView]);

  // A2: Smooth count-up animation for the 75-Point Speedometer when entering menu
  useEffect(() => {
    if (activeView !== 'menu') return;
    if (!hasRealScore) {
      setAnimatedPoints(0);
      return;
    }
    setAnimatedPoints(0);
    let frame: number;
    const duration = 1100;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedPoints(Math.round(targetOrAvgPoints * eased));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [activeView, targetOrAvgPoints, hasRealScore]);

  if (activeView === 'speaking') {
    return <MultilevelSpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'writing') {
    return (
      <MultilevelWritingView
        onBack={() => setActiveView('menu')}
        userName={userName}
        initialTab={writingTab}
      />
    );
  }

  if (activeView === 'reading') {
    return <IeltsReadingView onBack={() => setActiveView('menu')} userName={userName} examType="multilevel" />;
  }

  if (activeView === 'placement') {
    return <GrammarPlacementView onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'partner_speaking') {
    return (
      <PartnerSpeakingView
        onBack={() => setActiveView('menu')}
        userName={userName}
        userGender={userGender}
      />
    );
  }

  const arcLength = 119.38;
  const arcProgress = hasRealScore ? Math.min(1, animatedPoints / 75) : 0;
  const strokeDashoffset = arcLength * (1 - arcProgress);
  const cefrBadge = animatedPoints >= 65 ? 'C1' : animatedPoints >= 51 ? 'B2' : animatedPoints >= 38 ? 'B1' : '—';

  // ── MAIN DASHBOARD MENU ──
  return (
    <div
      className="english-root english-dark min-h-screen flex flex-col text-white pb-10"
      style={{ backgroundColor: '#0e0d1d', minHeight: '100vh', color: '#ffffff' }}
    >
      {/* ── Top Header ── */}
      <div
        className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(14, 13, 29, 0.95)' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          title="Orqaga"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Milliy Sertifikat
            </span>
            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full">
              CEFR B1-C1
            </span>
          </div>
          <h2 className="text-sm font-black text-white tracking-tight leading-tight">
            Multilevel Amaliyot 🇺🇿
          </h2>
        </div>

        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-4">
        {/* Banner Card with Animated 75-Point CEFR Speedometer */}
        <div
          className="rounded-[2.2rem] p-5 text-white relative overflow-hidden shadow-xl border border-emerald-500/30 flex items-center justify-between gap-3 eng-cascade-1"
          style={{ background: 'linear-gradient(135deg, #09211c 0%, #0e3b32 60%, #155e51 100%)' }}
        >
          <div className="eng-shimmer-sweep" />
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#c4f82a]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-1.5">
            <span className="inline-flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#c4f82a] eng-animate-pulse-badge">
              <Award size={12} />
              <span>{hasRealScore ? `O'RTACHA BALL (${cefrBadge})` : 'MAQSAD: CEFR C1 (65+ BALL)'}</span>
            </span>
            <h3 className="text-lg font-black leading-snug">
              {hasRealScore ? `Multilevel Natijangiz: ${animatedPoints} ball` : 'Hali sinov topshirilmadi'}
            </h3>
            <p className="text-[11px] text-teal-100/90 leading-relaxed">
              {hasRealScore
                ? `Xush kelibsiz, ${userName}! DTM 75 ballik shkala bo'yicha har bir test natijangiz yangilanadi.`
                : `Xush kelibsiz, ${userName}! Speaking, Reading yoki Writing testini topshiring va 75 ballik rasmiy bahongizni oling.`}
            </p>
          </div>

          {/* Animated 75-Ball Speedometer Gauge */}
          <div className="relative w-24 h-16 shrink-0 flex flex-col items-center justify-end z-10">
            <svg viewBox="0 0 96 56" className="w-24 h-14 overflow-visible">
              <defs>
                <linearGradient id="mlGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="60%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#c4f82a" />
                </linearGradient>
              </defs>
              <path
                d="M 10 48 A 38 38 0 0 1 86 48"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {hasRealScore && (
                <path
                  d="M 10 48 A 38 38 0 0 1 86 48"
                  fill="none"
                  stroke="url(#mlGaugeGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.55))' }}
                />
              )}
            </svg>
            <div className="absolute bottom-0.5 flex flex-col items-center leading-none">
              {hasRealScore ? (
                <>
                  <span className="text-base font-black text-[#c4f82a] tracking-tight">
                    {animatedPoints} <span className="text-[10px] text-emerald-200">/75</span>
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">
                    CEFR {cefrBadge}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base font-black text-emerald-300 tracking-tight">
                    —
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                    / 75 BALL
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-3.5">
          {/* 1. Speaking Sinovi */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setShowSpeakingModal(true);
            }}
            className="p-5 rounded-[2rem] bg-[#181630] border border-white/10 hover:border-emerald-400/50 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99] space-y-3 text-white relative overflow-hidden eng-cascade-2 eng-card-ml-glow"
          >
            <div className="eng-shimmer-sweep" />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 relative"
                  style={{ background: 'rgba(16, 185, 129, 0.16)' }}
                >
                  <TilePulseRing color="#10B981" />
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <SpeakingWaveform color="#10B981" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                      Multilevel Speaking Sinovi
                    </h4>
                    <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      Jonli nutq
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Part 1.1 (30s) • Part 1.2 (Rasmlar) • Part 2 (Mavzu) • Part 3 (Debat)
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                <ArrowRight size={15} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1 relative z-10">
              <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                Part 1-3
              </span>
              <span className="text-[10px] font-black text-[#c4f82a] bg-[#c4f82a]/10 border border-[#c4f82a]/20 px-2.5 py-1 rounded-xl">
                Full Mock Sinov
              </span>
              {speakingScore && (
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-xl">
                  Oxirgi: {speakingScore}
                </span>
              )}
            </div>
          </div>

          {/* 2. Writing Sinovi */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setWritingTab('task2');
              setActiveView('writing');
            }}
            className="p-5 rounded-[2rem] bg-[#181630] border border-white/10 hover:border-violet-400/50 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99] space-y-3 text-white relative overflow-hidden eng-cascade-3"
          >
            <div className="eng-shimmer-sweep eng-shimmer-sweep-delayed" />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 relative"
                  style={{ background: 'rgba(169,155,255,.18)' }}
                >
                  <TilePulseRing color="#A99BFF" />
                  <WritingAnimatedPencil size={32} />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-white group-hover:text-violet-400 transition-colors">
                      Multilevel Writing Sinovi
                    </h4>
                    <span className="text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-400/30 px-2 py-0.5 rounded-full">
                      Task 1 & 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    2022–2026 rasmiy xat va B2/C1 insho mavzulari (50 tagacha)
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-[#7052ff] group-hover:text-white transition-all shrink-0">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Interactive direct task buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 relative z-10">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setWritingTab('task1');
                  setActiveView('writing');
                }}
                className="text-[10px] font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 px-2.5 py-1 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                ✉️ Task 1: Xatlar (20 daqiqa)
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  setWritingTab('task2');
                  setActiveView('writing');
                }}
                className="text-[10px] font-bold text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/25 px-2.5 py-1 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                📝 Task 2: Insho (40 daqiqa)
              </span>
              {writingScore && (
                <span className="text-[10px] font-black text-violet-300 bg-violet-500/15 border border-violet-400/30 px-2.5 py-1 rounded-xl">
                  Oxirgi: {writingScore}
                </span>
              )}
            </div>
          </div>

          {/* 3. Reading Sinovi */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('reading');
            }}
            className="p-5 rounded-[2rem] bg-[#181630] border border-white/10 hover:border-sky-400/50 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99] space-y-3 text-white relative overflow-hidden eng-cascade-4"
          >
            <div className="eng-shimmer-sweep" />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 relative"
                  style={{ background: 'rgba(108,199,255,.16)' }}
                >
                  <TilePulseRing color="#6CC7FF" />
                  <ReadingAnimatedBook size={32} />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-white group-hover:text-sky-400 transition-colors">
                      Multilevel Reading Sinovi
                    </h4>
                    <span className="text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                      B1-C1 Matnlar
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Akademik matnlar tahlili, TFNG, MCQ va xatolar ustida ishlash
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all shrink-0">
                <ArrowRight size={15} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 relative z-10">
              <span className="text-[10px] font-bold text-sky-300 bg-sky-400/10 border border-sky-400/25 px-2.5 py-1 rounded-xl">
                📖 3 ta Passage (20 / 60 daqiqa)
              </span>
              {readingScore && (
                <span className="text-[10px] font-black text-sky-200 bg-sky-500/15 border border-sky-400/30 px-2.5 py-1 rounded-xl">
                  Oxirgi: {readingScore}
                </span>
              )}
            </div>
          </div>

          {/* 4. Darajani aniqlash (50 ta Full Grammar Test) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('placement');
            }}
            className="p-5 rounded-[2rem] bg-gradient-to-r from-[#0d2922] via-[#13382f] to-[#181630] border border-[#c4f82a]/35 hover:border-[#c4f82a]/70 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between text-white relative overflow-hidden eng-cascade-4"
          >
            <div className="eng-shimmer-sweep" />
            <div className="space-y-1 relative z-10 pr-3">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-2.5 py-0.5 rounded-full">
                  50 TA SAVOL • FULL GRAMMATIKA
                </span>
                <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  A2 – C1
                </span>
              </div>
              <h4 className="text-base font-black text-white group-hover:text-[#c4f82a] transition-colors pt-0.5">
                Darajani aniqlash (Placement Test)
              </h4>
              <p className="text-xs text-slate-300">
                Multilevel (75 ballik CEFR) va IELTS darajangizni 50 ta grammatik savol bilan aniqlang
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#c4f82a] text-[#091f1a] flex items-center justify-center shrink-0 font-black shadow-[0_0_16px_rgba(196,248,42,0.4)] group-hover:scale-105 transition-all relative z-10">
              <ArrowRight size={16} />
            </div>
          </div>

        </div>
      </div>

      {/* Speaking Mode Modal (Sherik qidirish vs AI Examiner) */}
      {showSpeakingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0a0818]/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#181630] border border-emerald-500/30 w-full max-w-sm rounded-[2rem] p-6 space-y-5 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <button
              onClick={() => setShowSpeakingModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
              ✕
            </button>

            <div className="text-center space-y-1 pr-8">
              <h3 className="text-xl font-black text-white tracking-tight">Speaking Tartibi</h3>
              <p className="text-xs text-slate-400 font-medium">Kim bilan shug'ullanishni tanlang:</p>
            </div>

            <div className="space-y-3">
              {/* 1. CEFR AI Examiner */}
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowSpeakingModal(false);
                  setActiveView('speaking');
                }}
                className="w-full text-left p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <SpeakingWaveform color="#10B981" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                    CEFR AI Examiner
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    DTM standarti (B1-C1) bo'yicha sun'iy intellekt
                  </p>
                </div>
                <div className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  <ArrowRight size={12} />
                </div>
              </button>

              {/* 2. Sherik qidirish */}
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowSpeakingModal(false);
                  setActiveView('partner_speaking');
                }}
                className="w-full text-left p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 active:scale-[0.98] transition-all flex items-center gap-4 group shadow-[0_0_15px_rgba(99,102,241,0.1)]"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">
                    Sherik qidirish (Jonli)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Haqiqiy insonlar bilan jonli suhbat va mashq
                  </p>
                </div>
                <div className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <ArrowRight size={12} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
