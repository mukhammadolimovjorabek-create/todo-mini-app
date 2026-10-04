import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Flame, Users } from 'lucide-react';
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

  // Compute last scores from test history (only if test has actually been taken)
  const { readingScore, writingScore } = useMemo(() => {
    const results = getTestResults();
    const lastReading = results.find((r) => r.testType === 'reading');
    const lastWriting = results.find((r) => r.testType === 'writing_task1' || r.testType === 'writing_task2');
    return {
      readingScore: lastReading?.overallBand ? lastReading.overallBand.toFixed(1) : null,
      writingScore: lastWriting?.overallBand ? lastWriting.overallBand.toFixed(1) : null,
    };
  }, []);

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

  return (
    <div className="english-root min-h-screen bg-[#0e0d1d] flex flex-col text-white pb-10">
      {/* ── Top Header ── */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between sticky top-0 z-20 bg-[#0e0d1d]/90 backdrop-blur-md">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
          title="Orqaga"
        >
          <ArrowLeft size={18} />
        </button>

        <h2 className="text-sm font-black uppercase tracking-wider text-white">
          IELTS
        </h2>

        {/* Streak Pill */}
        <div className="flex items-center space-x-1.5 bg-[#1e1c3a] border border-white/10 px-3 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
          <Flame size={14} className="text-amber-400 fill-amber-400" />
          <span>3 kun</span>
        </div>
      </div>

      <div className="p-5 flex-1 max-w-md mx-auto w-full space-y-4">
        {/* Title Section */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80">
            BO'LIMNI TANLANG
          </span>
          <h1 className="text-2xl font-black text-white leading-tight">
            Bugun nimani kuchaytiramiz?
          </h1>
        </div>

        {/* ── 1. SPEAKING CARD (Full Width with Animated Waveform) ── */}
        <div className="bg-[#181630] border border-white/10 rounded-[2.2rem] p-5 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-[#c4f82a] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              AI EXAMINER • YANGI
            </span>

            {/* 7-Bar Animated Lime-Green Waveform (SMIL from prompt) */}
            <SpeakingWaveform width={65} height={44} />
          </div>

          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Speaking
            </h3>
            <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
              AI bilan shug'ullaning yoki haqiqiy inson bilan muloqot qiling.
            </p>
          </div>

          {/* Bottom Chips & Start Button */}
          <div className="flex items-center justify-between pt-1">
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
              <div className="text-[11px] font-extrabold text-indigo-100 bg-gradient-to-r from-indigo-500/30 to-purple-500/25 px-3 py-1.5 rounded-xl border border-indigo-400/40 shadow-xs flex items-center space-x-1.5">
                  <Users size={12} className="text-indigo-300 shrink-0" />
                  <span>Global Match</span>
                </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium'); setShowSpeakingModal(true);
              }}
              className="bg-[#c4f82a] hover:brightness-105 active:scale-95 text-[#121124] font-black text-xs px-4.5 py-2.5 rounded-full flex items-center space-x-1.5 shadow-md transition-all"
            >
              <span>Boshlash</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── 2-COLUMN GRID: READING & WRITING WITH ANIMATED MOVING ICONS ── */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {/* READING CARD */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('reading');
            }}
            className="bg-[#181630] border border-white/10 hover:border-blue-500/40 rounded-[2rem] p-4.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md group"
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

              <div className="w-7 h-7 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
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
              setActiveView('writing');
            }}
            className="bg-[#181630] border border-white/10 hover:border-purple-500/40 rounded-[2rem] p-4.5 flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md group"
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
                    triggerHaptic('success');
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

                {/* 2. Global Match */}
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    setShowSpeakingModal(false);
                    setActiveView('partner_speaking');
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 active:scale-[0.98] transition-all flex items-center gap-4 group shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">Global Match (Jonli)</h4>
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
