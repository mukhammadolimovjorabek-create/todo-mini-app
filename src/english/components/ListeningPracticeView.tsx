import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Headphones,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { LISTENING_BANK, type ListeningQuestion } from '../data/listeningBank';
import { speakDialogue, stopSpeaking } from '../../utils/speechVoice';
import { saveTestResult } from '../utils/storage';
import { triggerHaptic } from '../../utils/telegram';
import { PostExamActions } from './PostExamActions';

interface Props {
  onBack: () => void;
  examType?: 'ielts' | 'multilevel';
}

export const ListeningPracticeView: React.FC<Props> = ({ onBack, examType = 'ielts' }) => {
  const isMultilevel = examType === 'multilevel';
  const tracks = LISTENING_BANK.filter((t) => t.examType === examType);

  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState<0.85 | 1 | 1.15>(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [submittedResultId, setSubmittedResultId] = useState('');

  const [startTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const currentTrack = tracks[trackIdx] || tracks[0];

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleTogglePlay = (startFromTurn = 0) => {
    triggerHaptic('light');
    if (isPlaying && startFromTurn === 0) {
      stopSpeaking();
      setIsPlaying(false);
      setActiveTurnIdx(-1);
      return;
    }

    setIsPlaying(true);
    speakDialogue(currentTrack.dialogue, {
      startIndex: startFromTurn,
      rate: playbackRate,
      onTurnChange: (idx) => setActiveTurnIdx(idx),
      onComplete: () => {
        setIsPlaying(false);
        setActiveTurnIdx(-1);
      },
    });
  };

  const checkCorrect = (q: ListeningQuestion, val?: string): boolean => {
    const clean = (val || '').trim().toLowerCase();
    if (!clean) return false;
    if (clean === q.correctAnswer.trim().toLowerCase()) return true;
    return (q.acceptableAnswers || []).some((a) => a.trim().toLowerCase() === clean);
  };

  const handleSubmit = () => {
    stopSpeaking();
    setIsPlaying(false);
    setActiveTurnIdx(-1);

    let correctCount = 0;
    currentTrack.questions.forEach((q) => {
      if (checkCorrect(q, answers[q.id])) correctCount += 1;
    });

    const ratio = correctCount / currentTrack.questions.length;
    const scaledBand = Math.round(Math.max(2.5, Math.min(9.0, 2.5 + ratio * 6.5)) * 2) / 2;
    const mlPoints = Math.round(ratio * 75);

    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    const resultId = isMultilevel ? `ml_listening_${Date.now()}` : `listening_${Date.now()}`;

    saveTestResult({
      id: resultId,
      date: dateStr,
      startTime,
      endTime,
      testType: 'listening',
      title: isMultilevel ? `Milliy Multilevel: Listening (${currentTrack.levelBadge})` : `IELTS Listening (${currentTrack.partLabel})`,
      topic: currentTrack.title,
      overallBand: isMultilevel ? mlPoints : scaledBand,
      criteriaScores: {
        c1Name: "To'g'ri javoblar",
        c1Score: correctCount,
        c2Name: 'Jami savollar',
        c2Score: currentTrack.questions.length,
        c3Name: 'Aniqlik (%)',
        c3Score: Math.round(ratio * 100),
        c4Name: isMultilevel ? 'Ball (75)' : 'IELTS Band',
        c4Score: isMultilevel ? mlPoints : scaledBand,
      },
      strengths: [`${correctCount}/${currentTrack.questions.length} ta savolga to'g'ri javob berdingiz.`],
      improvements: currentTrack.questions
        .filter((q) => !checkCorrect(q, answers[q.id]))
        .slice(0, 3)
        .map((q) => `Savol #${q.id}: ${q.explanation}`),
    });

    setSubmittedResultId(resultId);
    setIsSubmitted(true);
    setShowTranscript(true);
    triggerHaptic('heavy');
  };

  const resetTrack = (nextIdx: number) => {
    stopSpeaking();
    setIsPlaying(false);
    setActiveTurnIdx(-1);
    setTrackIdx(nextIdx);
    setAnswers({});
    setIsSubmitted(false);
    setShowTranscript(false);
    setSubmittedResultId('');
  };

  const totalQs = currentTrack.questions.length;
  const correctTotal = currentTrack.questions.filter((q) => checkCorrect(q, answers[q.id])).length;
  const ratio = totalQs > 0 ? correctTotal / totalQs : 0;
  const band = Math.round(Math.max(2.5, Math.min(9.0, 2.5 + ratio * 6.5)) * 2) / 2;
  const mlScore = Math.round(ratio * 75);

  const mistakesForBank = currentTrack.questions
    .filter((q) => !checkCorrect(q, answers[q.id]))
    .map((q) => ({
      source: 'listening' as const,
      skillTag: 'listening',
      title: currentTrack.title,
      userText: answers[q.id]?.trim() ? `Javobim: ${answers[q.id]}` : "Javob berilmadi",
      correction: `To'g'ri javob: ${q.correctAnswer}`,
      explanation: `${q.explanation} (${q.evidenceQuote})`,
    }));

  return (
    <div className="english-root min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3.5 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              stopSpeaking();
              onBack();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                isMultilevel ? 'bg-teal-50 text-teal-700' : 'bg-indigo-50 text-[#7052ff]'
              }`}
            >
              {isMultilevel ? 'Milliy Multilevel Listening' : 'IELTS Listening'}
            </span>
            <h2 className="text-sm font-black text-slate-900 leading-tight">{currentTrack.partLabel}</h2>
          </div>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          {([0.85, 1, 1.15] as const).map((r) => (
            <button
              key={r}
              onClick={() => setPlaybackRate(r)}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all ${
                playbackRate === r ? 'bg-white text-[#7052ff] shadow-xs' : 'text-slate-500'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {/* Track Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {tracks.map((tr, i) => (
            <button
              key={tr.id}
              onClick={() => resetTrack(i)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition-all ${
                i === trackIdx
                  ? 'bg-[#0e0d1d] text-white border-[#0e0d1d]'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Track {i + 1}: {tr.levelBadge}
            </button>
          ))}
        </div>

        {/* Audio Player Card */}
        <div className="bg-gradient-to-br from-[#0e0d1d] via-[#1c1644] to-[#0f342d] text-white rounded-[2rem] p-5 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#c4f82a]">
                {currentTrack.subtitle}
              </span>
              <h3 className="text-lg font-black mt-0.5">{currentTrack.title}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Headphones size={22} className="text-[#c4f82a]" />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-white/75">
              <span>
                {isPlaying && activeTurnIdx >= 0
                  ? `🎙 Gapiryapti: ${currentTrack.dialogue[activeTurnIdx]?.speaker}`
                  : 'Audioni boshlash uchun Play bosing'}
              </span>
              <span>
                {activeTurnIdx >= 0 ? activeTurnIdx + 1 : 0} / {currentTrack.dialogue.length} qism
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#c4f82a] transition-all duration-300"
                style={{
                  width: `${
                    activeTurnIdx >= 0
                      ? ((activeTurnIdx + 1) / currentTrack.dialogue.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleTogglePlay(0)}
              className={`flex-1 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                isPlaying ? 'bg-rose-500 text-white' : 'bg-[#c4f82a] text-slate-950'
              }`}
            >
              {isPlaying ? <Square size={15} /> : <Play size={15} />}
              <span>{isPlaying ? "Audioni to'xtatish" : 'Audioni Tinglash'}</span>
            </button>

            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center space-x-1.5"
            >
              <FileText size={15} />
              <span>{showTranscript ? 'Yashirish' : 'Transkript'}</span>
            </button>
          </div>
        </div>

        {/* Transcript */}
        {showTranscript && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-black text-indigo-700">
              <Sparkles size={14} />
              <span>Audio Matni (Speaker Transcript)</span>
            </div>
            {currentTrack.dialogue.map((turn, i) => (
              <button
                key={i}
                onClick={() => handleTogglePlay(i)}
                className={`w-full text-left p-3 rounded-2xl border text-xs leading-relaxed transition-all ${
                  activeTurnIdx === i
                    ? 'bg-indigo-50 border-indigo-400 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-black text-[#7052ff] mr-1.5">{turn.speaker}:</span>
                <span>{turn.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Result Banner */}
        {isSubmitted && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-5 border-2 border-indigo-200 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase bg-indigo-50 text-[#7052ff] px-2.5 py-1 rounded-full">
                  {isMultilevel ? 'Multilevel Listening' : 'IELTS Listening'}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {correctTotal} / {totalQs} to'g'ri
                </h3>
                <p className="text-xs text-slate-500">Pastda har bir savol tahlili va dalili ko'rsatildi</p>
              </div>
              <div className="bg-[#7052ff] text-white px-4 py-3 rounded-2xl text-center">
                <div className="text-2xl font-black font-mono">
                  {isMultilevel ? `${mlScore}/75` : band.toFixed(1)}
                </div>
                <div className="text-[10px] uppercase font-bold opacity-80">
                  {isMultilevel ? 'Ball' : 'Band'}
                </div>
              </div>
            </div>

            <PostExamActions
              resultId={submittedResultId}
              examType={examType}
              moduleName={`Listening (${currentTrack.partLabel})`}
              headlineScore={isMultilevel ? `${mlScore}/75` : `Band ${band.toFixed(1)}`}
              subtitle={`${correctTotal}/${totalQs} to'g'ri javob`}
              criteria={[
                { label: "To'g'ri javoblar", scoreText: `${correctTotal}/${totalQs}`, ratio },
                { label: 'Aniqlik', scoreText: `${Math.round(ratio * 100)}%`, ratio },
              ]}
              weakSkill="listening"
              mistakesToSave={mistakesForBank}
            />
          </div>
        )}

        {/* Questions */}
        <div className="space-y-3">
          {currentTrack.questions.map((q, idx) => {
            const isOk = isSubmitted && checkCorrect(q, answers[q.id]);
            return (
              <div key={q.id} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    <span className="text-[#7052ff] mr-1">{idx + 1}.</span>
                    {q.questionText}
                  </p>
                  {isSubmitted &&
                    (isOk ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-rose-500 shrink-0" />
                    ))}
                </div>

                {q.type === 'mcq' && q.options ? (
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const picked = answers[q.id] === opt;
                      const isAns = opt === q.correctAnswer;
                      let cls = 'bg-slate-50 border-slate-200 text-slate-700';
                      if (!isSubmitted && picked) cls = 'bg-indigo-50 border-[#7052ff] text-indigo-900 font-bold';
                      if (isSubmitted) {
                        if (isAns) cls = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        else if (picked) cls = 'bg-rose-50 border-rose-400 text-rose-900';
                      }
                      return (
                        <button
                          key={opt}
                          disabled={isSubmitted}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all ${cls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Bir so'z yozing..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:border-[#7052ff]"
                  />
                )}

                {isSubmitted && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] space-y-1">
                    <p className="font-bold text-emerald-700">To'g'ri javob: {q.correctAnswer}</p>
                    <p className="text-slate-600">{q.explanation}</p>
                    <p className="text-indigo-700 italic">"{q.evidenceQuote}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#4e2bf5] text-white font-black text-sm shadow-lg active:scale-95 transition-all"
          >
            ✅ Javoblarni Tekshirish
          </button>
        ) : (
          <button
            onClick={() => resetTrack(trackIdx)}
            className="w-full py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center space-x-2"
          >
            <RotateCcw size={15} />
            <span>Shu Trackni Qayta Yechish</span>
          </button>
        )}
      </div>
    </div>
  );
};
