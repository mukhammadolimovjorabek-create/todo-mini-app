import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import {
  GRAMMAR_PLACEMENT_QUESTIONS,
  calculatePlacementResult,
  type PlacementResultSummary
} from '../data/grammarPlacementBank';
import { saveTestResult } from '../utils/storage';

interface GrammarPlacementViewProps {
  onBack: () => void;
}

export const GrammarPlacementView: React.FC<GrammarPlacementViewProps> = ({ onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<PlacementResultSummary | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');
  const startTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatClock = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const formatDateStr = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

  const currentQ = GRAMMAR_PLACEMENT_QUESTIONS[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const totalCount = GRAMMAR_PLACEMENT_QUESTIONS.length;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex
    }));
  };

  const handleSubmitTest = () => {
    let correct = 0;
    let g1 = 0, g2 = 0, g3 = 0, g4 = 0;

    GRAMMAR_PLACEMENT_QUESTIONS.forEach((q, i) => {
      if (answers[q.id] === q.correctIndex) {
        correct++;
        if (i < 12) g1++;
        else if (i < 25) g2++;
        else if (i < 38) g3++;
        else g4++;
      }
    });

    const summary = calculatePlacementResult(correct, totalCount);
    setResult(summary);
    setIsSubmitted(true);

    const now = new Date();
    saveTestResult({
      id: `placement_${Date.now()}`,
      date: formatDateStr(now),
      startTime: formatClock(startTimeRef.current),
      endTime: formatClock(now),
      testType: 'reading',
      title: `Darajani aniqlash (Full Grammar • CEFR ${summary.cefrLevel})`,
      topic: `CEFR ${summary.cefrLevel} (${summary.multilevelScore}/75 ball) • ${summary.correctCount}/${summary.totalQuestions} to'g'ri`,
      overallBand: summary.ieltsBand,
      criteriaScores: {
        c1Name: 'Tenses',
        c1Score: Number(((g1 / 12) * 9).toFixed(1)),
        c2Name: 'Modals/Cond',
        c2Score: Number(((g2 / 13) * 9).toFixed(1)),
        c3Name: 'Clauses',
        c3Score: Number(((g3 / 13) * 9).toFixed(1)),
        c4Name: 'C1 Grammar',
        c4Score: Number(((g4 / 12) * 9).toFixed(1)),
      },
      strengths: [
        `To'g'ri javoblar: ${summary.correctCount} / ${summary.totalQuestions} (${summary.percentage}%)`,
        `Multilevel CEFR darajasi: ${summary.cefrLevel} (${summary.multilevelScore} / 75 ball)`
      ],
      improvements: [
        summary.descriptionUz,
        summary.recommendationUz
      ]
    });
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsSubmitted(false);
    setResult(null);
    setElapsedSeconds(0);
    setFilterMode('all');
    startTimeRef.current = new Date();
  };

  if (isSubmitted && result) {
    const filteredQuestions = GRAMMAR_PLACEMENT_QUESTIONS.filter((q) => {
      const isCorrect = answers[q.id] === q.correctIndex;
      if (filterMode === 'wrong') return !isCorrect;
      if (filterMode === 'correct') return isCorrect;
      return true;
    });

    return (
      <div
        className="english-root english-dark min-h-screen flex flex-col text-white pb-24"
        style={{ backgroundColor: '#0e0d1d', minHeight: '100vh', color: '#ffffff' }}
      >
        <div
          className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 sticky top-0 z-20 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(14, 13, 29, 0.95)' }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </button>
          <span className="text-sm font-black uppercase tracking-wider">Darajani aniqlash natijasi</span>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 text-xs font-bold text-[#c4f82a] hover:opacity-80"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Qayta
          </button>
        </div>

        <div className="p-4 max-w-2xl mx-auto w-full space-y-5">
          {/* Hero Score Card */}
          <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-[#181630] to-purple-950/70 p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 text-[#c4f82a] text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" /> Full Grammar Placement Test (50 savol)
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3.5 text-center border border-white/10">
                <div className="text-[11px] text-slate-300 font-medium">Multilevel (CEFR)</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {result.cefrLevel}
                </div>
                <div className="text-[11px] text-emerald-300/90 font-semibold mt-0.5">
                  {result.multilevelScore} / 75 ball
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3.5 text-center border border-white/10">
                <div className="text-[11px] text-slate-300 font-medium">IELTS Darajasi</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                  {result.ieltsBand.toFixed(1)}
                </div>
                <div className="text-[11px] text-amber-300/90 font-semibold mt-0.5">
                  Band Score
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3.5 text-center border border-white/10">
                <div className="text-[11px] text-slate-300 font-medium">To'g'ri javob</div>
                <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-1">
                  {result.correctCount}/{result.totalQuestions}
                </div>
                <div className="text-[11px] text-sky-300/90 font-semibold mt-0.5">
                  {result.percentage}% aniqlik
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl bg-black/30 p-4 border border-white/10 text-xs sm:text-sm leading-relaxed">
              <p className="font-bold text-white">{result.descriptionUz}</p>
              <p className="text-slate-300">
                <span className="text-[#c4f82a] font-bold">Tavsiya: </span>
                {result.recommendationUz}
              </p>
            </div>
          </div>

          {/* Filter Tabs for Detailed Review */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <h4 className="text-sm font-black flex items-center gap-1.5 text-white">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Savollar tahlili ({filteredQuestions.length})
            </h4>
            <div className="flex rounded-xl bg-[#181630] border border-white/10 p-1 text-xs font-bold">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Barchasi (50)
              </button>
              <button
                onClick={() => setFilterMode('wrong')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterMode === 'wrong' ? 'bg-rose-600 text-white' : 'text-slate-400'
                }`}
              >
                Xatolar ({result.totalQuestions - result.correctCount})
              </button>
              <button
                onClick={() => setFilterMode('correct')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  filterMode === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                To'g'ri ({result.correctCount})
              </button>
            </div>
          </div>

          {/* Detailed Question Breakdown */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-rose-500/30 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-[#181630] border border-white/10 text-white">
                        {q.id}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                        {q.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                        {q.level}
                      </span>
                    </div>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> To'g'ri
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-400">
                        <XCircle className="w-4 h-4" /> Xato
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white mb-3">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    {q.options.map((opt, idx) => {
                      const isTargetCorrect = idx === q.correctIndex;
                      const isUserSelected = idx === userAns;
                      let style = 'border-white/10 bg-[#181630]/80 text-slate-300';
                      if (isTargetCorrect) {
                        style = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold';
                      } else if (isUserSelected && !isTargetCorrect) {
                        style = 'border-rose-500 bg-rose-500/20 text-rose-200 line-through';
                      }
                      return (
                        <div key={idx} className={`px-3 py-2 rounded-xl border ${style}`}>
                          {String.fromCharCode(65 + idx)}) {opt}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-xs text-slate-200 bg-[#181630] rounded-xl p-3 border border-white/10">
                    <span className="font-bold text-[#c4f82a]">Qoida izohi: </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="english-root english-dark min-h-screen flex flex-col text-white pb-24"
      style={{ backgroundColor: '#0e0d1d', minHeight: '100vh', color: '#ffffff' }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 sticky top-0 z-20 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(14, 13, 29, 0.95)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-white">
          Darajani aniqlash (50 savol)
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {answeredCount}/{totalCount}
          </span>
          <span className="flex items-center gap-1 text-xs font-mono text-slate-300 bg-[#181630] px-2.5 py-1 rounded-full border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full space-y-5">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300 font-semibold">
            <span>Savol {currentIdx + 1} / {totalCount}</span>
            <span className="text-[#c4f82a] font-bold">{currentQ.category} • {currentQ.level}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#181630] border border-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-[#c4f82a] transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-3xl border border-white/10 bg-[#181630] p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
              {currentQ.category}
            </span>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> CEFR: {currentQ.level}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold leading-relaxed text-white">
            {currentQ.id}. {currentQ.question}
          </h3>

          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#c4f82a] bg-[#c4f82a]/15 text-white shadow-md'
                      : 'border-white/10 bg-white/5 hover:border-indigo-400/50 text-slate-200'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#c4f82a] text-[#0e0d1d]'
                        : 'bg-[#0e0d1d] border border-white/10 text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm sm:text-base font-medium">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prev / Next / Submit Controls */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-white/10 bg-[#181630] text-white text-sm font-bold disabled:opacity-40 hover:border-indigo-500/40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Oldingi
          </button>

          {currentIdx < totalCount - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(totalCount - 1, prev + 1))}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-600/25 transition-all"
            >
              Keyingi savol <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#c4f82a] hover:brightness-110 text-[#0e0d1d] text-sm font-black shadow-lg transition-all"
            >
              <Award className="w-4 h-4" /> Testni yakunlash ({answeredCount}/{totalCount})
            </button>
          )}
        </div>

        {/* Finish Early / Navigator Grid */}
        <div className="rounded-3xl border border-white/10 bg-[#181630] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Savollar xaritasi (1–50)</span>
            {answeredCount > 0 && (
              <button
                onClick={handleSubmitTest}
                className="text-xs font-black text-[#c4f82a] hover:underline"
              >
                Hozir yakunlash va darajani ko'rish →
              </button>
            )}
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {GRAMMAR_PLACEMENT_QUESTIONS.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all border ${
                    isCurrent
                      ? 'border-[#c4f82a] bg-indigo-600 text-white scale-105'
                      : isAnswered
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-[#0e0d1d] text-slate-400 hover:border-indigo-500/40'
                  }`}
                >
                  {q.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
