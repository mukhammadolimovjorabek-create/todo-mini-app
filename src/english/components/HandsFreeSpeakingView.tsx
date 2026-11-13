import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Headphones, Mic, Square, ChevronRight, Volume2 } from 'lucide-react';
import { getRandomPart1Topic } from '../data/speakingBank';
import { speakEnglishText, stopSpeaking } from '../../utils/speechVoice';
import { createExamRecorder, transcribeAudio, resolvePendingAnswers } from '../utils/examRecorder';
import { evaluateCandidateSpeechWithAI, type SpeechEvaluationResult } from '../utils/ieltsScoring';
import { evaluateMultilevelSpeechWithAI, type MultilevelEvaluationResult } from '../utils/multilevelScoring';
import { saveTestResult } from '../utils/storage';
import { triggerHaptic } from '../../utils/telegram';
import { PostExamActions } from './PostExamActions';

interface Props {
  onBack: () => void;
  examType?: 'ielts' | 'multilevel';
}

export const HandsFreeSpeakingView: React.FC<Props> = ({ onBack, examType = 'ielts' }) => {
  const isMultilevel = examType === 'multilevel';
  const [topic] = useState(() => getRandomPart1Topic());
  const questions = topic.questions.slice(0, 4);

  const [step, setStep] = useState<'ready' | 'speaking_q' | 'recording' | 'grading' | 'done'>('ready');
  const [qIdx, setQIdx] = useState(0);
  const [liveText, setLiveText] = useState('');
  const [ieltsRes, setIeltsRes] = useState<SpeechEvaluationResult | null>(null);
  const [mlRes, setMlRes] = useState<MultilevelEvaluationResult | null>(null);
  const [resultId, setResultId] = useState('');

  const recorderRef = useRef(createExamRecorder());
  const historyRef = useRef<{ question: string; answer: string; metrics?: any }[]>([]);
  const pendingRef = useRef<Map<number, Promise<string>>>(new Map());
  const startTimeRef = useRef(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
      recorderRef.current.release();
    };
  }, []);

  const askAndRecordQuestion = (index: number) => {
    const q = questions[index];
    setQIdx(index);
    setLiveText('');
    setStep('speaking_q');

    speakEnglishText(q, {
      voice: 'en-GB-RyanNeural',
      rate: 0.96,
      preferNeural: true,
      onEnd: () => {
        setStep('recording');
        recorderRef.current.startTurn((txt) => setLiveText(txt));
      },
    });
  };

  const handleStartHandsFree = async () => {
    triggerHaptic('heavy');
    const ok = await recorderRef.current.ensureMic();
    if (!ok) {
      alert("Yo'l rejimi uchun mikrofon ruxsati kerak.");
      return;
    }
    historyRef.current = questions.map((q) => ({ question: q, answer: '' }));
    askAndRecordQuestion(0);
  };

  const handleNextOrFinish = async () => {
    triggerHaptic('medium');
    if (recorderRef.current.isRecording()) {
      const idx = qIdx;
      const blob = await recorderRef.current.stopTurn();
      const metrics = recorderRef.current.getLastMetrics();
      historyRef.current[idx].metrics = metrics;
      if (blob) {
        pendingRef.current.set(idx, transcribeAudio(blob, questions[idx], idx));
      }
    }

    if (qIdx + 1 < questions.length) {
      askAndRecordQuestion(qIdx + 1);
      return;
    }

    setStep('grading');
    stopSpeaking();
    recorderRef.current.release();

    const { history } = await resolvePendingAnswers(historyRef.current, pendingRef.current);
    const id = `${isMultilevel ? 'ml_' : ''}handsfree_${Date.now()}`;
    setResultId(id);

    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

    if (isMultilevel) {
      const res = await evaluateMultilevelSpeechWithAI(history, 'part1_1');
      setMlRes(res);
      saveTestResult({
        id,
        date: dateStr,
        startTime: startTimeRef.current,
        endTime,
        testType: 'speaking_part1',
        title: `Milliy Multilevel: Yo'l Rejimi (${topic.topic})`,
        topic: topic.topic,
        overallBand: res.totalScore,
        criteriaScores: {
          c1Name: 'Fluency',
          c1Score: res.fluencyScore,
          c2Name: 'Lexical',
          c2Score: res.lexicalScore,
          c3Name: 'Grammar',
          c3Score: res.grammarScore,
          c4Name: 'Pronun/Task',
          c4Score: res.pronunciationTaskScore,
        },
        strengths: res.strengths,
        improvements: res.improvements,
      });
    } else {
      const res = await evaluateCandidateSpeechWithAI(history, 'part1');
      setIeltsRes(res);
      saveTestResult({
        id,
        date: dateStr,
        startTime: startTimeRef.current,
        endTime,
        testType: 'speaking_part1',
        title: `IELTS Speaking: Yo'l Rejimi (${topic.topic})`,
        topic: topic.topic,
        overallBand: res.overallBand,
        criteriaScores: {
          c1Name: 'Fluency',
          c1Score: res.fluencyScore,
          c2Name: 'Lexical',
          c2Score: res.lexicalScore,
          c3Name: 'Grammar',
          c3Score: res.grammarScore,
          c4Name: 'Pronunciation',
          c4Score: res.pronunciationScore,
        },
        strengths: res.strengths,
        improvements: res.improvements,
      });
    }

    setStep('done');
  };

  return (
    <div className="min-h-screen bg-[#0b0a18] text-white flex flex-col justify-between p-5 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopSpeaking();
            recorderRef.current.release();
            onBack();
          }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-black text-[#c4f82a]">
          <Headphones size={14} />
          <span>Yo'l Rejimi (Audio-First)</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-md w-full mx-auto my-auto space-y-6 text-center py-6">
        {step === 'ready' && (
          <>
            <div className="w-24 h-24 rounded-full bg-[#7052ff]/25 border border-[#7052ff]/50 flex items-center justify-center mx-auto">
              <Headphones size={40} className="text-[#c4f82a]" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-300">{topic.topic}</p>
              <h2 className="text-2xl font-black">Ekranga qaramasdan gapiring</h2>
              <p className="text-xs text-white/70 leading-relaxed">
                Transportda yoki yurib ketayotganda qulay: AI {questions.length} ta savolni navbatma-navbat ovozda o'qiydi, siz esa faqat gapirasiz.
              </p>
            </div>
            <button
              onClick={handleStartHandsFree}
              className="w-full py-5 rounded-3xl bg-[#c4f82a] text-slate-950 font-black text-base shadow-xl active:scale-95 transition-all"
            >
              🎧 Boshlash ({questions.length} ta savol)
            </button>
          </>
        )}

        {(step === 'speaking_q' || step === 'recording') && (
          <>
            <div className="text-xs font-black uppercase tracking-wider text-white/60">
              Savol {qIdx + 1} / {questions.length}
            </div>
            <h3 className="text-xl font-black leading-snug px-2">{questions[qIdx]}</h3>

            <div className="py-4">
              {step === 'speaking_q' ? (
                <div className="w-28 h-28 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex flex-col items-center justify-center mx-auto animate-pulse">
                  <Volume2 size={32} className="text-indigo-300" />
                  <span className="text-[10px] font-black mt-1">Savol o'qilmoqda</span>
                </div>
              ) : (
                <div className="w-28 h-28 rounded-full bg-rose-500/25 border-2 border-rose-400 flex flex-col items-center justify-center mx-auto animate-pulse">
                  <Mic size={34} className="text-rose-300" />
                  <span className="text-[10px] font-black mt-1">Gapiring...</span>
                </div>
              )}
            </div>

            {liveText && (
              <p className="text-xs text-white/75 bg-white/5 rounded-2xl p-3 border border-white/10">
                "{liveText}"
              </p>
            )}

            <button
              onClick={handleNextOrFinish}
              disabled={step === 'speaking_q'}
              className="w-full py-5 rounded-3xl bg-white text-slate-950 font-black text-base flex items-center justify-center space-x-2 shadow-xl disabled:opacity-40 active:scale-95 transition-all"
            >
              {qIdx + 1 < questions.length ? (
                <>
                  <span>Keyingi Savol</span>
                  <ChevronRight size={20} />
                </>
              ) : (
                <>
                  <Square size={16} />
                  <span>Tugatish va AI Baho</span>
                </>
              )}
            </button>
          </>
        )}

        {step === 'grading' && (
          <div className="space-y-3 py-10">
            <div className="w-16 h-16 border-4 border-[#c4f82a] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-black">Audio javoblar tahlil qilinmoqda...</p>
          </div>
        )}

        {step === 'done' && (ieltsRes || mlRes) && (
          <div className="text-left space-y-4">
            <div className="bg-white/10 border border-white/15 rounded-3xl p-5 text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-[#c4f82a]">
                {isMultilevel ? 'Milliy Multilevel' : 'IELTS Speaking'}
              </span>
              <div className="text-4xl font-black text-[#c4f82a]">
                {mlRes ? `${mlRes.totalScore} / 75` : `Band ${ieltsRes?.overallBand.toFixed(1)}`}
              </div>
              <p className="text-xs text-white/75">
                {mlRes ? mlRes.cefrTitle : "Yo'l rejimi mashqi yakunlandi"}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 text-slate-900 space-y-2 text-xs">
              <p className="font-black text-emerald-700">Kuchli tomonlar:</p>
              {(mlRes?.strengths || ieltsRes?.strengths || []).map((s, i) => (
                <p key={i}>• {s}</p>
              ))}
              <p className="font-black text-amber-700 pt-2">Tavsiyalar:</p>
              {(mlRes?.improvements || ieltsRes?.improvements || []).map((s, i) => (
                <p key={i}>• {s}</p>
              ))}
            </div>

            <PostExamActions
              resultId={resultId}
              examType={examType}
              moduleName={`Speaking Yo'l Rejimi (${topic.topic})`}
              headlineScore={mlRes ? `${mlRes.totalScore}/75` : `Band ${ieltsRes?.overallBand.toFixed(1)}`}
              subtitle={topic.topic}
              criteria={
                mlRes
                  ? [
                      { label: 'Fluency', scoreText: `${mlRes.fluencyScore}/20`, ratio: mlRes.fluencyScore / 20 },
                      { label: 'Lexical', scoreText: `${mlRes.lexicalScore}/20`, ratio: mlRes.lexicalScore / 20 },
                      { label: 'Grammar', scoreText: `${mlRes.grammarScore}/20`, ratio: mlRes.grammarScore / 20 },
                      { label: 'Pronun/Task', scoreText: `${mlRes.pronunciationTaskScore}/15`, ratio: mlRes.pronunciationTaskScore / 15 },
                    ]
                  : [
                      { label: 'Fluency', scoreText: `${ieltsRes?.fluencyScore}`, ratio: (ieltsRes?.fluencyScore || 0) / 9 },
                      { label: 'Lexical', scoreText: `${ieltsRes?.lexicalScore}`, ratio: (ieltsRes?.lexicalScore || 0) / 9 },
                      { label: 'Grammar', scoreText: `${ieltsRes?.grammarScore}`, ratio: (ieltsRes?.grammarScore || 0) / 9 },
                      { label: 'Pronunciation', scoreText: `${ieltsRes?.pronunciationScore}`, ratio: (ieltsRes?.pronunciationScore || 0) / 9 },
                    ]
              }
              weakSkill="fluency"
            />
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
};
