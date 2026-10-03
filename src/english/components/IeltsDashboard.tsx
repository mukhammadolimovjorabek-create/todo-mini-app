import React, { useState } from 'react';
import { ArrowLeft, Mic, Users, BookOpen, ChevronRight, Award, FileText } from 'lucide-react';
import { AISpeakingView } from './AISpeakingView';
import { PartnerSpeakingView } from './PartnerSpeakingView';
import { WritingEvaluationView } from './WritingEvaluationView';
import { IeltsReadingView } from './IeltsReadingView';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  userName: string;
  userGender?: 'male' | 'female';
  initialView?: ActiveView;
}

type ActiveView = 'menu' | 'reading' | 'writing' | 'speaking' | 'ai_speaking' | 'partner_speaking';

export const IeltsDashboard: React.FC<Props> = ({ onBack, userName, userGender, initialView = 'menu' }) => {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

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
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-12">
      {/* ── Top Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-20">
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
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-full">
                IELTS
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              IELTS Amaliyot Markazi 🇬🇧
            </h2>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-5">
        {/* Banner Card */}
        <div
          className="rounded-[2.2rem] p-6 text-white relative overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 50%, #351e8c 100%)' }}
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#c4f82a]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#c4f82a]">
              <Award size={12} />
              <span>Band 9.0 Tayyorgarlik</span>
            </span>
            <h3 className="text-xl font-black">
              IELTS Reading, Writing & Speaking 🎯
            </h3>
            <p className="text-xs text-purple-200/85 leading-relaxed">
              Xush kelibsiz, <strong>{userName}</strong>! IELTS imtihonining barcha asosiy bo'limlari bo'yicha mashq qiling.
            </p>
          </div>
        </div>

        {/* 3 Main Sections: Reading, Writing, Speaking */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Bo'limni tanlang:
          </h4>

          {/* 1. READING */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('reading');
            }}
            className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:border-[#7052ff]/40 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-[#7052ff] transition-colors">
                      Reading
                    </h4>
                    <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Akademik
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Matnlar, True/False/Not Given, Multiple Choice va vaqt nazorati
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#7052ff] group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                True / False / Not Given
              </span>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                Multiple Choice
              </span>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-100">
                20 daqiqa taymer
              </span>
            </div>
          </div>

          {/* 2. WRITING */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('writing');
            }}
            className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:border-[#7052ff]/40 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#7052ff] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-[#7052ff] transition-colors">
                      Writing
                    </h4>
                    <span className="text-[9px] font-black bg-indigo-100 text-[#7052ff] px-2 py-0.5 rounded-full">
                      Task 1 & 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Diagramma tahlili va insho yozish, 4 ta rasmiy mezon bo'yicha tahlil
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#7052ff] group-hover:text-white transition-all">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold bg-indigo-50 text-[#7052ff] px-2.5 py-0.5 rounded-lg border border-indigo-100">
                Task 1: Diagramma
              </span>
              <span className="text-[10px] font-bold bg-indigo-50 text-[#7052ff] px-2.5 py-0.5 rounded-lg border border-indigo-100">
                Task 2: Insho
              </span>
              <span className="text-[10px] font-bold bg-indigo-50 text-[#7052ff] px-2.5 py-0.5 rounded-lg border border-indigo-100">
                TR / CC / LR / GRA
              </span>
            </div>
          </div>

          {/* 3. SPEAKING */}
          <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Mic size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900">
                      Speaking
                    </h4>
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Jonli nutq
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    AI Examiner Dr. Vance (9.0) yoki jonli sherik bilan mashq qiling
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setActiveView('ai_speaking');
                }}
                className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 text-left transition-all active:scale-95 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-amber-800">AI Examiner</span>
                  <Mic size={14} className="text-amber-600" />
                </div>
                <p className="text-xs font-black text-slate-900">Dr. Vance (9.0)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Part 1, 2, 3 va Full Mock</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setActiveView('partner_speaking');
                }}
                className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all active:scale-95 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-emerald-800">Sherik bilan</span>
                  <Users size={14} className="text-emerald-600" />
                </div>
                <p className="text-xs font-black text-slate-900">Jonli Muloqot</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Radar search orqali topish</p>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
