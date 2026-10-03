import React, { useState } from 'react';
import { ArrowLeft, Mic, BookOpen, ChevronRight, Award, Volume2, FileText } from 'lucide-react';
import { MultilevelSpeakingView } from './MultilevelSpeakingView';
import { MultilevelWritingView } from './MultilevelWritingView';
import { triggerHaptic } from '../../utils/telegram';
import {
  multilevelOfficial43Questions,
  type MultilevelOfficialQuestion,
} from '../data/multilevelBank';

interface Props {
  onBack: () => void;
  userName: string;
}

type ActiveView = 'menu' | 'speaking' | 'writing' | 'official_bank_43';

export const MultilevelDashboard: React.FC<Props> = ({ onBack, userName }) => {
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  const [selectedQuestion, setSelectedQuestion] = useState<MultilevelOfficialQuestion | null>(null);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  if (activeView === 'speaking') {
    return <MultilevelSpeakingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  if (activeView === 'writing') {
    return <MultilevelWritingView onBack={() => setActiveView('menu')} userName={userName} />;
  }

  // ── VIEW ALL 43 OFFICIAL QUESTIONS & MODEL ANSWERS ──
  if (activeView === 'official_bank_43') {
    return (
      <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-12">
        <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-teal-100 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                window.speechSynthesis?.cancel();
                setActiveView('menu');
              }}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
              title="Orqaga"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  PDF Savollar Bazasi
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                43 ta Rasmiy Savol & Namuna 📘
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-4">
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 leading-relaxed">
            💡 <strong>Multilevel Speaking Part 1.1:</strong> Bu savollar imtihonda 100% tushadigan asosiy savollar to'plami. Har bir savol ustiga bosing, talaffuzini eshiting va B2/C1 namuna javobini o'rganing!
          </div>

          <div className="space-y-3">
            {multilevelOfficial43Questions.map((item) => {
              const isSelected = selectedQuestion?.number === item.number;
              return (
                <div
                  key={item.number}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs ${
                    isSelected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-100 hover:border-teal-200'
                  }`}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedQuestion(isSelected ? null : item);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{item.number}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">
                          {item.question}
                        </h4>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          30 soniya javob vaqti
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        speakText(item.question);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors"
                      title="Savolni eshitish"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>

                  {/* Expanded Sample Answer */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-teal-700">
                          B2/C1 Namunaviy Javob:
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            speakText(item.sampleAnswer);
                          }}
                          className="flex items-center space-x-1 text-[11px] font-bold text-teal-700 hover:underline"
                        >
                          <Volume2 size={13} />
                          <span>Javobni eshitish</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 bg-teal-50/40 p-3 rounded-xl border border-teal-100 leading-relaxed font-sans">
                        "{item.sampleAnswer}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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

          {/* 3. 43 ta Rasmiy Savollar & Namunalar */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              triggerHaptic('medium');
              setActiveView('official_bank_43');
            }}
            className="p-5 rounded-[2rem] bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-200/80 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white text-teal-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                      43 ta Rasmiy Savollar & Namunalar 📘
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    PDF bazasidagi 43 ta Part 1.1 savollari va tayyor B2/C1 javoblari
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs">
                <ChevronRight size={16} />
              </div>
            </div>

            <p className="text-[11px] text-teal-800/80 bg-white/70 p-2.5 rounded-xl">
              ✨ Har bir savolni bittalab eshiting, namunalarini o'qing va imtihonga 100% tayyorlaning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
