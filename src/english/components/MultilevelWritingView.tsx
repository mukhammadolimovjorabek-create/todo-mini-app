import React, { useState } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';
import { saveTestResult } from '../utils/storage';
import type { TestResultItem } from '../types';
import {
  multilevelWritingBank,
  type MultilevelWritingTask1Exercise,
  type MultilevelWritingTask2Topic,
} from '../data/multilevelBank';

interface Props {
  onBack: () => void;
  userName: string;
}

type WritingTab = 'task1' | 'task2';

interface WritingBandBreakdown {
  totalScore: number;
  cefrLevel: string;
  cefrTitle: string;
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  wordCount: number;
  strengths: string[];
  improvements: string[];
  recommendedVocabulary: { word: string; meaning: string; example: string }[];
}

export const MultilevelWritingView: React.FC<Props> = ({ onBack, userName: _userName }) => {
  const [activeTab, setActiveTab] = useState<WritingTab>('task2');
  
  // Task 1 state
  const [task1Idx, setTask1Idx] = useState(0);
  const [subTask1Mode, setSubTask1Mode] = useState<'task1_1' | 'task1_2'>('task1_2');
  
  // Task 2 state
  const [task2Idx, setTask2Idx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Input & evaluation
  const [essayText, setEssayText] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<WritingBandBreakdown | null>(null);

  // Exam Start and Exit Confirmation
  const [isStarted, setIsStarted] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Official Multilevel Timers: Task 1 = 20 min (1200s), Task 2 = 40 min (2400s)
  const [timeLeft, setTimeLeft] = useState<number>(() => (activeTab === 'task1' ? 20 * 60 : 40 * 60));
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Time tracking
  const [startTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const task1List = multilevelWritingBank.task1_exercises || [];
  const currentTask1: MultilevelWritingTask1Exercise | undefined = task1List[task1Idx];

  const task2List = multilevelWritingBank.task2_topics || [];
  const filteredTask2 = selectedCategory === 'ALL'
    ? task2List
    : task2List.filter((t) => t.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  const currentTask2: MultilevelWritingTask2Topic | undefined = filteredTask2[task2Idx] || task2List[0];

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const minWordsRequired = activeTab === 'task1' ? (subTask1Mode === 'task1_1' ? 50 : 120) : 180;
  const targetWords = activeTab === 'task1' ? (subTask1Mode === 'task1_1' ? '50-60' : '120-150') : '180-200';

  // Format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  React.useEffect(() => {
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
  }, [isStarted, isTimerRunning, timeLeft, result, isEvaluating]);

  const handleEvaluate = () => {
    if (wordCount < 30) {
      triggerHaptic('heavy');
      alert(`Iltimos, baholash uchun kamida 30 ta so'z yozing. Hozirda: ${wordCount} ta so'z.`);
      return;
    }

    setIsEvaluating(true);
    triggerHaptic('heavy');

    setTimeout(() => {
      // ── OFFICIAL DTM 75-BALL MULTILEVEL WRITING SCORING ──
      const lengthRatio = Math.min(1.4, wordCount / minWordsRequired);

      const complexWords = [
        'furthermore', 'moreover', 'consequently', 'nevertheless', 'specifically',
        'significant', 'perspective', 'demonstrate', 'illustrate', 'substantially',
        'although', 'whereas', 'however', 'fundamentally', 'in conclusion', 'in addition'
      ];
      const foundComplex = complexWords.filter((w) => essayText.toLowerCase().includes(w));

      const sentences = essayText.split(/[.!?]+/).filter(Boolean);
      const avgLen = sentences.length > 0 ? wordCount / sentences.length : 0;

      // 1. Task Fulfillment / Achievement (max 20 ball)
      let taskScore = Math.round(lengthRatio * 13);
      if (wordCount >= minWordsRequired) taskScore += 4;
      else if (wordCount >= minWordsRequired * 0.8) taskScore += 2;
      if (sentences.length >= 4) taskScore += 3;
      taskScore = Math.min(20, Math.max(3, taskScore));

      // 2. Coherence & Cohesion (max 20 ball)
      let cohesionScore = Math.round(lengthRatio * 11);
      if (foundComplex.length >= 1) cohesionScore += 3;
      if (foundComplex.length >= 3) cohesionScore += 4;
      if (foundComplex.length >= 5) cohesionScore += 2;
      cohesionScore = Math.min(20, Math.max(3, cohesionScore));

      // 3. Lexical Resource (max 20 ball)
      const wordsArray = essayText.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);
      const uniqueWords = new Set(wordsArray);
      const ttr = wordsArray.length > 0 ? uniqueWords.size / wordsArray.length : 0;
      let lexicalScore = Math.round(lengthRatio * 10);
      if (ttr > 0.5) lexicalScore += 3;
      if (foundComplex.length >= 1) lexicalScore += 4;
      if (foundComplex.length >= 3) lexicalScore += 3;
      lexicalScore = Math.min(20, Math.max(3, lexicalScore));

      // 4. Grammatical Range & Accuracy (max 15 ball)
      let grammarScore = Math.round(lengthRatio * 8);
      if (avgLen >= 10 && avgLen <= 26) grammarScore += 4;
      else grammarScore += 1;
      if (sentences.length >= 3) grammarScore += 3;
      grammarScore = Math.min(15, Math.max(2, grammarScore));

      // Total 75-ball score
      const totalScore = Math.min(75, Math.max(0, taskScore + cohesionScore + lexicalScore + grammarScore));

      let cefr = 'A2 (Sertifikat berilmaydi)';
      let cefrTitle = `${totalScore} / 75 ball • A2 (Sertifikat berilmaydi)`;
      if (totalScore >= 65) {
        cefr = 'C1 (Oliy daraja)';
        cefrTitle = `${totalScore} / 75 ball • C1 (Oliy daraja)`;
      } else if (totalScore >= 50) {
        cefr = 'B2 (Yetakchi / Yuqori daraja)';
        cefrTitle = `${totalScore} / 75 ball • B2 (Yuqori daraja)`;
      } else if (totalScore >= 30) {
        cefr = 'B1 (O\'rta daraja)';
        cefrTitle = `${totalScore} / 75 ball • B1 (O'rta daraja)`;
      }

      const evaluation: WritingBandBreakdown = {
        totalScore,
        cefrLevel: cefr,
        cefrTitle,
        taskResponse: taskScore,
        coherenceCohesion: cohesionScore,
        lexicalResource: lexicalScore,
        grammaticalRange: grammarScore,
        wordCount,
        strengths: [
          wordCount >= minWordsRequired
            ? `Belgilangan hajm me'yori bajarildi (${wordCount} ta so'z).`
            : `Fikrlar ifodalangan, lekin hajm to'ldirilishi kerak (${wordCount}/${minWordsRequired}).`,
          foundComplex.length > 0
            ? `Bog'lovchi so'zlar qo'llanildi: ${foundComplex.slice(0, 3).join(', ')}.`
            : `Fikr ketma-ketligi shakllantirildi.`,
          `Mavzu talablariga mos yozish uslubi saqlangan.`,
        ],
        improvements: [
          wordCount < minWordsRequired
            ? `So'zlar sonini kamida ${minWordsRequired} taga yetkazing (hozir ${wordCount} ta).`
            : `B2/C1 darajasidagi akademik bog'lovchilar ('Consequently', 'On the contrary') miqdorini oshiring.`,
          `Xat yoki inshoda har bir fikr uchun alohida misol (example) keltiring.`,
          `Grammatik murakkablikni (Compound & Complex sentences) oshiring.`,
        ],
        recommendedVocabulary: [
          { word: 'Substantial', meaning: 'Sezilarli, salmoqli', example: 'This approach offers substantial advantages.' },
          { word: 'Consequently', meaning: 'Natijada, binobarin', example: 'Consequently, the public benefits directly.' },
          { word: 'Essential', meaning: 'Juda muhim, asosiy', example: 'Time management is an essential life skill.' },
        ],
      };

      setResult(evaluation);
      setIsEvaluating(false);

      // Save to Test Results History
      const now = new Date();
      const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      const title = activeTab === 'task1'
        ? `Milliy Multilevel: Writing Task 1 (${subTask1Mode === 'task1_1' ? 'Do\'stga xat' : 'Rasmiy xat'})`
        : `Milliy Multilevel: Writing Task 2 (Insho)`;

      const topicTitle = activeTab === 'task1'
        ? (currentTask1?.title || 'Letter Writing')
        : (currentTask2?.title || 'Essay Topic');

      const historyItem: TestResultItem = {
        id: `ml_writing_${Date.now()}`,
        date: dateStr,
        startTime,
        endTime,
        testType: activeTab === 'task1' ? 'writing_task1' : 'writing_task2',
        title,
        topic: topicTitle,
        overallBand: evaluation.totalScore,
        criteriaScores: {
          c1Name: 'Task Response',
          c1Score: evaluation.taskResponse,
          c2Name: 'Coherence',
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
    }, 1500);
  };

  const categories = ['ALL', 'EDUCATION', 'TECHNOLOGY', 'HEALTH & LIFESTYLE', 'ENVIRONMENT', 'SOCIETY & COMMUNITY', 'CRIME & SAFETY', 'BUSINESS & WORK', 'CULTURE & GLOBAL SOCIETY'];

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
                Hozir chiqib ketsangiz, yozgan matningiz va sinov natijasi saqlanmaydi.
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
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-teal-100 flex items-center justify-between sticky top-0 z-20">
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
              <span className="text-xs font-black uppercase tracking-wider text-teal-700">Milliy Multilevel</span>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">Writing B2-C1</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Writing Sinovi ✍️
            </h2>
          </div>
        </div>

        {/* Real-time Countdown Timer (20 min for Task 1, 40 min for Task 2) */}
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-slate-700">
          <Clock size={13} className={timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-teal-600'} />
          <span className={timeLeft < 300 ? 'text-rose-600 font-bold' : ''}>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="flex-1 p-5 space-y-4">
        
        {/* Task 1 vs Task 2 Tabs */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl">
          <button
            onClick={() => {
              if (isStarted && !result && essayText.trim().length > 20) {
                triggerHaptic('medium');
                setShowExitConfirmModal(true);
                return;
              }
              triggerHaptic('light');
              setActiveTab('task1');
              setEssayText('');
              setResult(null);
              setIsStarted(false);
              setIsTimerRunning(false);
              setTimeLeft(20 * 60);
              setShowModelAnswer(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'task1'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Task 1: Xatlar (20m)
          </button>
          <button
            onClick={() => {
              if (isStarted && !result && essayText.trim().length > 20) {
                triggerHaptic('medium');
                setShowExitConfirmModal(true);
                return;
              }
              triggerHaptic('light');
              setActiveTab('task2');
              setEssayText('');
              setResult(null);
              setIsStarted(false);
              setIsTimerRunning(false);
              setTimeLeft(40 * 60);
              setShowModelAnswer(false);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'task2'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Task 2: Insho (40m)
          </button>
        </div>

        {/* ── BEFORE STARTING: SHOW START CARD (Savolni ko'rsatmaslik) ── */}
        {!isStarted && !result ? (
          <div className="bg-white rounded-[2.2rem] p-6 border border-slate-100 shadow-md space-y-5 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
              ✍️
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                {activeTab === 'task1' ? 'Milliy Multilevel Task 1 · Xat yozish' : 'Milliy Multilevel Task 2 · Akademik Insho'}
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {activeTab === 'task1' ? "Do'stga yoki Rasmiy Xat Yozish" : "Muammoli Mavzu Bo'yicha B2/C1 Insho"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Rasmiy {activeTab === 'task1' ? '20' : '40'} daqiqalik sinov. Tayyor bo'lsangiz, «Sinovni boshlash» tugmasini bosing.
              </p>
            </div>

            {/* Benchmarks Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                <Clock size={14} className="text-amber-600" />
                <span>{activeTab === 'task1' ? '20 daqiqa' : '40 daqiqa'} (Rasmiy me'yor)</span>
              </span>
              <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-xl">
                📝 {activeTab === 'task1' ? "Task 1.1: ~50 so'z | Task 1.2: 120-150 so'z" : "Kamida 180-250 so'z"}
              </span>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
                📊 CEFR B1 - C1 Mezonlari
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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-sm shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>🚀 Sinovni boshlash ({activeTab === 'task1' ? '20:00' : '40:00'})</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── TASK 1 SECTION ── */}
            {activeTab === 'task1' && currentTask1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Task 1 Exercise Selector */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-500">
                Mashq {task1Idx + 1} / {task1List.length}
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setTask1Idx((prev) => (prev > 0 ? prev - 1 : task1List.length - 1));
                    setEssayText('');
                    setResult(null);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  ← Oldingi
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setTask1Idx((prev) => (prev < task1List.length - 1 ? prev + 1 : 0));
                    setEssayText('');
                    setResult(null);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700"
                >
                  Keyingi →
                </button>
              </div>
            </div>

            {/* Scenario Email Card */}
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md">
                  Vaziyat / Email
                </span>
                <h4 className="text-sm font-black text-slate-900">{currentTask1.title}</h4>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                {currentTask1.scenario}
              </div>

              {/* Sub-task switch: Task 1.1 (Friend ~50w) vs Task 1.2 (Coordinator 120-150w) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSubTask1Mode('task1_1');
                    setEssayText('');
                    setResult(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    subTask1Mode === 'task1_1'
                      ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-teal-700 block">Task 1.1: Do'stga xat</span>
                  <span className="text-xs font-bold text-slate-900">~50 so'z (10 daqiqa)</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSubTask1Mode('task1_2');
                    setEssayText('');
                    setResult(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    subTask1Mode === 'task1_2'
                      ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase text-teal-700 block">Task 1.2: Rasmiy xat</span>
                  <span className="text-xs font-bold text-slate-900">120-150 so'z (20 daqiqa)</span>
                </button>
              </div>

              {/* Prompt box */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed whitespace-pre-line">
                {subTask1Mode === 'task1_1' ? currentTask1.task1_1.prompt : currentTask1.task1_2.prompt}
              </div>
            </div>
          </div>
        )}

        {/* ── TASK 2 SECTION ── */}
        {activeTab === 'task2' && currentTask2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Category horizontal scrolling selector */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedCategory(cat);
                    setTask2Idx(0);
                    setEssayText('');
                    setResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Barchasi (25)' : cat}
                </button>
              ))}
            </div>

            {/* Task 2 Topic Card */}
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  {currentTask2.category} • #{currentTask2.number}
                </span>
                <span className="text-[10px] font-bold text-slate-400">180-200 so'z</span>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug">
                "{currentTask2.title}"
              </h3>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                {currentTask2.prompt}
              </div>

              {/* Model Answer button */}
              {currentTask2.modelResponse && (
                <div>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setShowModelAnswer(!showModelAnswer);
                    }}
                    className="flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
                  >
                    {showModelAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showModelAnswer ? "Namunani yashirish" : "Model javobni ko'rish (B2/C1)"}</span>
                  </button>

                  {showModelAnswer && (
                    <div className="mt-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-sans animate-in fade-in">
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-emerald-200/60">
                        <span className="text-[10px] font-black text-emerald-800 uppercase">B2/C1 Rasmiy Namuna:</span>
                        <span className="text-[10px] text-emerald-700 font-mono">180-200 so'z</span>
                      </div>
                      <p className="whitespace-pre-line text-slate-800">{currentTask2.modelResponse}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── WRITING TEXTAREA CONTAINER ── */}
        <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Sizning yozgan matningiz:
            </span>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className={`font-bold ${wordCount >= minWordsRequired ? 'text-emerald-600' : 'text-amber-600'}`}>
                {wordCount} ta so'z
              </span>
              <span className="text-slate-400">/ maqsad: {targetWords}</span>
            </div>
          </div>

          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Matningizni shu yerga yozing..."
            rows={8}
            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm leading-relaxed outline-none focus:border-teal-500 focus:bg-white transition-all resize-y"
          />

          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-sm shadow-md shadow-teal-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isEvaluating ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI tekshirmoqda va baholamoqda...</span>
              </span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Tekshirish va Baholash (CEFR Mezonida)</span>
              </>
            )}
          </button>
        </div>

        {/* ── EVALUATION RESULTS CARD: OFFICIAL 75-BALL DTM TIZIMI ── */}
        {result && (
          <div className="bg-white rounded-[2rem] p-5 border border-teal-200 shadow-lg space-y-4 animate-in fade-in duration-300">
            {/* Result Card: Official 75-Point Scale */}
            <div
              className="rounded-[2.2rem] p-6 text-white text-center shadow-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #091f1a 0%, #0e3b32 60%, #155e51 100%)' }}
            >
              <div className="inline-flex items-center space-x-1.5 bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>MILLIY SERTIFIKAT (75 BALLIK TIZIM)</span>
              </div>

              <div className="my-2">
                <span className="text-5xl font-black text-[#c4f82a] tracking-tight">
                  {result.totalScore}
                </span>
                <span className="text-xl font-bold text-teal-200"> / 75 ball</span>
              </div>

              <h3 className="text-lg font-black text-white mt-1">
                {result.cefrTitle}
              </h3>

              {/* 4 Criteria Out of 20, 20, 20, 15 */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white/5 p-2 rounded-xl">
                  <p className="text-sm font-black text-[#c4f82a]">{result.taskResponse} <span className="text-[9px] text-teal-300">/20</span></p>
                  <p className="text-[9px] text-teal-200 font-bold">Task Resp.</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <p className="text-sm font-black text-amber-300">{result.coherenceCohesion} <span className="text-[9px] text-teal-300">/20</span></p>
                  <p className="text-[9px] text-teal-200 font-bold">Coherence</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <p className="text-sm font-black text-emerald-300">{result.lexicalResource} <span className="text-[9px] text-teal-300">/20</span></p>
                  <p className="text-[9px] text-teal-200 font-bold">Lexical</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <p className="text-sm font-black text-pink-300">{result.grammaticalRange} <span className="text-[9px] text-teal-300">/15</span></p>
                  <p className="text-[9px] text-teal-200 font-bold">Grammar</p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-black text-emerald-800 flex items-center space-x-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Yutuqlar:</span>
              </h5>
              <div className="space-y-1 text-xs text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                {result.strengths.map((s, i) => (
                  <p key={i}>• {s}</p>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-black text-amber-800 flex items-center space-x-1.5">
                <AlertCircle size={13} className="text-amber-600" />
                <span>Tavsiyalar:</span>
              </h5>
              <div className="space-y-1 text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                {result.improvements.map((imp, i) => (
                  <p key={i}>• {imp}</p>
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
              <span>Yangi topshiriq / Qaytadan topshirish</span>
            </button>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
};
