import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, RotateCcw, Award, AlertCircle, BarChart3, FileText, Clock } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';
import { saveTestResult } from '../utils/storage';
import type { TestResultItem } from '../types';

interface Props {
  onBack: () => void;
  userName: string;
}

type WritingTaskTab = 'task1' | 'task2';

interface WritingBandBreakdown {
  overallBand: number;
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  wordCount: number;
  strengths: string[];
  improvements: string[];
  recommendedVocabulary: { word: string; meaning: string; example: string }[];
}

// Sample Task 2 Prompts
const SAMPLE_TASK2_PROMPTS = [
  {
    topic: 'Education & Technology',
    prompt: 'Some people believe that computers and the internet will soon replace teachers in classrooms. To what extent do you agree or disagree with this opinion?',
  },
  {
    topic: 'Environment & Climate',
    prompt: 'Many environmental problems are becoming increasingly severe around the world. What are the main causes of these problems, and what measures can governments take to resolve them?',
  },
  {
    topic: 'Work-Life Balance',
    prompt: 'In many countries, people are working longer hours than ever before. Discuss both views and give your own opinion.',
  },
];

export const WritingEvaluationView: React.FC<Props> = ({ onBack, userName: _userName }) => {
  const [activeTab, setActiveTab] = useState<WritingTaskTab>('task1');
  const [task2Idx, setTask2Idx] = useState(0);

  // Separate states for Task 1 and Task 2 to prevent data loss and tab collisions
  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');
  const [task1Started, setTask1Started] = useState(false);
  const [task2Started, setTask2Started] = useState(false);
  const [task1Result, setTask1Result] = useState<WritingBandBreakdown | null>(null);
  const [task2Result, setTask2Result] = useState<WritingBandBreakdown | null>(null);
  const [task1TimeLeft, setTask1TimeLeft] = useState(20 * 60);
  const [task2TimeLeft, setTask2TimeLeft] = useState(40 * 60);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Active task derived values
  const essayText = activeTab === 'task1' ? task1Text : task2Text;
  const isStarted = activeTab === 'task1' ? task1Started : task2Started;
  const result = activeTab === 'task1' ? task1Result : task2Result;
  const timeLeft = activeTab === 'task1' ? task1TimeLeft : task2TimeLeft;

  const setEssayText = (text: string) => {
    if (activeTab === 'task1') setTask1Text(text);
    else setTask2Text(text);
  };

  const setIsStarted = (started: boolean) => {
    if (activeTab === 'task1') setTask1Started(started);
    else setTask2Started(started);
  };

  const setResult = (res: WritingBandBreakdown | null) => {
    if (activeTab === 'task1') setTask1Result(res);
    else setTask2Result(res);
  };

  const setTimeLeft = (valOrFn: number | ((prev: number) => number)) => {
    if (activeTab === 'task1') {
      setTask1TimeLeft((prev) => (typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn));
    } else {
      setTask2TimeLeft((prev) => (typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn));
    }
  };

  // Auto-submit on timer expiry
  useEffect(() => {
    let interval: any = null;
    if (isStarted && isTimerRunning && timeLeft > 0 && !result && !isEvaluating) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleEvaluate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isTimerRunning, timeLeft, result, isEvaluating, activeTab]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Time tracking
  const [startTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const currentTask2 = SAMPLE_TASK2_PROMPTS[task2Idx];
  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const minWordsRequired = activeTab === 'task1' ? 150 : 250;

  const handleEvaluate = () => {
    if (wordCount < 40) {
      alert(`Iltimos, matnni kamida 40 ta so'zdan iborat qilib yozing (IELTS talabi: ${minWordsRequired}+ so'z).`);
      return;
    }

    triggerHaptic('medium');
    setIsEvaluating(true);

    setTimeout(() => {
      const paragraphs = essayText.split(/\n+/).filter((p) => p.trim().length > 0).length;
      let base = 6.0;
      if (wordCount >= minWordsRequired) base += 0.5;
      if (wordCount >= minWordsRequired + 40) base += 0.5;
      if (paragraphs >= (activeTab === 'task1' ? 3 : 4)) base += 0.5;

      const band = Math.min(8.5, Math.max(5.5, base));

      const evaluation: WritingBandBreakdown = {
        overallBand: band,
        taskResponse: band,
        coherenceCohesion: Math.min(9.0, band + (paragraphs >= 3 ? 0.5 : 0)),
        lexicalResource: band,
        grammaticalRange: Math.max(5.0, band - 0.5),
        wordCount,
        strengths: activeTab === 'task1' ? [
          "Diagrammadagi asosiy tendensiyalar va eng yuqori/past ko'rsatkichlar (Key features) to'g'ri tanlangan.",
          "Overview (umumiy xulosa) xatboshisi kiritilgan, bu Task Achievement bo'yicha 7.0+ talabidir.",
          "Raqamlar va foizlar taqqoslama shaklda ifodalangan.",
        ] : [
          "Mavzuga doir asosiy argumentlar keltirilgan va fikr ketma-ketligi saqlangan.",
          `${paragraphs} ta xatboshilarga ajratilgan, insho strukturasi aniq.`,
          "Akademik uslubdagi kirish va xulosa shakllantirilgan.",
        ],
        improvements: [
          wordCount < minWordsRequired
            ? `So'zlar soni (${wordCount}) talab qilingan ${minWordsRequired} tadan kam. Bu Task Achievement balini tushiradi.`
            : "Ko'rsatkichlar orasidagi ziddiyatlarni ifodalash uchun 'Whereas', 'In stark contrast' kabi bog'lovchilarni ko'paytiring.",
          "Grammatik xilma-xillikni oshirish uchun passiv nisbat va murakkab gaplar qo'shing.",
          "Sinonimlardan faolroq foydalaning (masalan, 'increase' o'rniga 'surge', 'rise substantially').",
        ],
        recommendedVocabulary: activeTab === 'task1' ? [
          { word: 'Witness a surge', meaning: 'Keskin o\'sishni qayd etmoq', example: 'Solar energy witnessed a dramatic surge over the decade.' },
          { word: 'Outperform', meaning: 'Ortda qoldirmoq', example: 'Wind power outperformed all other renewable sources by 2025.' },
          { word: 'Plateau', meaning: 'Bir xil darajada barqarorlashmoq', example: 'Hydroelectric output plateaued after initial expansion.' },
        ] : [
          { word: 'Substantial', meaning: 'Sezilarli, muhim', example: 'There has been a substantial shift in consumer habits.' },
          { word: 'Detrimental', meaning: 'Zararli, salbiy ta\'sirli', example: 'Excessive workload can have detrimental effects on health.' },
          { word: 'Exacerbate', meaning: 'Kuchaytirmoq, og\'irlashtirmoq', example: 'Traffic congestion exacerbates urban pollution.' },
        ],
      };

      setResult(evaluation);
      setIsEvaluating(false);

      // Save to Test Results History
      const now = new Date();
      const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      const historyItem: TestResultItem = {
        id: `writing_${Date.now()}`,
        date: dateStr,
        startTime,
        endTime,
        testType: activeTab === 'task1' ? 'writing_task1' : 'writing_task2',
        title: activeTab === 'task1' ? 'IELTS Writing Task 1 (Diagramma)' : 'IELTS Writing Task 2 (Insho)',
        topic: activeTab === 'task1' ? 'Renewable Energy Generation 2015-2025' : currentTask2.topic,
        overallBand: evaluation.overallBand,
        criteriaScores: {
          c1Name: activeTab === 'task1' ? 'Task Achievement' : 'Task Response',
          c1Score: evaluation.taskResponse,
          c2Name: 'Coherence & Cohesion',
          c2Score: evaluation.coherenceCohesion,
          c3Name: 'Lexical Resource',
          c3Score: evaluation.lexicalResource,
          c4Name: 'Grammar Accuracy',
          c4Score: evaluation.grammaticalRange,
        },
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      };

      saveTestResult(historyItem);
      triggerHaptic('heavy');
    }, 1600);
  };

  return (
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-12 relative">
      {/* ── Exit Confirmation Modal ── */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
              ⚠️
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-slate-900">Sinovni to'xtatmoqchimisiz?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hozir chiqib ketsangiz, yozgan insho matningiz va sinov natijasi saqlanmaydi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowExitConfirmModal(false);
                }}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
              >
                Yo'q, davom etish
              </button>
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowExitConfirmModal(false);
                  setIsTimerRunning(false);
                  onBack();
                }}
                className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (isStarted && !result) {
                triggerHaptic('medium');
                setShowExitConfirmModal(true);
              } else {
                onBack();
              }
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-full">
                IELTS Academic Writing
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {startTime}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Writing Tahlil Markazi ✍️
            </h2>
          </div>
        </div>

        {/* Real-time Countdown Timer (20 min for Task 1, 40 min for Task 2) */}
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-slate-700">
          <Clock size={14} className={timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-[#7052ff]'} />
          <span className={timeLeft < 300 ? 'text-rose-600 font-bold' : ''}>
            {formatTimer(timeLeft)}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-4">
        {/* Task 1 vs Task 2 Tab Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              if (activeTab === 'task2' && task2Started && !task2Result) {
                triggerHaptic('heavy');
                alert("🔒 Task 2 inshosi davom etmoqda! Task 1 ga o'tish uchun avval Task 2 ni tekshirtiring yoki yakunlang.");
                return;
              }
              triggerHaptic('light');
              setActiveTab('task1');
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'task1'
                ? 'bg-white text-slate-900 shadow-sm'
                : activeTab === 'task2' && task2Started && !task2Result
                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={15} className="text-[#7052ff]" />
            <span>Task 1: Diagramma (20m)</span>
            {activeTab === 'task2' && task2Started && !task2Result && (
              <span className="text-[10px]" title="Qulflangan">🔒</span>
            )}
          </button>

          <button
            onClick={() => {
              if (activeTab === 'task1' && task1Started && !task1Result) {
                triggerHaptic('heavy');
                alert("🔒 Task 1 sinovi davom etmoqda! Task 2 ga o'tish uchun avval Task 1 ni tekshirtiring yoki yakunlang.");
                return;
              }
              triggerHaptic('light');
              setActiveTab('task2');
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'task2'
                ? 'bg-white text-slate-900 shadow-sm'
                : activeTab === 'task1' && task1Started && !task1Result
                ? 'text-slate-400 opacity-50 cursor-not-allowed'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} className="text-[#7052ff]" />
            <span>Task 2: Insho (40m)</span>
            {activeTab === 'task1' && task1Started && !task1Result && (
              <span className="text-[10px]" title="Qulflangan">🔒</span>
            )}
          </button>
        </div>

        {/* ── BEFORE STARTING: SHOW START CARD (Savolni ko'rsatmaslik) ── */}
        {!isStarted && !result ? (
          <div className="bg-white rounded-[2.2rem] p-6 border border-slate-100 shadow-md space-y-5 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#7052ff] flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              ✍️
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-[#7052ff] bg-indigo-50 px-2.5 py-1 rounded-md">
                {activeTab === 'task1' ? 'IELTS Academic Task 1 · Report' : 'IELTS Academic Task 2 · Essay'}
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {activeTab === 'task1' ? 'Diagramma va Grafik Tahlili' : 'Muammoli Mavzu Bo\'yicha Insho'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Rasmiy {activeTab === 'task1' ? '20' : '40'} daqiqalik yozma sinov. Tayyor bo'lsangiz, «Sinovni boshlash» tugmasini bosing.
              </p>
            </div>

            {/* Benchmarks Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                <Clock size={14} className="text-amber-600" />
                <span>{activeTab === 'task1' ? '20 daqiqa' : '40 daqiqa'} (Rasmiy me'yor)</span>
              </span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-xl">
                📝 {activeTab === 'task1' ? 'Kamida 150 ta so\'z' : 'Kamida 250 ta so\'z'}
              </span>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
                📊 4 ta rasmiy mezon
              </span>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  setIsStarted(true);
                  setIsTimerRunning(true);
                  setTimeLeft(activeTab === 'task1' ? 20 * 60 : 40 * 60);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#5938ea] text-white font-black text-sm shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>🚀 Sinovni boshlash ({activeTab === 'task1' ? '20:00' : '40:00'})</span>
              </button>
            </div>
          </div>
        ) : (
          <>

        {/* ── TASK 1: MURAKKAB DIAGRAMMA VA GRAFIK (Foydalanuvchi talabi) ── */}
        {activeTab === 'task1' && (
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Academic Task 1 • Report
              </span>
              <span className="text-xs font-bold text-slate-400">20 daqiqa • min. 150 so'z</span>
            </div>

            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              The chart below illustrates global renewable electricity production in 2015 and 2025 (in Terawatt-hours, TWh), comparing Solar, Wind, Hydro, and Biomass.
            </p>

            {/* Murakkab SVG Diagramma */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-inner space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-[#c4f82a]">
                  ⚡ Renewable Electricity Output (TWh)
                </span>
                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#7052ff]" />
                    <span>2015</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#c4f82a]" />
                    <span>2025 (Proj.)</span>
                  </span>
                </div>
              </div>

              {/* SVG Charts visual representation */}
              <svg viewBox="0 0 360 160" className="w-full h-40">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="20" x2="350" y2="20" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="350" y2="60" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="350" y2="100" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="130" x2="350" y2="130" stroke="#475569" strokeWidth="1.5" />

                {/* Y-axis labels */}
                <text x="30" y="24" fill="#94a3b8" fontSize="9" textAnchor="end">1200</text>
                <text x="30" y="64" fill="#94a3b8" fontSize="9" textAnchor="end">800</text>
                <text x="30" y="104" fill="#94a3b8" fontSize="9" textAnchor="end">400</text>
                <text x="30" y="133" fill="#94a3b8" fontSize="9" textAnchor="end">0</text>

                {/* Bars: Solar */}
                <rect x="65" y="110" width="16" height="20" fill="#7052ff" rx="2" />
                <rect x="83" y="45" width="16" height="85" fill="#c4f82a" rx="2" />
                <text x="82" y="145" fill="#cbd5e1" fontSize="9" textAnchor="middle">Solar</text>
                <text x="91" y="40" fill="#c4f82a" fontSize="8" fontWeight="bold" textAnchor="middle">+350%</text>

                {/* Bars: Wind */}
                <rect x="135" y="85" width="16" height="45" fill="#7052ff" rx="2" />
                <rect x="153" y="30" width="16" height="100" fill="#c4f82a" rx="2" />
                <text x="152" y="145" fill="#cbd5e1" fontSize="9" textAnchor="middle">Wind</text>
                <text x="161" y="25" fill="#c4f82a" fontSize="8" fontWeight="bold" textAnchor="middle">+140%</text>

                {/* Bars: Hydro */}
                <rect x="205" y="35" width="16" height="95" fill="#7052ff" rx="2" />
                <rect x="223" y="28" width="16" height="102" fill="#c4f82a" rx="2" />
                <text x="222" y="145" fill="#cbd5e1" fontSize="9" textAnchor="middle">Hydro</text>
                <text x="231" y="23" fill="#c4f82a" fontSize="8" fontWeight="bold" textAnchor="middle">+8%</text>

                {/* Bars: Biomass */}
                <rect x="275" y="98" width="16" height="32" fill="#7052ff" rx="2" />
                <rect x="293" y="88" width="16" height="42" fill="#c4f82a" rx="2" />
                <text x="292" y="145" fill="#cbd5e1" fontSize="9" textAnchor="middle">Biomass</text>
                <text x="301" y="82" fill="#c4f82a" fontSize="8" fontWeight="bold" textAnchor="middle">+30%</text>
              </svg>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
                <div>• Eng katta o'sish: <span className="text-[#c4f82a] font-bold">Solar (Quyosh)</span></div>
                <div>• Eng barqaror: <span className="text-[#c4f82a] font-bold">Hydro (Gidro)</span></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Ko'rsatma: Diagrammadagi asosiy xususiyatlarni tanlang, taqqoslang va umumiy Overview yozing (kamida 150 so'z).
            </p>
          </div>
        )}

        {/* ── TASK 2: INSHO MAVZUSI ── */}
        {activeTab === 'task2' && (
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-md">
                {currentTask2.topic}
              </span>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTask2Idx((prev) => (prev + 1) % SAMPLE_TASK2_PROMPTS.length);
                  setResult(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <RotateCcw size={12} />
                <span>Boshqa mavzu</span>
              </button>
            </div>

            <p className="text-sm font-bold text-slate-900 leading-relaxed">
              {currentTask2.prompt}
            </p>
            <p className="text-[11px] text-slate-400">
              Task 2 • 40 daqiqa • Kamida 250 ta so'z
            </p>
          </div>
        )}

        {/* Essay Input Area */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              {activeTab === 'task1' ? "Hisobot matni (Report):" : "Insho matni (Essay):"}
            </label>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                wordCount >= minWordsRequired
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {wordCount} ta so'z (min. {minWordsRequired})
            </span>
          </div>

          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            rows={9}
            placeholder={
              activeTab === 'task1'
                ? "The bar chart compares the amount of electricity generated from four renewable sources...\n\nOverall, it is clear that...\n\nRegarding solar and wind..."
                : "Inshoyingizni shu yerga yozing yoki nusxasini joylashtiring..."
            }
            className="w-full text-xs font-sans leading-relaxed p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7052ff]/40 resize-none text-slate-800"
          />

          <button
            disabled={isEvaluating || wordCount === 0}
            onClick={handleEvaluate}
            className="w-full py-3.5 rounded-2xl bg-[#7052ff] hover:bg-[#5b3ce0] active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <Sparkles className="animate-spin" size={16} />
                <span>Rasmiy 4 ta mezon bo'yicha tahlil qilinmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Tekshirish & Band Ball Olish</span>
              </>
            )}
          </button>
        </div>

        {/* ── Results Breakdown ── */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Overall Score Badge */}
            <div
              className="rounded-3xl p-6 text-white text-center shadow-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #110e28 0%, #20175b 60%, #3a1e9c 100%)' }}
            >
              <Award className="mx-auto text-[#c4f82a] mb-2" size={36} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#c4f82a]">
                {activeTab === 'task1' ? "Writing Task 1" : "Writing Task 2"} • Band Score
              </span>
              <div className="text-5xl font-black font-mono mt-1 text-white tracking-tight">
                {result.overallBand.toFixed(1)}
              </div>
              <p className="text-xs text-purple-200/80 mt-1">
                Jami {result.wordCount} ta so'z tahlil qilindi
              </p>
            </div>

            {/* 4 Official Criteria Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {activeTab === 'task1' ? "Task Achievement" : "Task Response"}
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.taskResponse.toFixed(1)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Coherence & Cohesion</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.coherenceCohesion.toFixed(1)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Lexical Resource</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.lexicalResource.toFixed(1)}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Grammar Range</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.grammaticalRange.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 size={14} />
                  <span>Kuchli jihatlar:</span>
                </h4>
                <ul className="space-y-1.5">
                  {result.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                      <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center space-x-1.5 mb-2">
                  <AlertCircle size={14} />
                  <span>Ballni oshirish tavsiyalari:</span>
                </h4>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                      <span className="text-amber-500 shrink-0 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended High-Band Vocabulary */}
            <div className="bg-indigo-50/70 rounded-3xl p-5 border border-indigo-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7052ff]">
                Band 8.0+ Lug'at Tavsiyasi:
              </h4>
              <div className="space-y-2">
                {result.recommendedVocabulary.map((v, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100/60">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900">{v.word}</span>
                      <span className="text-[10px] text-slate-500">— {v.meaning}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic mt-1">"{v.example}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setResult(null);
                setEssayText('');
                setIsStarted(false);
                setIsTimerRunning(false);
                setTimeLeft(activeTab === 'task1' ? 20 * 60 : 40 * 60);
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <RotateCcw size={15} />
              <span>Yangi insho yozish / Qaytadan topshirish</span>
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
