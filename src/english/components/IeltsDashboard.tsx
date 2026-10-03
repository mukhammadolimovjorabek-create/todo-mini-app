import React, { useState } from 'react';
import { ArrowLeft, Mic, Users, BookOpen, ChevronRight, Award, ShieldCheck } from 'lucide-react';
import { AISpeakingView } from './AISpeakingView';
import { PartnerSpeakingView } from './PartnerSpeakingView';
import { WritingEvaluationView } from './WritingEvaluationView';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  userName: string;
  userGender?: 'male' | 'female';
  initialView?: ActiveView;
}

type ActiveView = 'menu' | 'ai_speaking' | 'partner_speaking' | 'writing';

export const IeltsDashboard: React.FC<Props> = ({ onBack, userName, userGender, initialView = 'menu' }) => {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

  if (activeView === 'ai_speaking') {
    return <AISpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'partner_speaking') {
    return <PartnerSpeakingView onBack={() => setActiveView('menu')} userName={userName} userGender={userGender} />;
  }

  if (activeView === 'writing') {
    return <WritingEvaluationView onBack={() => setActiveView('menu')} userName={userName} />;
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
                IELTS Academic & General
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
              IELTS Speaking & Writing 🎯
            </h3>
            <p className="text-xs text-purple-200/85 leading-relaxed">
              2026-yil sentabr-dekabr rasmiy mavzulari asosida AI Examiner Dr. Alistair Vance yoki jonli sherik bilan mashq qiling.
            </p>
          </div>
        </div>

        {/* Section Cards */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Mashq qilish formatini tanlang:
          </h4>

          {/* 1. AI Speaking */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('ai_speaking');
            }}
            className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-[#7052ff]/40 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.98] group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
                  <Mic size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900">AI Speaking Examiner</h4>
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Dr. Vance (9.0)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    10 marta 9.0 olgan rasmiy Cambridge eksperti. Part 1, 2 yoki 3 bo'limlarini tanlab, to'liq imtihon muhitida gapiring.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-[#7052ff] shrink-0 mt-2 transition-colors" />
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center space-x-2 text-[10px] font-bold text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Part 1 Q&A</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Part 2 Cue Card + Timer</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Part 3 Discussion</span>
            </div>
          </div>

          {/* 2. Partner Speaking (Search) */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('partner_speaking');
            }}
            className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-emerald-500/40 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.98] group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
                  <Users size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900">Sherik bilan Speaking (Search)</h4>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Jonli Muloqot
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Jins bo'yicha filter bilan sherik qidiring. Bog'langach, Part 1, 2, 3 bo'limlari ochiladi va savollar bankidan navbat bilan gapirasiz.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 shrink-0 mt-2 transition-colors" />
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center space-x-2 text-[10px] font-bold text-slate-500">
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">Radar Search</span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">Savollar banki</span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">Xavfsiz rozilik</span>
            </div>
          </div>

          {/* 3. Writing Task 2 */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('writing');
            }}
            className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-[#7052ff]/40 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-[0.98] group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#7052ff] flex items-center justify-center shrink-0 text-xl group-hover:scale-105 transition-transform">
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-slate-900">Writing (Task 2 Insho)</h4>
                    <span className="text-[9px] font-black bg-indigo-100 text-[#7052ff] px-2 py-0.5 rounded-full">
                      4 Band Mezon
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    250+ so'zli akademik insho yozing va TR, CC, LR, GRA mezonlari bo'yicha darhol xolis ball va tahrir tavsiyalarini oling.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-[#7052ff] shrink-0 mt-2 transition-colors" />
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center space-x-2 text-[10px] font-bold text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">TR / CC / LR / GRA</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">So'zlar sanagich</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Band 8+ Lug'at</span>
            </div>
          </div>
        </div>

        {/* Security & Responsibility Guarantee Footer */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center space-x-3 text-xs text-slate-500">
          <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            Foydalanuvchi ma'lumotlari va muloqot xavfsizligi qonuniy shartnomaga muvofiq kafolatlangan.
          </p>
        </div>
      </div>
    </div>
  );
};
