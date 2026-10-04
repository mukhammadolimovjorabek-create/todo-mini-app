import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Clock, CheckCircle2, RotateCcw, Award, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react';
import { speakingBank, getRandomPart2Topic, getRandomPart3Topic, type Part1Topic, type Part2CueCard, type Part3Topic } from '../data/speakingBank';
import { getSeenQuestions, markQuestionSeen, saveTestResult } from '../utils/storage';
import { evaluateCandidateSpeech, type SpeechEvaluationResult } from '../utils/ieltsScoring';
import { triggerHaptic } from '../../utils/telegram';
import type { TestResultItem, TestType } from '../types';

interface Props {
  onBack: () => void;
  userName: string;
}

type PartSelection = 'part1' | 'part2' | 'part3' | 'full_mock';
type Step = 'part_select' | 'topic_select' | 'active_test' | 'feedback';
type MockPhase = 'p1' | 'p2_prep' | 'p2_speak' | 'p3';

// Official IELTS response benchmarks
const TIME_LIMITS = {
  part1Question: 40, // 40 seconds per Part 1 question
  part2Prep: 60,      // 60 seconds preparation
  part2Speak: 120,    // 120 seconds monologue speech
  part3Question: 55, // 55 seconds per Part 3 question
};

// Categorized topic domains
const TOPIC_DOMAINS = [
  { id: 'random', name: 'Barcha mavzulardan ixtiyoriy (Random)', icon: '🎲', keywords: [] },
  { id: 'edu_work', name: "Ta'lim va Ish (Education & Work)", icon: '🎓', keywords: ['work', 'studies', 'school', 'teacher', 'science', 'job', 'ambition', 'career', 'study'] },
  { id: 'tech_media', name: 'Texnologiya va Internet (Tech & Media)', icon: '💻', keywords: ['social media', 'website', 'internet', 'technology', 'computer', 'app', 'online'] },
  { id: 'animals_nature', name: 'Hayvonlar va Tabiat (Animals & Nature)', icon: '🐾', keywords: ['animal', 'pet', 'park', 'nature', 'tree', 'flower', 'weather', 'bird'] },
  { id: 'food_life', name: 'Taomlar va Hayot tarzi (Food & Lifestyle)', icon: '🍔', keywords: ['food', 'cooking', 'restaurant', 'shopping', 'tidiness', 'watch', 'mirror', 'clothes'] },
  { id: 'travel_cities', name: 'Sayohat va Shaharlar (Travel & Cities)', icon: '✈️', keywords: ['hometown', 'accommodation', 'home', 'travel', 'car', 'city', 'country', 'holiday'] },
  { id: 'arts_culture', name: 'Musiqa va Madaniyat (Music & Arts)', icon: '🎨', keywords: ['music', 'art', 'museum', 'dream', 'sport', 'game', 'cinema', 'book'] },
];

export const AISpeakingView: React.FC<Props> = ({ onBack, userName }) => {
  const [step, setStep] = useState<Step>('part_select');
  const [selectedPart, setSelectedPart] = useState<PartSelection>('part1');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('random');

  // Audio SpeechSynthesis (Examiner voice)
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Time tracking
  const [testStartTime, setTestStartTime] = useState<string>('');

  // Part 1 state
  const [p1Topic, setP1Topic] = useState<Part1Topic | null>(null);
  const [p1Index, setP1Index] = useState(0);

  // Part 2 state
  const [p2Topic, setP2Topic] = useState<Part2CueCard | null>(null);
  const [prepNotes, setPrepNotes] = useState('');

  // Part 3 state
  const [p3Topic, setP3Topic] = useState<Part3Topic | null>(null);
  const [p3Index, setP3Index] = useState(0);

  // Full Mock State
  const [mockPhase, setMockPhase] = useState<MockPhase>('p1');
  const [mockP1Idx, setMockP1Idx] = useState(0);
  const [mockP3Idx, setMockP3Idx] = useState(0);

  // Strict Question Countdown Timer
  const [countdown, setCountdown] = useState<number>(40);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Candidate speech transcript (Pure voice - NO typing)
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [transcriptHistory, setTranscriptHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<SpeechEvaluationResult | null>(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Recognition reference
  const recognitionRef = useRef<any>(null);

  const getFormattedTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Speak function with safety timeout so test never freezes on mobile
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
      utterance.lang = 'en-GB';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
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
  const hasMicPermissionRef = useRef<boolean>(false);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  // Start Recognition automatically with cached permission and hardware release
  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsManualInput(true);
      return;
    }

    isListeningWantedRef.current = true;

    // Prompt microphone permission ONLY ONCE and immediately release tracks so SpeechRecognition can access hardware!
    if (!hasMicPermissionRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        hasMicPermissionRef.current = true;
      } catch (err) {
        console.warn("Microphone permission prompt warning:", err);
      }
    }

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
          // Normal brief pause, do NOT turn off microphone!
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
        // Automatically restart if user is on active speaking turn
        if (isListeningWantedRef.current) {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (isListeningWantedRef.current) {
                try { recognition.start(); } catch {}
              }
            }, 250);
          }
        } else {
          setIsRecording(false);
        }
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

  // Filter topics by domain
  const filterTopicByDomain = <T extends { topic: string; id: string }>(list: T[], domainId: string): T => {
    const seen = new Set(getSeenQuestions().map((s) => s.toLowerCase()));
    const domain = TOPIC_DOMAINS.find((d) => d.id === domainId);

    let candidates = list;
    if (domain && domain.keywords.length > 0) {
      const filtered = list.filter((item) =>
        domain.keywords.some((kw) => item.topic.toLowerCase().includes(kw))
      );
      if (filtered.length > 0) candidates = filtered;
    }

    // Exclude previously seen
    const unseen = candidates.filter((item) => !seen.has(item.topic.toLowerCase()) && !seen.has(item.id.toLowerCase()));
    const pool = unseen.length > 0 ? unseen : candidates;
    return pool[Math.floor(Math.random() * pool.length)] || list[0];
  };

  // Step 1: Select Part -> Go to Topic domain select
  const handleChoosePart = (part: PartSelection) => {
    triggerHaptic('medium');
    setSelectedPart(part);
    setSelectedDomainId('random');
    setStep('topic_select');
  };

  // Step 2: Confirm Topic -> Start Locked Exam
  const handleStartExam = () => {
    triggerHaptic('heavy');
    setTranscriptHistory([]);
    setLiveTranscript('');
    setFeedback(null);
    setTestStartTime(getFormattedTime());
    setStep('active_test');

    const seen = getSeenQuestions();

    if (selectedPart === 'part1') {
      const topic = filterTopicByDomain(speakingBank.part1, selectedDomainId);
      markQuestionSeen(topic.topic);
      setP1Topic(topic);
      setP1Index(0);
      setCountdown(TIME_LIMITS.part1Question);
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(
          `Hello ${userName}. Welcome to Part 1. We will discuss ${topic.topic}. First question: ${topic.questions[0]}`,
          () => {
            setIsTimerRunning(true);
            startListening();
          }
        );
      }, 300);
    } else if (selectedPart === 'part2') {
      const topic = filterTopicByDomain(speakingBank.part2, selectedDomainId);
      markQuestionSeen(topic.topic);
      setP2Topic(topic);
      setMockPhase('p2_prep');
      setCountdown(TIME_LIMITS.part2Prep);
      setIsTimerRunning(false);
      setPrepNotes('');

      setTimeout(() => {
        speakText(
          `In this part, I will give you a topic. You have one minute to prepare. Here is your topic: ${topic.cueCard}`,
          () => {
            setIsTimerRunning(true);
          }
        );
      }, 300);
    } else if (selectedPart === 'part3') {
      const topic = filterTopicByDomain(speakingBank.part3, selectedDomainId);
      markQuestionSeen(topic.topic);
      setP3Topic(topic);
      setP3Index(0);
      setCountdown(TIME_LIMITS.part3Question);
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(
          `We are now in Part 3. Let's discuss ${topic.topic} in depth. First question: ${topic.questions[0]}`,
          () => {
            setIsTimerRunning(true);
            startListening();
          }
        );
      }, 300);
    } else if (selectedPart === 'full_mock') {
      const p1 = filterTopicByDomain(speakingBank.part1, selectedDomainId);
      const p2 = getRandomPart2Topic([...seen, p1.topic]);
      const p3 = getRandomPart3Topic([...seen, p1.topic, p2.topic]);

      markQuestionSeen(p1.topic);
      markQuestionSeen(p2.topic);
      markQuestionSeen(p3.topic);

      setP1Topic(p1);
      setP2Topic(p2);
      setP3Topic(p3);
      setMockPhase('p1');
      setMockP1Idx(0);
      setMockP3Idx(0);
      setCountdown(TIME_LIMITS.part1Question);
      setIsTimerRunning(false);

      setTimeout(() => {
        speakText(
          `Welcome ${userName} to your Full IELTS Speaking Mock Test. We will begin Part 1 with ${p1.topic}. ${p1.questions[0]}`,
          () => {
            setIsTimerRunning(true);
            startListening();
          }
        );
      }, 300);
    }
  };

  // Main Countdown Loop with Auto-Advance when time is UP
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && countdown === 0) {
      // Time is up! Automatically commit answer and advance!
      triggerHaptic('heavy');
      handleTimeExpiredAdvance();
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  // When time expires: no turning back, immediately advance!
  const handleTimeExpiredAdvance = () => {
    stopListening();
    setIsTimerRunning(false);

    // If it was Part 2 preparation time expiring -> start speaking time
    if (
      (selectedPart === 'part2' && mockPhase === 'p2_prep') ||
      (selectedPart === 'full_mock' && mockPhase === 'p2_prep')
    ) {
      setMockPhase('p2_speak');
      setCountdown(TIME_LIMITS.part2Speak);
      speakText("Your preparation time is up. Please speak now. You have up to two minutes.", () => {
        setIsTimerRunning(true);
        startListening();
      });
      return;
    }

    // Otherwise, advance to next question
    handleNextQuestion();
  };

  // Move to next question or evaluate
  const handleNextQuestion = () => {
    triggerHaptic('light');
    stopListening();
    setIsTimerRunning(false);

    if (selectedPart === 'full_mock') {
      handleFullMockStep();
      return;
    }

    const currentQ = selectedPart === 'part1'
      ? (p1Topic?.questions[p1Index] || '')
      : selectedPart === 'part2'
      ? (p2Topic?.cueCard || '')
      : (p3Topic?.questions[p3Index] || '');

    const newHistory = [
      ...transcriptHistory,
      { question: currentQ, answer: liveTranscript.trim() || "(Nomzod belgilangan vaqtda javob bermadi)" }
    ];
    setTranscriptHistory(newHistory);
    setLiveTranscript('');

    if (selectedPart === 'part1') {
      if (p1Topic && p1Index + 1 < Math.min(p1Topic.questions.length, 4)) {
        const nextIdx = p1Index + 1;
        setP1Index(nextIdx);
        setCountdown(TIME_LIMITS.part1Question);
        speakText(p1Topic.questions[nextIdx], () => {
          setIsTimerRunning(true);
          startListening();
        });
      } else {
        finishAndEvaluate(newHistory, 'part1');
      }
    } else if (selectedPart === 'part2') {
      finishAndEvaluate(newHistory, 'part2');
    } else if (selectedPart === 'part3') {
      if (p3Topic && p3Index + 1 < Math.min(p3Topic.questions.length, 3)) {
        const nextIdx = p3Index + 1;
        setP3Index(nextIdx);
        setCountdown(TIME_LIMITS.part3Question);
        speakText(p3Topic.questions[nextIdx], () => {
          setIsTimerRunning(true);
          startListening();
        });
      } else {
        finishAndEvaluate(newHistory, 'part3');
      }
    }
  };

  // Full Mock Progression
  const handleFullMockStep = () => {
    if (mockPhase === 'p1') {
      const currentQ = p1Topic?.questions[mockP1Idx] || '';
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 1] ${currentQ}`, answer: liveTranscript.trim() || "(Part 1 javobi berilmadi)" }
      ];
      setTranscriptHistory(newHistory);
      setLiveTranscript('');

      if (p1Topic && mockP1Idx + 1 < 3) {
        const nextIdx = mockP1Idx + 1;
        setMockP1Idx(nextIdx);
        setCountdown(TIME_LIMITS.part1Question);
        speakText(p1Topic.questions[nextIdx], () => {
          setIsTimerRunning(true);
          startListening();
        });
      } else {
        // Transition to Part 2 prep
        setMockPhase('p2_prep');
        setCountdown(TIME_LIMITS.part2Prep);
        speakText(`Thank you. That is the end of Part 1. Now Part 2. You have one minute to prepare: ${p2Topic?.cueCard}`, () => {
          setIsTimerRunning(true);
        });
      }
    } else if (mockPhase === 'p2_speak') {
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 2 Cue Card] ${p2Topic?.cueCard}`, answer: liveTranscript.trim() || "(Part 2 nutqi berilmadi)" }
      ];
      setTranscriptHistory(newHistory);
      setLiveTranscript('');

      // Transition to Part 3
      setMockPhase('p3');
      setMockP3Idx(0);
      setCountdown(TIME_LIMITS.part3Question);
      speakText(`Thank you. Now let's move to Part 3. We will discuss ${p3Topic?.topic} in depth. ${p3Topic?.questions[0]}`, () => {
        setIsTimerRunning(true);
        startListening();
      });
    } else if (mockPhase === 'p3') {
      const currentQ = p3Topic?.questions[mockP3Idx] || '';
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 3] ${currentQ}`, answer: liveTranscript.trim() || "(Part 3 javobi berilmadi)" }
      ];
      setTranscriptHistory(newHistory);
      setLiveTranscript('');

      if (p3Topic && mockP3Idx + 1 < 3) {
        const nextIdx = mockP3Idx + 1;
        setMockP3Idx(nextIdx);
        setCountdown(TIME_LIMITS.part3Question);
        speakText(p3Topic.questions[nextIdx], () => {
          setIsTimerRunning(true);
          startListening();
        });
      } else {
        finishAndEvaluate(newHistory, 'full_mock');
      }
    }
  };

  // Evaluation & Result Saving
  const finishAndEvaluate = (
    history: { question: string; answer: string }[],
    evaluatedType: 'part1' | 'part2' | 'part3' | 'full_mock'
  ) => {
    setIsEvaluating(true);
    triggerHaptic('heavy');
    window.speechSynthesis?.cancel();

    setTimeout(() => {
      const evalResult = evaluateCandidateSpeech(history, evaluatedType);
      setFeedback(evalResult);
      setIsEvaluating(false);
      setStep('feedback');

      const now = new Date();
      const endTime = getFormattedTime();
      const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      const titleMap = {
        part1: 'IELTS Speaking: Part 1',
        part2: 'IELTS Speaking: Part 2 (Cue Card)',
        part3: 'IELTS Speaking: Part 3 (Munozara)',
        full_mock: 'IELTS Full Speaking Mock Test',
      };

      const topicName = evaluatedType === 'part1'
        ? (p1Topic?.topic || 'General')
        : evaluatedType === 'part2'
        ? (p2Topic?.topic || 'Cue Card')
        : evaluatedType === 'part3'
        ? (p3Topic?.topic || 'Discussion')
        : `${p1Topic?.topic} & ${p2Topic?.topic}`;

      const historyItem: TestResultItem = {
        id: `test_${Date.now()}`,
        date: dateStr,
        startTime: testStartTime || endTime,
        endTime,
        testType: evaluatedType === 'full_mock' ? 'speaking_full_mock' : `speaking_${evaluatedType}` as TestType,
        title: titleMap[evaluatedType],
        topic: topicName,
        overallBand: evalResult.overallBand,
        criteriaScores: {
          c1Name: 'Fluency & Coherence',
          c1Score: evalResult.fluencyScore,
          c2Name: 'Lexical Resource',
          c2Score: evalResult.lexicalScore,
          c3Name: 'Grammar Accuracy',
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

  const getPartBadgeLabel = () => {
    switch (selectedPart) {
      case 'part1': return 'Part 1';
      case 'part2': return 'Part 2';
      case 'part3': return 'Part 3';
      case 'full_mock': return 'Full Mock';
      default: return 'Speaking';
    }
  };

  // ══════════════════════════════════════════════════════════
  // ── SCREEN 1: PART SELECTION ──
  // ══════════════════════════════════════════════════════════
  if (step === 'part_select') {
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
              speechEnabled ? 'bg-purple-50 border-purple-200 text-[#7052ff]' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{speechEnabled ? "Examiner ovozi" : "Ovozsiz"}</span>
          </button>
        </div>

        {/* Examiner Banner */}
        <div
          className="rounded-[2.2rem] p-5 text-white shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 60%, #351e8c 100%)' }}
        >
          <div className="flex items-center space-x-3.5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#c4f82a] text-[#121124] flex items-center justify-center text-3xl shadow-lg shrink-0">
              👨‍🏫
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-base font-black text-white">Dr. Alistair Vance</h3>
                <span className="text-[9px] font-black bg-[#c4f82a] text-[#121124] px-1.5 py-0.5 rounded">IELTS 9.0</span>
              </div>
              <p className="text-[11px] text-purple-200/90 font-medium mt-0.5">
                10 marta 9.0 olgan, 10 yillik rasmiy Cambridge/IELTS eksperti
              </p>
            </div>
          </div>
          <p className="text-xs text-purple-200/80 mt-3 relative z-10 border-t border-white/10 pt-2.5 leading-relaxed">
            "Xush kelibsiz! Imtihon qat'iy vaqt mezonlari asosida o'tadi. Gapirishingiz bilan taymer ishlaydi va vaqt tugasa darhol keyingisiga o'tiladi."
          </p>
        </div>

        {/* Part Selection Buttons */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Imtihon qismini tanlang:
          </h4>

          {/* Part 1 */}
          <div
            onClick={() => handleChoosePart('part1')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7052ff] flex items-center justify-center font-black text-sm">
                P1
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 1: Kirish & Kundalik mavzular</p>
                <p className="text-[11px] text-slate-500">Har bir savolga 40 soniya · Ovozli nutq</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#7052ff]">Tanlash →</span>
          </div>

          {/* Part 2 */}
          <div
            onClick={() => handleChoosePart('part2')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">
                P2
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 2: Cue Card (Yakka nutq)</p>
                <p className="text-[11px] text-slate-500">1 daqiqa tayyorgarlik · 2 daqiqa nutq</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600">Tanlash →</span>
          </div>

          {/* Part 3 */}
          <div
            onClick={() => handleChoosePart('part3')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">
                P3
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 3: Chuqur tahliliy muhokama</p>
                <p className="text-[11px] text-slate-500">Har bir savolga 55 soniya · Tahlil</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Tanlash →</span>
          </div>

          {/* Full Speaking Mock */}
          <div
            onClick={() => handleChoosePart('full_mock')}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#110e28] to-[#261763] text-white border border-purple-500/30 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-sm shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <p className="text-sm font-black text-white">Full Speaking Mock (Part 1 + 2 + 3)</p>
                  <span className="text-[9px] font-black bg-[#c4f82a] text-[#121124] px-1.5 py-0.5 rounded">To'liq</span>
                </div>
                <p className="text-[11px] text-purple-200/80">
                  11-14 daqiqalik rasmiy simulyatsiya · Avtomatik vaqt nazorati
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#c4f82a] shrink-0 pl-2">Tanlash →</span>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── SCREEN 2: TOPIC DOMAIN SELECTOR (Foydalanuvchi talabi) ──
  // ══════════════════════════════════════════════════════════
  if (step === 'topic_select') {
    return (
      <div className="p-5 space-y-5 animate-in fade-in duration-300">
        <button
          onClick={() => setStep('part_select')}
          className="flex items-center space-x-1.5 text-xs font-black text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          <span>Part tanloviga qaytish</span>
        </button>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-md">
              {getPartBadgeLabel()}
            </span>
            <h3 className="text-base font-black text-slate-900">Mavzular bo'limini tanlang:</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Qaysi soha bo'yicha savollarga javob bermoqchisiz? Tanlab "Boshlash"ni bosing.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="space-y-2.5">
          {TOPIC_DOMAINS.map((dom) => (
            <div
              key={dom.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedDomainId(dom.id);
              }}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedDomainId === dom.id
                  ? 'border-[#7052ff] bg-indigo-50/60 ring-2 ring-[#7052ff]/20 font-bold'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{dom.icon}</span>
                <span className="text-xs font-bold text-slate-800">{dom.name}</span>
              </div>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedDomainId === dom.id
                  ? 'border-[#7052ff] bg-[#7052ff] text-white text-xs'
                  : 'border-slate-300'
              }`}>
                {selectedDomainId === dom.id && '✓'}
              </span>
            </div>
          ))}
        </div>

        {/* Warning Note before starting */}
        <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 flex items-start space-x-2.5 text-[11px] text-amber-900 leading-relaxed">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Eslatma:</strong> "Boshlash" bosilgandan so'ng savolni yoki mavzuni almashtirib bo'lmaydi. Savol yangragach taymer boshlanadi va vaqt tugasa darhol keyingisiga o'tadi.
          </p>
        </div>

        {/* Big Start Exam Button */}
        <button
          onClick={handleStartExam}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <span>Boshlash (Exam Locked)</span>
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── SCREEN 3: ACTIVE EXAM SESSION (LOCKED - NO TOPIC CHANGE, NO TYPING) ──
  // ══════════════════════════════════════════════════════════
  if (step === 'active_test') {
    const isP2Prep = (selectedPart === 'part2' && mockPhase === 'p2_prep') || (selectedPart === 'full_mock' && mockPhase === 'p2_prep');
    const isWarningTime = countdown <= 10;

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
                  Agar hozir chiqib ketsangiz, topshirilgan javoblaringiz va test natijangiz saqlanmaydi.
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
                    setStep('part_select');
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
            <div className="bg-[#110e28] border border-white/10 px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-sm h-7" title="Jonli ovoz to'lqini">
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-1 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-2 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-3 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-4 inline-block" />
              <span className="w-1 bg-[#c4f82a] rounded-full eng-eq-5 inline-block" />
            </div>

            <span className="text-[10px] font-black uppercase bg-[#7052ff] text-white px-2.5 py-0.5 rounded-full">
              {getPartBadgeLabel()}: {selectedPart === 'full_mock' ? mockPhase.toUpperCase() : 'LOCKED'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              {testStartTime}
            </span>
          </div>
        </div>

        {/* Strict Countdown Progress Timer Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Clock size={14} className={isWarningTime ? 'text-rose-500 animate-spin' : 'text-[#7052ff]'} />
              <span>{isP2Prep ? "Tayyorgarlik vaqti (1 min)" : "Javob berish vaqti:"}</span>
            </span>
            <span className={`text-xl font-mono font-black ${isWarningTime ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
              00:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isWarningTime ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${(countdown / (isP2Prep ? 60 : selectedPart === 'part2' || mockPhase === 'p2_speak' ? 120 : selectedPart === 'part3' || mockPhase === 'p3' ? 55 : 40)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Part 1 Question Card */}
        {(selectedPart === 'part1' || (selectedPart === 'full_mock' && mockPhase === 'p1')) && p1Topic && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-2">
            <span className="text-[10px] font-black uppercase text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-md">
              Mavzu: {p1Topic.topic}
            </span>
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-black text-slate-900 mt-1 leading-snug">
                "{p1Topic.questions[selectedPart === 'full_mock' ? mockP1Idx : p1Index]}"
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(p1Topic.questions[selectedPart === 'full_mock' ? mockP1Idx : p1Index]);
                }}
                className="shrink-0 p-2 rounded-xl bg-purple-50 text-[#7052ff] hover:bg-purple-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Savolni qayta eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Savol {(selectedPart === 'full_mock' ? mockP1Idx : p1Index) + 1} / {selectedPart === 'full_mock' ? 3 : Math.min(p1Topic.questions.length, 4)}
            </p>
          </div>
        )}

        {/* Part 2 Cue Card */}
        {(selectedPart === 'part2' || (selectedPart === 'full_mock' && (mockPhase === 'p2_prep' || mockPhase === 'p2_speak'))) && p2Topic && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-amber-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Cue Card #{p2Topic.topicNumber}
              </span>
              <span className="text-xs font-bold text-amber-600">
                {isP2Prep ? "Qoralama yozish (Prep)" : "Nutq so'zlash (Speaking)"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {p2Topic.cueCard}
              </h3>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(p2Topic.cueCard);
                }}
                className="shrink-0 p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Mavzuni qayta eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">You should say:</p>
              {p2Topic.bulletPoints.map((b, i) => (
                <p key={i}>• {b}</p>
              ))}
            </div>

            {isP2Prep && (
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Tayyorgarlik uchun qisqa qoralamalar (notes)..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-amber-400 resize-none"
              />
            )}
          </div>
        )}

        {/* Part 3 Question Card */}
        {(selectedPart === 'part3' || (selectedPart === 'full_mock' && mockPhase === 'p3')) && p3Topic && (
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Mavzu: {p3Topic.topic}
            </span>
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-black text-slate-900 mt-1 leading-snug">
                "{p3Topic.questions[selectedPart === 'full_mock' ? mockP3Idx : p3Index]}"
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  speakText(p3Topic.questions[selectedPart === 'full_mock' ? mockP3Idx : p3Index]);
                }}
                className="shrink-0 p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                title="Savolni qayta eshitish"
              >
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Savol {(selectedPart === 'full_mock' ? mockP3Idx : p3Index) + 1} / {selectedPart === 'full_mock' ? 3 : Math.min(p3Topic.questions.length, 3)}
            </p>
          </div>
        )}

        {/* 🎙️ PURE VOICE SPEECH CONTAINER (Yozish olib tashlandi, faqat nutq va jonli transkripsiya) */}
        {!isP2Prep && (
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
                      className="text-[#7052ff] hover:underline"
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
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-[#7052ff] resize-none"
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
                      className="text-[10px] font-bold text-[#7052ff] hover:underline"
                    >
                      ✍️ Tahrirlash / Yozish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-1">
                  <p className="text-xs text-slate-400 italic">
                    Mikrofon orqali gapiring. Aytgan so'zlaringiz va talaffuzingiz shu yerda jonli aks etadi...
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsManualInput(true)}
                    className="text-[10px] font-bold text-slate-500 hover:text-[#7052ff] underline pt-1 block mx-auto"
                  >
                    Mikrofon ishlamasa, yozish uchun bosing ✍️
                  </button>
                </div>
              )}

              {/* Real-time wave indicator when recording */}
              {isRecording && !isManualInput && (
                <div className="flex items-center justify-center space-x-1 pt-2">
                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="w-1 h-5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-6 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" />
                </div>
              )}
            </div>

            {/* Voice Controls: Restart mic or Finish early */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => {
                  if (isRecording) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={`flex-1 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
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
                <span>Javobni yakunlash</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── SCREEN 4: EVALUATION FEEDBACK (PART 1 • BAND 7.5) ──
  // ══════════════════════════════════════════════════════════
  if (step === 'feedback' && feedback) {
    const partLabel = getPartBadgeLabel();
    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-300">
        <button
          onClick={() => setStep('part_select')}
          className="flex items-center space-x-1.5 text-xs font-black text-[#7052ff] hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Boshqa partni tanlash</span>
        </button>

        {/* Examiner Band Score Card (Part 1 • Band 7.5) */}
        <div
          className="rounded-[2.2rem] p-6 text-white text-center shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 50%, #351e8c 100%)' }}
        >
          <div className="inline-flex items-center space-x-1.5 bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Award size={12} />
            <span>IELTS [{partLabel.toUpperCase()}] EXAMINER BAHOSI</span>
          </div>

          <h3 className="text-3xl font-black text-white my-1 tracking-tight">
            {partLabel} • Band {feedback.overallBand.toFixed(1)}
          </h3>
          <p className="text-[11px] text-purple-200/80">
            Dr. Alistair Vance (10x Band 9.0 Cambridge Expert) tahlili
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-1 text-center">
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-[#c4f82a]">{feedback.fluencyScore.toFixed(1)}</p>
              <p className="text-[9px] text-purple-200">Fluency</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-amber-300">{feedback.lexicalScore.toFixed(1)}</p>
              <p className="text-[9px] text-purple-200">Lexical</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-emerald-300">{feedback.grammarScore.toFixed(1)}</p>
              <p className="text-[9px] text-purple-200">Grammar</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-pink-300">{feedback.pronunciationScore.toFixed(1)}</p>
              <p className="text-[9px] text-purple-200">Pronun.</p>
            </div>
          </div>
        </div>

        {/* Examiner Tavsiyalari */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Examiner Tavsiyalari (Keyingi Band uchun)
          </h4>
          <div className="space-y-2">
            {feedback.improvements.map((imp, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[#7052ff] font-bold">#{idx + 1}</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>

          {feedback.strengths.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
                <CheckCircle2 size={13} />
                <span>Namoyon bo'lgan kuchli jihatlar:</span>
              </h5>
              {feedback.strengths.map((s, idx) => (
                <p key={idx} className="text-xs text-slate-600 pl-4 border-l-2 border-emerald-400">
                  {s}
                </p>
              ))}
            </div>
          )}

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 italic">
              ✓ Natija avtomatik ravishda «Topshirilgan sinovlar tarixi»ga saqlandi.
            </p>
          </div>
        </div>

        <button
          onClick={() => setStep('part_select')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <RotateCcw size={18} />
          <span>Yana qayta mashq qilish</span>
        </button>
      </div>
    );
  }

  return null;
};
