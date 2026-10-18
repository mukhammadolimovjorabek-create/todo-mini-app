import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Flame, Users, Sparkles } from 'lucide-react';
import { AISpeakingView } from './AISpeakingView';
import { PartnerSpeakingView } from './PartnerSpeakingView';
import { WritingEvaluationView } from './WritingEvaluationView';
import { IeltsReadingView } from './IeltsReadingView';
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
}

type ActiveView = 'menu' | 'reading' | 'writing' | 'speaking' | 'ai_speaking' | 'partner_speaking';

export const IeltsDashboard: React.FC<Props> = ({ onBack, userName, userGender, initialView = 'menu' }) => {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);
  const [showSpeakingModal, setShowSpeakingModal] = useState(false);
  const [animatedBand, setAnimatedBand] = useState(0);

  // Compute last scores & active days from test history (refreshes whenever activeView changes back to 'menu')
  const { readingScore, writingScore, speakingScore, activeDaysCount, targetOrAvgBand, hasRealScore } = useMemo(() => {
    const results = getTestResults();
    const lastReading = results.find((r) => r.testType === 'reading' && !r.id.startsWith('ml_'));
    const lastWriting = results.find(
      (r) => (r.testType === 'writing_task1' || r.testType === 'writing_task2') && !r.id.startsWith('ml_')
    );
    const lastSpeaking = results.find(
      (r) => r.testType.startsWith('speaking_') && !r.id.startsWith('ml_') && r.overallBand <= 9.0
    );
    const uniqueDates = new Set(results.map((r) => r.date).filter(Boolean));

    const validScores = [
      lastReading?.overallBand,
      lastWriting?.overallBand,
      lastSpeaking?.overallBand,
    ].filter((v): v is number => typeof v === 'number' && v > 0);

    const avg =
      validScores.length > 0
        ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 2) / 2
        : 0;

    return {
      readingScore:
        lastReading?.overallBand !== undefined
          ? lastReading.overallBand === 0
            ? 'None'
            : lastReading.overallBand.toFixed(1)
          : null,
      writingScore: lastWriting?.overallBand ? lastWriting.overallBand.toFixed(1) : null,
      speakingScore:
        lastSpeaking?.overallBand !== undefined
          ? lastSpeaking.overallBand === 0
            ? '0.0'
            : lastSpeaking.overallBand.toFixed(1)
          : null,
      activeDaysCount: Math.max(1, uniqueDates.size),
      targetOrAvgBand: avg,
      hasRealScore: validScores.length > 0,
    };
  }, [activeView]);

  // A2 & A3: Smooth count-up animation for the Band Speedometer when entering menu
  useEffect(() => {
    if (activeView !== 'menu') return;
    if (!hasRealScore) {
      setAnimatedBand(0);
      return;
    }
    setAnimatedBand(0);
    let frame: number;
    const duration = 1100;
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedBand(Number((targetOrAvgBand * eased).toFixed(1)));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [activeView, targetOrAvgBand, hasRealScore]);

  if (activeView === 'reading') {
    return <IeltsReadingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'writing') {
    return <WritingEvaluationView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'ai_speaking') {
    return <AISpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'partner_speaking') {
    return <PartnerSpeakingView onBack={() => setActiveView('menu')} userName={userName} userGender={userGender} />;
  }

  // Arc math for semi-circle gauge (radius = 38, circumference half = PI * 38 ≈ 119.38)
  const arcLength = 119.38;
  const arcProgress = hasRealScore ? Math.min(1, animatedBand / 9.0) : 0;
  const strokeDashoffset = arcLength * (1 - arcProgress);

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

        <h2 className="text-sm font-black uppercase tracking-wider text-white">
          IELTS Academic
        </h2>

        {/* Streak Pill */}
        <div className="flex items-center space-x-1.5 bg-[#1e1c3a] border border-white/10 px-3 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
          <Flame size={14} className="text-amber-400 fill-amber-400 animate-bounce" />
          <span>{activeDaysCount} kun</span>
        </div>
      </div>

      <div className="p-5 flex-1 max-w-md mx-auto w-full space-y-4">
        {/* Title Section */}
        <div className="space-y-1 eng-cascade-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
            BO'LIMNI TANLANG
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">
            Bugun nimani kuchaytiramiz?
          </h1>
        </div>

        {/* ── A2: ANIMATED IELTS BAND SPEEDOMETER / RADAR BAR ── */}
        <div
          className="rounded-[2rem] p-4.5 border border-indigo-500/30 relative overflow-hidden flex items-center justify-between shadow-lg eng-cascade-1"
          style={{ background: 'linear-gradient(135deg, #161332 0%, #231b54 100%)' }}
        >
          <div className="eng-shimmer-sweep" />
          <div className="space-y-1 relative z-10 pr-2">
            <span className="inline-flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider text-[#c4f82a] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              <Sparkles size={10} />
              <span>{hasRealScore ? "O'RTACHA NATIJANGIZ" : 'MAQSAD: BAND 7.5+'}</span>
            </span>
            <h3 className="text-base font-black text-white leading-snug pt-0.5">
              {hasRealScore ? `Hozirgi daraja: Band ${animatedBand.toFixed(1)}` : 'Hali sinov topshirilmadi'}
            </h3>
            <p className="text-[11px] text-indigo-200/80 leading-relaxed">
              {hasRealScore
                ? 'Har bir yangi mashq natijangizni 9.0 shkala bo‘yicha yangilaydi.'
                : 'Speaking, Reading yoki Writing sinovini topshirib, o\'z haqiqiy Band darajangizni aniqlang!'}
            </p>
          </div>

          {/* Animated Semi-Circle Speedometer SVG */}
          <div className="relative w-24 h-16 shrink-0 flex flex-col items-center justify-end z-10">
            <svg viewBox="0 0 96 56" className="w-24 h-14 overflow-visible">
              <defs>
                <linearGradient id="ieltsGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7052ff" />
                  <stop offset="60%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#c4f82a" />
                </linearGradient>
              </defs>
              {/* Background Track Arc */}
              <path
                d="M 10 48 A 38 38 0 0 1 86 48"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Animated Foreground Arc (only when user has actual scores) */}
              {hasRealScore && (
                <path
                  d="M 10 48 A 38 38 0 0 1 86 48"
                  fill="none"
                  stroke="url(#ieltsGaugeGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(196, 248, 42, 0.5))' }}
                />
              )}
            </svg>
            <div className="absolute bottom-0.5 flex flex-col items-center leading-none">
              {hasRealScore ? (
                <>
                  <span className="text-base font-black text-[#c4f82a] tracking-tight">
                    {animatedBand.toFixed(1)}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">
                    / 9.0 BAND
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base font-black text-indigo-300 tracking-tight">
                    —
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">
                    / 9.0 BAND
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 1. SPEAKING CARD (Full Width with Animated Waveform & Shimmer) ── */}
        <div className="bg-[#181630] border border-white/10 hover:border-indigo-400/50 rounded-[2.2rem] p-5 shadow-xl relative overflow-hidden space-y-4 eng-cascade-2 eng-card-ielts-glow transition-all">
          <div className="eng-shimmer-sweep" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[9px] font-black uppercase text-[#c4f82a] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full eng-animate-pulse-badge">
              AI EXAMINER • YANGI
            </span>

            {/* 7-Bar Animated Lime-Green Waveform (SMIL from prompt) */}
            <SpeakingWaveform width={65} height={44} />
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tight">
              Speaking
            </h3>
            <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
              AI bilan shug'ullaning yoki haqiqiy inson bilan muloqot qiling.
            </p>
          </div>

          {/* Bottom Chips & Start Button */}
          <div className="flex items-center justify-between pt-1 relative z-10">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveView('ai_speaking');
                }}
                className="text-[11px] font-bold text-white/90 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
              >
                Part 1-3
              </button>
              {speakingScore && (
                <span className="text-[11px] font-bold text-[#c4f82a] bg-[#c4f82a]/10 border border-[#c4f82a]/20 px-2.5 py-1 rounded-xl">
                  Oxirgi: {speakingScore}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium'); setShowSpeakingModal(true);
              }}
              className="bg-[#c4f82a] hover:brightness-110 active:scale-95 text-[#121124] font-black text-xs px-4.5 py-2.5 rounded-full flex items-center space-x-1.5 shadow-[0_0_18px_rgba(196,248,42,0.35)] transition-all"
            >
              <span>Boshlash</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── 2-COLUMN GRID: READING & WRITING WITH ANIMATED MOVING ICONS ── */}
        <div className="grid grid-cols-2 gap-3.5 pt-1 eng-cascade-3">
          {/* READING CARD */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('reading');
            }}
            className="bg-[#181630] border border-white/10 hover:border-blue-500/50 rounded-[2rem] p-4.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md group relative overflow-hidden"
          >
            <div className="eng-shimmer-sweep eng-shimmer-sweep-delayed" />
            <div className="flex items-start justify-between relative z-10">
              {/* 52x52 Tile with Pulse Ring & Turning Page Book */}
              <div
                className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 relative"
                style={{ background: 'rgba(108,199,255,.16)', position: 'relative' }}
              >
                <TilePulseRing color="#6CC7FF" />
                <ReadingAnimatedBook size={32} />
              </div>

              <div className="w-7 h-7 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight size={14} />
              </div>
            </div>

            <div className="mt-4 relative z-10">
              <h4 className="text-base font-black text-white group-hover:text-sky-300 transition-colors">
                Reading
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                T/F/NG • 20 daqiqa
              </p>
            </div>

            {readingScore && (
              <div className="mt-3.5 relative z-10">
                <span className="inline-block text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-400/20 px-2.5 py-1 rounded-full">
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
              setActiveView('writing');
            }}
            className="bg-[#181630] border border-white/10 hover:border-purple-500/50 rounded-[2rem] p-4.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md group relative overflow-hidden"
          >
            <div className="eng-shimmer-sweep" />
            <div className="flex items-start justify-between relative z-10">
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

            <div className="mt-4 relative z-10">
              <h4 className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                Writing
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Task 1 & 2 • 4 mezon
              </p>
            </div>

            {writingScore && (
              <div className="mt-3.5 relative z-10">
                <span className="inline-block text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-400/20 px-2.5 py-1 rounded-full">
                  Oxirgi: {writingScore}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer disclaimer */}
        <p className="text-[10px] text-slate-400/80 text-center pt-2">
          AI baholari taxminiy, rasmiy IELTS natijasi emas.
        </p>
      </div>

        {/* Speaking Mode Modal */}
        {showSpeakingModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0a0818]/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#181630] border border-white/10 w-full max-w-sm rounded-[2rem] p-6 space-y-5 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              
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
                {/* 1. AI Examiner */}
                <button
                  onClick={() => {
                    triggerHaptic('heavy');
                    setShowSpeakingModal(false);
                    setActiveView('ai_speaking');
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#c4f82a]/20 flex items-center justify-center text-[#c4f82a] shrink-0">
                    <SpeakingWaveform width={24} height={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-[#c4f82a] transition-colors">AI Examiner</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Xatosiz, aqlli sun'iy intellekt (9.0 daraja)</p>
                  </div>
                  <div className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-[#c4f82a] group-hover:text-black transition-all">
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
                    <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">Sherik qidirish (Jonli)</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Haqiqiy insonlar bilan jonli suhbat</p>
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
