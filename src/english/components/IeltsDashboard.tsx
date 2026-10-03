import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Edit3, Flame } from 'lucide-react';
import { AISpeakingView } from './AISpeakingView';
import { PartnerSpeakingView } from './PartnerSpeakingView';
import { WritingEvaluationView } from './WritingEvaluationView';
import { IeltsReadingView } from './IeltsReadingView';
import { triggerHaptic } from '../../utils/telegram';
import { getTestResults } from '../utils/storage';

interface Props {
  onBack: () => void;
  userName: string;
  userGender?: 'male' | 'female';
  initialView?: ActiveView;
}

type ActiveView = 'menu' | 'reading' | 'writing' | 'speaking' | 'ai_speaking' | 'partner_speaking';

export const IeltsDashboard: React.FC<Props> = ({ onBack, userName, userGender, initialView = 'menu' }) => {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

  // Compute last scores from test history or fallback to video mock scores
  const { readingScore, writingScore } = useMemo(() => {
    const results = getTestResults();
    const lastReading = results.find((r) => r.testType === 'reading');
    const lastWriting = results.find((r) => r.testType === 'writing_task1' || r.testType === 'writing_task2');
    return {
      readingScore: lastReading?.overallBand ? lastReading.overallBand.toFixed(1) : '6.0',
      writingScore: lastWriting?.overallBand ? lastWriting.overallBand.toFixed(1) : '6.5',
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

            {/* 5-Bar Animated Lime-Green Waveform */}
            <div className="flex items-center space-x-1 h-6" title="Jonli ovoz to'lqini">
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-1 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-2 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-3 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-4 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-5 inline-block" />
            </div>
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
                  setActiveView('ai_speaking');
                }}
                className="text-[11px] font-bold text-white/90 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
              >
                Part 1-3
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveView('partner_speaking');
                }}
                className="text-[11px] font-bold text-white/90 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95"
              >
                Sherik bilan
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setActiveView('ai_speaking');
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
              {/* Moving Book Icon */}
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen size={22} className="eng-animate-book" />
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

            <div className="mt-3.5">
              <span className="inline-block text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                Oxirgi: {readingScore}
              </span>
            </div>
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
              {/* Moving Pen / Quill Icon */}
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Edit3 size={22} className="eng-animate-pen" />
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

            <div className="mt-3.5">
              <span className="inline-block text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                Oxirgi: {writingScore}
              </span>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <p className="text-[10px] text-slate-400/80 text-center pt-2">
          AI baholari taxminiy, rasmiy IELTS natijasi emas.
        </p>
      </div>
    </div>
  );
};
