import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Award, Users } from 'lucide-react';
import { MultilevelSpeakingView } from './MultilevelSpeakingView';
import { MultilevelWritingView } from './MultilevelWritingView';
import { PartnerSpeakingView } from './PartnerSpeakingView';
import { triggerHaptic } from '../../utils/telegram';
import {
  SpeakingWaveform,
  TilePulseRing,
  WritingAnimatedPencil,
} from './AnimatedSectionIcons';

interface Props {
  onBack: () => void;
  userName: string;
}

type ActiveView = 'menu' | 'speaking' | 'writing' | 'partner_speaking';

export const MultilevelDashboard: React.FC<Props> = ({ onBack, userName }) => {
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  const [showSpeakingModal, setShowSpeakingModal] = useState(false);

  if (activeView === 'speaking') {
    return <MultilevelSpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'writing') {
    return <MultilevelWritingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'partner_speaking') {
    return <PartnerSpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  // ── MAIN DASHBOARD MENU ──
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
        {/* Banner Card */}
        <div
          className="rounded-[2.2rem] p-5.5 text-white relative overflow-hidden shadow-xl border border-emerald-500/20"
          style={{ background: 'linear-gradient(135deg, #09211c 0%, #0e3b32 60%, #155e51 100%)' }}
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#c4f82a]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#c4f82a]">
              <Award size={12} />
              <span>CEFR B1 · B2 · C1 Standarti</span>
            </span>
            <h3 className="text-xl font-black">
              Multilevel Speaking & Writing 🎯
            </h3>
            <p className="text-xs text-teal-100/90 leading-relaxed">
              Xush kelibsiz, <strong>{userName}</strong>! Rasmiy DTM mezonlari, Speaking, xat va insho mavzulari tayyor.
            </p>
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
            className="p-5 rounded-[2rem] bg-[#181630] border border-white/10 hover:border-emerald-400/50 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99] space-y-3 text-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                {/* 52x52 Tile with Waveform & Pulse Ring */}
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

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                Part 1-3
              </span>
              <span className="text-[10px] font-black text-[#c4f82a] bg-[#c4f82a]/10 border border-[#c4f82a]/20 px-2.5 py-1 rounded-xl">
                Full Mock Sinov
              </span>
            </div>
          </div>

          {/* 2. Writing Sinovi */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('writing');
            }}
            className="p-5 rounded-[2rem] bg-[#181630] border border-white/10 hover:border-violet-400/50 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99] space-y-3 text-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                {/* 52x52 Tile with Pulse Ring & Drawing Pencil */}
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
                    19 ta rasmiy xat va 25 ta B2/C1 insho mavzulari
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white/10 text-slate-300 flex items-center justify-center group-hover:bg-[#7052ff] group-hover:text-white transition-all shrink-0">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Clean labels replacing cramped pills (3-rasm talabi) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/25 px-2.5 py-1 rounded-xl">
                Task 1: Xatlar (20 daqiqa)
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/25 px-2.5 py-1 rounded-xl">
                Task 2: Insho (40 daqiqa)
              </span>
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
