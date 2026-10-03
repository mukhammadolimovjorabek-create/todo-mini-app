import React, { useState } from 'react';
import { ArrowLeft, Mic, ChevronRight, Award, FileText } from 'lucide-react';
import { MultilevelSpeakingView } from './MultilevelSpeakingView';
import { MultilevelWritingView } from './MultilevelWritingView';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  userName: string;
}

type ActiveView = 'menu' | 'speaking' | 'writing';

export const MultilevelDashboard: React.FC<Props> = ({ onBack, userName }) => {
  const [activeView, setActiveView] = useState<ActiveView>('menu');

  if (activeView === 'speaking') {
    return <MultilevelSpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'writing') {
    return <MultilevelWritingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  // ── MAIN DASHBOARD MENU ──
  return (
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-12">
      {/* ── Top Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-teal-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                O'zbekiston Milliy Sertifikati
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Multilevel Amaliyot Markazi 🇺🇿
            </h2>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-5">
        {/* Banner Card */}
        <div
          className="rounded-[2.2rem] p-6 text-white relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #091f1a 0%, #0e3b32 60%, #155e51 100%)' }}
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
              Xush kelibsiz, <strong>{userName}</strong>! Rasmiy DTM mezonlari, 43 ta Part 1.1 savollari, 19 ta xat va 25 ta insho mavzulari tayyor.
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
              setActiveView('speaking');
            }}
            className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mic size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                      Multilevel Speaking Sinovi
                    </h4>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Jonli nutq
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Part 1.1 (30s), Part 1.2 (Rasmlar), Part 2 (Mavzu), Part 3 (Debat)
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-lg border border-teal-100">
                P1.1 (30s)
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-lg border border-teal-100">
                P1.2 (Rasmlar)
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-lg border border-teal-100">
                P2 (Taqdimot)
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-lg border border-teal-100">
                P3 (Debat)
              </span>
              <span className="text-[10px] font-black bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-lg border border-purple-100">
                Full Mock
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
            className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                      Multilevel Writing Sinovi
                    </h4>
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Task 1 & 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    19 ta rasmiy xat va 25 ta B2/C1 insho mavzulari
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-lg border border-amber-200">
                Task 1: Do'stga xat (~50w)
              </span>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-lg border border-amber-200">
                Task 1: Rasmiy xat (120-150w)
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-lg border border-teal-200">
                Task 2: Insho (180-200w)
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
