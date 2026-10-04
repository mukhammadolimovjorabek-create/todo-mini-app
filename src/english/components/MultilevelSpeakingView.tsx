import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Clock, Award, ChevronRight, RotateCcw } from 'lucide-react';
import {
  getRandomMultilevelPart1_1,
  getRandomMultilevelPart1_2,
  getRandomMultilevelPart2,
  getRandomMultilevelPart3,
  type MultilevelPart1_1,
  type MultilevelPart1_2,
  type MultilevelPart2,
  type MultilevelPart3,
} from '../data/multilevelBank';
import { getSeenQuestions, markQuestionSeen, saveTestResult } from '../utils/storage';
import { evaluateCandidateSpeech, type SpeechEvaluationResult } from '../utils/ieltsScoring';
import { triggerHaptic } from '../../utils/telegram';
import type { TestResultItem } from '../types';

interface Props {
  onBack: () => void;
  userName: string;
}

type PartSelection = 'part1_1' | 'part1_2' | 'part2' | 'part3' | 'full_mock';
type Step = 'menu' | 'active_test' | 'feedback';

export const MultilevelSpeakingView: React.FC<Props> = ({ onBack, userName }) => {
  const [step, setStep] = useState<Step>('menu');
  const [selectedPart, setSelectedPart] = useState<PartSelection>('part1_1');
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Time tracking
  const [testStartTime, setTestStartTime] = useState<string>('');
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Active question state
  const [p1_1Item, setP1_1Item] = useState<MultilevelPart1_1 | null>(null);
  const [p1_1Idx, setP1_1Idx] = useState(0);

  const [p1_2Item, setP1_2Item] = useState<MultilevelPart1_2 | null>(null);
  const [p2Item, setP2Item] = useState<MultilevelPart2 | null>(null);
  const [p3Item, setP3Item] = useState<MultilevelPart3 | null>(null);

  // Full mock phase
  const [mockPhase, setMockPhase] = useState<'p1_1' | 'p1_2_prep' | 'p1_2_speak' | 'p2_prep' | 'p2_speak' | 'p3_prep' | 'p3_speak'>('p1_1');
  const [mockP1_1Idx, setMockP1_1Idx] = useState(0);

  // Phase: 'prep' | 'speak' for parts 1.2, 2, 3
  const [currentPhase, setCurrentPhase] = useState<'prep' | 'speak'>('prep');
  const [countdown, setCountdown] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [prepNotes, setPrepNotes] = useState('');

  // Live voice recognition
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<SpeechEvaluationResult | null>(null);

  const recognitionRef = useRef<any>(null);

  const getFormattedTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (!speechEnabled || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    let ended = false;
    const safeEnd = () => {
      if (!ended) {
        ended = true;
        if (onEnd) onEnd();
      }
    };

    const safetyTimer = setTimeout(() => {
      safeEnd();
    }, Math.max(2500, Math.min(8000, text.length * 80)));

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => {
        clearTimeout(safetyTimer);
        safeEnd();
      };
      utterance.onerror = () => {
        clearTimeout(safetyTimer);
        safeEnd();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      clearTimeout(safetyTimer);
      safeEnd();
    }
  };

  const isListeningWantedRef = useRef<boolean>(false);
  const accumulatedTextRef = useRef<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsManualInput(true);
      return;
    }

    isListeningWantedRef.current = true;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedTextRef.current += piece + ' ';
          } else {
            interim += piece;
          }
        }
        const combined = (accumulatedTextRef.current + interim).trim();
        if (combined) {
          setLiveTranscript(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'no-speech') {
          // Normal silence while thinking, do NOT stop mic!
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningWantedRef.current = false;
          setIsRecording(false);
          setIsManualInput(true);
          return;
        }
        if (event.error === 'network') {
          setIsManualInput(true);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsManualInput(true);
    }
  };

  const stopListening = () => {
    isListeningWantedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  // Start selected Part
  const handleStartExam = (part: PartSelection) => {
    triggerHaptic('heavy');
    setSelectedPart(part);
    setTranscriptHistory([]);
    setLiveTranscript('');
    accumulatedTextRef.current = '';
    setFeedback(null);
    setTestStartTime(getFormattedTime());
    setPrepNotes('');
    setStep('active_test');

    const seen = getSeenQuestions();

    if (part === 'part1_1') {
      const item = getRandomMultilevelPart1_1(seen);
      markQuestionSeen(item.id);
      setP1_1Item(item);
      setP1_1Idx(0);
      setCountdown(30); // Official: 30 seconds per question!
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(`Hello ${userName}. Welcome to Multilevel Part 1.1. Question one: ${item.questions[0]}`, () => {
          setIsTimerRunning(true);
          startListening();
        });
      }, 300);
    } else if (part === 'part1_2') {
      const item = getRandomMultilevelPart1_2(seen);
      markQuestionSeen(item.id);
      setP1_2Item(item);
      setCurrentPhase('prep');
      setCountdown(60); // Official: 60s preparation
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(`Part 1.2: Picture Comparison. You have one minute to prepare. Compare these pictures: ${item.questions[1] || item.title}`, () => {
          setIsTimerRunning(true);
        });
      }, 300);
    } else if (part === 'part2') {
      const item = getRandomMultilevelPart2(seen);
      markQuestionSeen(item.id);
      setP2Item(item);
      setCurrentPhase('prep');
      setCountdown(60); // Official: 60s preparation
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(`Part 2: Topic Presentation. You have one minute to prepare your ideas: ${item.questions[0]}`, () => {
          setIsTimerRunning(true);
        });
      }, 300);
    } else if (part === 'part3') {
      const item = getRandomMultilevelPart3(seen);
      markQuestionSeen(item.id);
      setP3Item(item);
      setCurrentPhase('prep');
      setCountdown(60); // Official: 60s preparation
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(`Part 3: Discussion. Topic: ${item.statement}. You have one minute to review the points and prepare.`, () => {
          setIsTimerRunning(true);
        });
      }, 300);
    } else if (part === 'full_mock') {
      const p1_1 = getRandomMultilevelPart1_1(seen);
      const p1_2 = getRandomMultilevelPart1_2(seen);
      const p2 = getRandomMultilevelPart2(seen);
      const p3 = getRandomMultilevelPart3(seen);

      setP1_1Item(p1_1);
      setP1_2Item(p1_2);
      setP2Item(p2);
      setP3Item(p3);
      setMockPhase('p1_1');
      setMockP1_1Idx(0);
      setCountdown(30);
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(`Welcome ${userName} to the Full Multilevel Speaking Mock Test. Part 1.1, Question one: ${p1_1.questions[0]}`, () => {
          setIsTimerRunning(true);
          startListening();
        });
      }, 300);
    }
  };

  // Countdown timer loop with strict auto-advance
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && countdown === 0) {
      triggerHaptic('heavy');
      handleTimeExpiredAdvance();
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  // When timer reaches 0s: AUTO ADVANCE!
  const handleTimeExpiredAdvance = () => {
    stopListening();
    setIsTimerRunning(false);

    if (selectedPart === 'part1_2' && currentPhase === 'prep') {
      setCurrentPhase('speak');
      setCountdown(120); // Official: 2 minutes speaking
      speakText("Your preparation time is up. Please speak now. You have two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
      return;
    }

    if (selectedPart === 'part2' && currentPhase === 'prep') {
      setCurrentPhase('speak');
      setCountdown(120); // Official: 2 minutes speaking
      speakText("Your preparation time is up. Please give your presentation now. You have two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
      return;
    }

    if (selectedPart === 'part3' && currentPhase === 'prep') {
      setCurrentPhase('speak');
      setCountdown(120); // Official: 2 minutes speaking
      speakText("Your preparation time is up. Please discuss the topic now. You have two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
      return;
    }

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    triggerHaptic('light');
    stopListening();
    setIsTimerRunning(false);

    if (selectedPart === 'full_mock') {
      handleFullMockProgression();
      return;
    }

    const currentQ = selectedPart === 'part1_1'
      ? (p1_1Item?.questions[p1_1Idx] || '')
      : selectedPart === 'part1_2'
      ? (p1_2Item?.title || '')
      : selectedPart === 'part2'
      ? (p2Item?.title || '')
      : (p3Item?.statement || '');

    const newHistory = [
      ...transcriptHistory,
      { question: currentQ, answer: liveTranscript.trim() || "(Nomzod belgilangan vaqtda javob bermadi)" }
    ];
    setTranscriptHistory(newHistory);
    setLiveTranscript('');
    accumulatedTextRef.current = '';
    setIsManualInput(false);

    if (selectedPart === 'part1_1') {
      if (p1_1Item && p1_1Idx + 1 < p1_1Item.questions.length) {
        const nextIdx = p1_1Idx + 1;
        setP1_1Idx(nextIdx);
        setCountdown(30);
        speakText(p1_1Item.questions[nextIdx], () => {
          setIsTimerRunning(true);
          startListening();
        });
      } else {
        finishAndEvaluate(newHistory, 'part1_1');
      }
    } else if (selectedPart === 'part1_2') {
      finishAndEvaluate(newHistory, 'part1_2');
    } else if (selectedPart === 'part2') {
      finishAndEvaluate(newHistory, 'part2');
    } else if (selectedPart === 'part3') {
      finishAndEvaluate(newHistory, 'part3');
    }
  };

  const handleFullMockProgression = () => {
    if (mockPhase === 'p1_1') {
      const currentQ = p1_1Item?.questions[mockP1_1Idx] || '';
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 1.1] ${currentQ}`, answer: liveTranscript.trim() || "(Javob berilmadi)" }
      ];
      setTranscriptHistory(newHistory);
      setLiveTranscript('');

      if (p1_1Item && mockP1_1Idx + 1 < 3) {
        const nextIdx = mockP1_1Idx + 1;
        setMockP1_1Idx(nextIdx);
        setCountdown(30);
        speakText(p1_1Item.questions[nextIdx], () => {
          setIsTimerRunning(true);
          startListening();
        });
      } else {
        // Transition to Part 1.2
        setMockPhase('p1_2_prep');
        setCountdown(60);
        speakText(`Part 1.2: Pictures. You have one minute to prepare: ${p1_2Item?.title}`, () => {
          setIsTimerRunning(true);
        });
      }
    } else if (mockPhase === 'p1_2_prep') {
      setMockPhase('p1_2_speak');
      setCountdown(120);
      speakText("Preparation is up. Speak now for two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
    } else if (mockPhase === 'p1_2_speak') {
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 1.2] ${p1_2Item?.title}`, answer: liveTranscript.trim() || "(Javob berilmadi)" }
      ];
      setTranscriptHistory(newHistory);
      setLiveTranscript('');

      setMockPhase('p2_prep');
      setCountdown(60);
      speakText(`Part 2: Topic. You have one minute to prepare: ${p2Item?.title}`, () => {
        setIsTimerRunning(true);
      });
    } else if (mockPhase === 'p2_prep') {
      setMockPhase('p2_speak');
      setCountdown(120);
      speakText("Preparation is up. Speak now for two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
    } else if (mockPhase === 'p2_speak') {
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 2] ${p2Item?.title}`, answer: liveTranscript.trim() || "(Javob berilmadi)" }
      ];
      setTranscriptHistory(newHistory);
      setLiveTranscript('');

      setMockPhase('p3_prep');
      setCountdown(60);
      speakText(`Part 3: Discussion. Statement: ${p3Item?.statement}. You have one minute to prepare.`, () => {
        setIsTimerRunning(true);
      });
    } else if (mockPhase === 'p3_prep') {
      setMockPhase('p3_speak');
      setCountdown(120);
      speakText("Preparation is up. Speak now for two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
    } else if (mockPhase === 'p3_speak') {
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 3] ${p3Item?.statement}`, answer: liveTranscript.trim() || "(Javob berilmadi)" }
      ];
      finishAndEvaluate(newHistory, 'full_mock');
    }
  };

  const finishAndEvaluate = (
    history: { question: string; answer: string }[],
    evaluatedType: PartSelection
  ) => {
    setIsEvaluating(true);
    triggerHaptic('heavy');
    window.speechSynthesis?.cancel();

    setTimeout(() => {
      const evalResult = evaluateCandidateSpeech(history, evaluatedType === 'full_mock' ? 'full_mock' : 'part1');
      setFeedback(evalResult);
      setIsEvaluating(false);
      setStep('feedback');

      const now = new Date();
      const endTime = getFormattedTime();
      const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      const titleMap = {
        part1_1: 'Milliy Multilevel: Part 1.1 (Q&A)',
        part1_2: 'Milliy Multilevel: Part 1.2 (Pictures)',
        part2: 'Milliy Multilevel: Part 2 (Presentation)',
        part3: 'Milliy Multilevel: Part 3 (Debate)',
        full_mock: 'Milliy Multilevel: Full Speaking Mock',
      };

      const historyItem: TestResultItem = {
        id: `ml_test_${Date.now()}`,
        date: dateStr,
        startTime: testStartTime || endTime,
        endTime,
        testType: 'speaking_part1',
        title: titleMap[evaluatedType],
        topic: 'CEFR Multilevel Speaking Test',
        overallBand: evalResult.overallBand,
        criteriaScores: {
          c1Name: 'Fluency',
          c1Score: evalResult.fluencyScore,
          c2Name: 'Lexical',
          c2Score: evalResult.lexicalScore,
          c3Name: 'Grammar',
          c3Score: evalResult.grammarScore,
          c4Name: 'Pronunciation',
          c4Score: evalResult.pronunciationScore,
        },
        strengths: evalResult.strengths,
        improvements: evalResult.improvements,
      };

      saveTestResult(historyItem);
      triggerHaptic('heavy');
    }, 1500);
  };

  const getCefrGrade = (band: number) => {
    if (band >= 7.5) return 'C1 (Advanced)';
    if (band >= 6.0) return 'B2 (Vantage)';
    if (band >= 4.5) return 'B1 (Threshold)';
    return 'A2 (Waystage)';
  };

  // ── MENU SCREEN ──
  if (step === 'menu') {
    return (
      <div className="p-5 space-y-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-black text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>Asosiyga qaytish</span>
          </button>

          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
              speechEnabled ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{speechEnabled ? "Examiner ovozi" : "Ovozsiz"}</span>
          </button>
        </div>

        {/* Banner */}
        <div
          className="rounded-[2.2rem] p-6 text-white shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #091f1a 0%, #0e3b32 60%, #155e51 100%)' }}
        >
          <div className="flex items-center space-x-3.5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#c4f82a] text-[#121124] flex items-center justify-center text-3xl shadow-lg shrink-0">
              🇺🇿
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-base font-black text-white">Milliy Multilevel (CEFR)</h3>
                <span className="text-[9px] font-black bg-[#c4f82a] text-[#121124] px-1.5 py-0.5 rounded">B1-B2-C1</span>
              </div>
              <p className="text-[11px] text-teal-100 font-medium mt-0.5">
                Rasmiy DTM / Bilimni baholash agentligi standarti
              </p>
            </div>
          </div>
          <p className="text-xs text-teal-100/90 mt-3 relative z-10 border-t border-white/10 pt-2.5 leading-relaxed">
            "September-December va CEFR Speaking bazasi asosida har bir qismning rasmiy vaqt me'yorlari bilan mashq qiling."
          </p>
        </div>

        {/* Part Selection */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Imtihon qismini tanlang:
          </h4>

          {/* Part 1.1 */}
          <div
            onClick={() => handleStartExam('part1_1')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-teal-500 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs">
                P1.1
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 1.1: Qisqa savol-javob</p>
                <p className="text-[11px] text-slate-500">3 ta savol · Har biriga aniq 30 soniya</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700">Boshlash →</span>
          </div>

          {/* Part 1.2 */}
          <div
            onClick={() => handleStartExam('part1_2')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-teal-500 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs">
                P1.2
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 1.2: Rasmlarni taqqoslash</p>
                <p className="text-[11px] text-slate-500">1 daqiqa tayyorlanish · 2 daqiqa nutq</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700">Boshlash →</span>
          </div>

          {/* Part 2 */}
          <div
            onClick={() => handleStartExam('part2')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-teal-500 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs">
                P2
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 2: Mavzu taqdimoti (Presentation)</p>
                <p className="text-[11px] text-slate-500">1 daqiqa tayyorlanish · 2 daqiqa nutq</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700">Boshlash →</span>
          </div>

          {/* Part 3 */}
          <div
            onClick={() => handleStartExam('part3')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-teal-500 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs">
                P3
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 3: Munozara (For vs Against)</p>
                <p className="text-[11px] text-slate-500">1 daqiqa tayyorlanish · 2 daqiqa nutq</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-700">Boshlash →</span>
          </div>

          {/* Full Mock */}
          <div
            onClick={() => handleStartExam('full_mock')}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#091f1a] to-[#155e51] text-white border border-teal-400/30 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-sm shrink-0">
                ⭐
              </div>
              <div>
                <p className="text-sm font-black text-white">Full Multilevel Mock (To'liq Imtihon)</p>
                <p className="text-[11px] text-teal-100">Barcha 4 qism ketma-ket rasmiy vaqt bilan</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#c4f82a] shrink-0 pl-2">Topshirish →</span>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE TEST SCREEN (LOCKED - STRICT COUNTDOWN) ──
  if (step === 'active_test') {
    const isPrep = currentPhase === 'prep' && selectedPart !== 'part1_1';
    const isWarning = countdown <= 10;

    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-300 relative">
        {/* Exit Confirmation Modal */}
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-in fade-in">
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
                ⚠️
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="text-base font-black text-slate-900">Sinovni to'xtatmoqchimisiz?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Agar hozir chiqib ketsangiz, topshirilgan nutq javoblaringiz va test natijangiz saqlanmaydi.
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
                    window.speechSynthesis?.cancel();
                    stopListening();
                    setShowExitConfirmModal(false);
                    setStep('menu');
                  }}
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Ha, chiqish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Session Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowExitConfirmModal(true);
            }}
            className="flex items-center space-x-1 text-xs font-black text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            <span>Chiqish</span>
          </button>

          <div className="flex items-center space-x-2">
            {/* 2-rasm: Audio Equalizer Wave Animation */}
            <div className="bg-[#091f1a] border border-white/10 px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-sm h-7" title="Jonli ovoz to'lqini">
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-1 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-2 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-3 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-4 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-5 inline-block" />
            </div>

            <span className="text-[10px] font-black uppercase bg-teal-600 text-white px-2.5 py-0.5 rounded-full">
              {selectedPart.toUpperCase()} • LOCKED
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Clock size={14} className={isWarning ? 'text-rose-500 animate-spin' : 'text-teal-600'} />
              <span>{isPrep ? "Tayyorgarlik vaqti (1 min)" : "Nutq so'zlash vaqti:"}</span>
            </span>
            <span className={`text-xl font-mono font-black ${isWarning ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
              00:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isWarning ? 'bg-rose-500' : 'bg-teal-500'}`}
              style={{
                width: `${(countdown / (isPrep ? 60 : selectedPart === 'part1_1' ? 30 : 120)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Part 1.1 Question */}
        {(selectedPart === 'part1_1' || (selectedPart === 'full_mock' && mockPhase === 'p1_1')) && p1_1Item && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Part 1.1 • Savol {selectedPart === 'full_mock' ? mockP1_1Idx + 1 : p1_1Idx + 1} / 3
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(p1_1Item.questions[selectedPart === 'full_mock' ? mockP1_1Idx : p1_1Idx]);
                }}
                className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Savolni eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-base font-black text-slate-900 mt-1 leading-snug">
              "{p1_1Item.questions[selectedPart === 'full_mock' ? mockP1_1Idx : p1_1Idx]}"
            </p>
            <p className="text-[11px] text-slate-400">Har bir savolga 30 soniya</p>
          </div>
        )}

        {/* Part 1.2 Pictures Card */}
        {(selectedPart === 'part1_2' || (selectedPart === 'full_mock' && (mockPhase === 'p1_2_prep' || mockPhase === 'p1_2_speak'))) && p1_2Item && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Part 1.2: Pictures Comparison
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(`Part 1.2: Picture Comparison. ${p1_2Item.prompt}`);
                }}
                className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Vazifani eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-800">
              <p className="font-bold text-slate-900">• {p1_2Item.prompt}</p>
              {p1_2Item.questions.slice(1).map((q, i) => (
                <p key={i}>• {q}</p>
              ))}
            </div>
          </div>
        )}

        {/* Part 2 Presentation Card */}
        {(selectedPart === 'part2' || (selectedPart === 'full_mock' && (mockPhase === 'p2_prep' || mockPhase === 'p2_speak'))) && p2Item && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Part 2: Topic Presentation
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(`Part 2: Topic Presentation. ${p2Item.questions[0] || ''}`);
                }}
                className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Mavzuni eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-800">
              {p2Item.questions.map((q, i) => (
                <p key={i} className="font-bold">• {q}</p>
              ))}
            </div>
          </div>
        )}

        {/* Part 3 Debate Card */}
        {(selectedPart === 'part3' || (selectedPart === 'full_mock' && (mockPhase === 'p3_prep' || mockPhase === 'p3_speak'))) && p3Item && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Part 3: Discussion (For vs Against)
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(`Part 3: Discussion. ${p3Item.statement}`);
                }}
                className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Munozara mavzusini eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <h4 className="text-sm font-black text-slate-900 leading-snug">
              "{p3Item.statement}"
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <span className="font-black text-emerald-800 uppercase block mb-1">For (Qo'llab):</span>
                {p3Item.forPoints.map((pt, i) => (
                  <p key={i} className="text-slate-700">• {pt}</p>
                ))}
              </div>

              <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
                <span className="font-black text-rose-800 uppercase block mb-1">Against (Qarshi):</span>
                {p3Item.againstPoints.map((pt, i) => (
                  <p key={i} className="text-slate-700">• {pt}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prep Notes if in Prep */}
        {isPrep && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700">Qoralamalar (Notes):</span>
            <textarea
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="Tayyorgarlik uchun qisqa qaydlar yozing..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-teal-500 resize-none"
            />
          </div>
        )}

        {/* Voice Recognition Speech Container */}
        {!isPrep && (
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Sizning nutqingiz (Ovozli javob):
              </span>
              {isRecording ? (
                <span className="text-[11px] font-bold text-rose-500 animate-pulse flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Gapiring, eshitilmoqda...</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-400">Mikrofon kutmoqda</span>
              )}
            </div>

            {/* Live speech transcription display box or manual fallback */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[90px] flex flex-col justify-between">
              {isManualInput ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Qo'lda tahrirlash / yozish:</span>
                    <button
                      type="button"
                      onClick={() => setIsManualInput(false)}
                      className="text-teal-700 hover:underline"
                    >
                      Ovozli rejimga qaytish 🎙️
                    </button>
                  </div>
                  <textarea
                    value={liveTranscript}
                    onChange={(e) => {
                      setLiveTranscript(e.target.value);
                      accumulatedTextRef.current = e.target.value;
                    }}
                    placeholder="Javobingizni shu yerda yozishingiz yoki tahrirlashingiz mumkin..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-teal-500 resize-none"
                  />
                </div>
              ) : liveTranscript ? (
                <div>
                  <p className="text-sm font-medium text-slate-900 leading-relaxed font-sans">
                    "{liveTranscript}"
                  </p>
                  <div className="text-right pt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsManualInput(true)}
                      className="text-[10px] font-bold text-teal-700 hover:underline"
                    >
                      ✍️ Tahrirlash / Yozish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-1">
                  <p className="text-xs text-slate-400 italic">
                    Mikrofon orqali gapiring. Aytgan so'zlaringiz shu yerda jonli aks etadi...
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsManualInput(true)}
                    className="text-[10px] font-bold text-slate-500 hover:text-teal-700 underline pt-1 block mx-auto"
                  >
                    Mikrofon ishlamasa, yozish uchun bosing ✍️
                  </button>
                </div>
              )}

              {/* Real-time wave indicator when recording */}
              {isRecording && !isManualInput && (
                <div className="flex items-center justify-center space-x-1 pt-2">
                  <span className="w-1 h-3 bg-teal-500 rounded-full animate-bounce" />
                  <span className="w-1 h-5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-4 bg-teal-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-6 bg-teal-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1 h-3 bg-teal-500 rounded-full animate-bounce" />
                </div>
              )}
            </div>

            {/* Voice Controls */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => {
                  if (isRecording) stopListening();
                  else startListening();
                }}
                className={`flex-1 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all ${
                  isRecording ? 'bg-rose-500 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                }`}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isRecording ? "To'xtatish" : "Mikrofonni yoqish"}</span>
              </button>

              <button
                disabled={isEvaluating}
                onClick={handleNextQuestion}
                className="flex-1 py-3.5 rounded-2xl bg-[#7052ff] hover:bg-[#5b3ce0] text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <span>Keyingisi</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── FEEDBACK SCREEN ──
  if (step === 'feedback' && feedback) {
    const cefrGrade = getCefrGrade(feedback.overallBand);

    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-300">
        <button
          onClick={() => setStep('menu')}
          className="flex items-center space-x-1.5 text-xs font-black text-teal-700 hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Multilevel menyusiga qaytish</span>
        </button>

        {/* Result Card */}
        <div
          className="rounded-[2.2rem] p-6 text-white text-center shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #091f1a 0%, #0e3b32 60%, #155e51 100%)' }}
        >
          <div className="inline-flex items-center space-x-1.5 bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Award size={12} />
            <span>MILLIY SERTIFIKAT CEFR DARAJA</span>
          </div>

          <h3 className="text-3xl font-black text-white my-1 tracking-tight">
            {cefrGrade}
          </h3>
          <p className="text-[11px] text-teal-100">
            Ekvivalent IELTS Ball: {feedback.overallBand.toFixed(1)}
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-1 text-center">
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-[#c4f82a]">{feedback.fluencyScore.toFixed(1)}</p>
              <p className="text-[9px] text-teal-200">Fluency</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-amber-300">{feedback.lexicalScore.toFixed(1)}</p>
              <p className="text-[9px] text-teal-200">Lexical</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-emerald-300">{feedback.grammarScore.toFixed(1)}</p>
              <p className="text-[9px] text-teal-200">Grammar</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-pink-300">{feedback.pronunciationScore.toFixed(1)}</p>
              <p className="text-[9px] text-teal-200">Pronun.</p>
            </div>
          </div>
        </div>

        {/* Feedback advice */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Ekspert tavsiyalari (C1 darajaga erishish uchun)
          </h4>
          <div className="space-y-2">
            {feedback.improvements.map((imp, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                <span className="text-teal-700 font-bold">#{idx + 1}</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 italic">
              ✓ Natija avtomatik ravishda «Topshirilgan sinovlar tarixi»ga saqlandi.
            </p>
          </div>
        </div>

        <button
          onClick={() => setStep('menu')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <RotateCcw size={18} />
          <span>Yana boshqa test topshirish</span>
        </button>
      </div>
    );
  }

  return null;
};
