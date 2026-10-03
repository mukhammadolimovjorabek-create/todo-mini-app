import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Clock, CheckCircle2, RotateCcw, Award, ChevronRight, Sparkles } from 'lucide-react';
import { getRandomPart1Topic, getRandomPart2Topic, getRandomPart3Topic, type Part1Topic, type Part2CueCard, type Part3Topic } from '../data/speakingBank';
import { getSeenQuestions, markQuestionSeen, saveTestResult } from '../utils/storage';
import { evaluateCandidateSpeech, type SpeechEvaluationResult } from '../utils/ieltsScoring';
import { triggerHaptic } from '../../utils/telegram';
import type { TestResultItem, TestType } from '../types';

interface Props {
  onBack: () => void;
  userName: string;
}

type PartSelection = 'part1' | 'part2' | 'part3' | 'full_mock' | null;
type MockPhase = 'p1' | 'p2_prep' | 'p2_speak' | 'p3';

export const AISpeakingView: React.FC<Props> = ({ onBack, userName }) => {
  const [selectedPart, setSelectedPart] = useState<PartSelection>(null);
  
  // Audio SpeechSynthesis (Examiner voice)
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Timestamps for test duration tracking (e.g., 10:45 dan 11:05 gacha)
  const [testStartTime, setTestStartTime] = useState<string>('');

  // Part 1 state
  const [p1Topic, setP1Topic] = useState<Part1Topic | null>(null);
  const [p1Index, setP1Index] = useState(0);

  // Part 2 state
  const [p2Topic, setP2Topic] = useState<Part2CueCard | null>(null);
  const [prepSeconds, setPrepSeconds] = useState(60);
  const [isPrepping, setIsPrepping] = useState(false);
  const [speakingSeconds, setSpeakingSeconds] = useState(120);
  const [isSpeakingPart2, setIsSpeakingPart2] = useState(false);
  const [prepNotes, setPrepNotes] = useState('');

  // Part 3 state
  const [p3Topic, setP3Topic] = useState<Part3Topic | null>(null);
  const [p3Index, setP3Index] = useState(0);

  // Full Mock State
  const [mockPhase, setMockPhase] = useState<MockPhase>('p1');
  const [mockP1Idx, setMockP1Idx] = useState(0);
  const [mockP3Idx, setMockP3Idx] = useState(0);

  // Common conversation state
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<SpeechEvaluationResult | null>(null);

  // Web Speech recognition (if browser supports it)
  const recognitionRef = useRef<any>(null);

  // Format time HH:MM
  const getFormattedTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Speak function (British IELTS Examiner voice)
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Start Part selection
  const handleSelectPart = (part: 'part1' | 'part2' | 'part3' | 'full_mock') => {
    triggerHaptic('medium');
    setSelectedPart(part);
    setTranscriptHistory([]);
    setFeedback(null);
    setCandidateAnswer('');
    setTestStartTime(getFormattedTime());

    const seen = getSeenQuestions();

    if (part === 'part1') {
      const topic = getRandomPart1Topic(seen);
      markQuestionSeen(topic.topic);
      setP1Topic(topic);
      setP1Index(0);
      if (topic.questions[0]) {
        setTimeout(() => speakText(`Hello ${userName}. Let's begin Part 1. We will talk about ${topic.topic}. First question: ${topic.questions[0]}`), 400);
      }
    } else if (part === 'part2') {
      const topic = getRandomPart2Topic(seen);
      markQuestionSeen(topic.topic);
      setP2Topic(topic);
      setPrepSeconds(60);
      setIsPrepping(true);
      setSpeakingSeconds(120);
      setIsSpeakingPart2(false);
      setPrepNotes('');
      setTimeout(() => speakText(`In this part, I'm going to give you a topic. You have one minute to prepare. Here is your topic: ${topic.cueCard}`), 400);
    } else if (part === 'part3') {
      const topic = getRandomPart3Topic(seen);
      markQuestionSeen(topic.topic);
      setP3Topic(topic);
      setP3Index(0);
      if (topic.questions[0]) {
        setTimeout(() => speakText(`We are now in Part 3. Let's discuss ${topic.topic} in more depth. ${topic.questions[0]}`), 400);
      }
    } else if (part === 'full_mock') {
      // Full Mock: Pick unseen topics for all 3 parts
      const p1 = getRandomPart1Topic(seen);
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
      setPrepSeconds(60);
      setSpeakingSeconds(120);
      setPrepNotes('');

      setTimeout(() => {
        speakText(`Welcome ${userName} to your Full IELTS Speaking Mock Test. This will cover Part 1, Part 2, and Part 3. Let's start Part 1 with ${p1.topic}. ${p1.questions[0]}`);
      }, 400);
    }
  };

  // Part 2 Prep Timer
  useEffect(() => {
    let timer: any = null;
    if (isPrepping && prepSeconds > 0) {
      timer = setInterval(() => {
        setPrepSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isPrepping && prepSeconds === 0) {
      setIsPrepping(false);
      setIsSpeakingPart2(true);
      setSpeakingSeconds(120);
      triggerHaptic('heavy');
      speakText("Your preparation time is up. Please start speaking now. You have up to two minutes.");
    }
    return () => clearInterval(timer);
  }, [isPrepping, prepSeconds]);

  // Part 2 Speaking Timer
  useEffect(() => {
    let timer: any = null;
    if (isSpeakingPart2 && speakingSeconds > 0) {
      timer = setInterval(() => {
        setSpeakingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isSpeakingPart2 && speakingSeconds === 0) {
      setIsSpeakingPart2(false);
      triggerHaptic('heavy');
      speakText("Thank you. That is two minutes. We will now move on.");
    }
    return () => clearInterval(timer);
  }, [isSpeakingPart2, speakingSeconds]);

  // Speech Recognition (Microphone)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      triggerHaptic('light');
    } else {
      triggerHaptic('medium');
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Brauzeringiz ovozli tanib olishni qo'llab-quvvatlamaydi. Iltimos, javobingizni quyidagi maydonga yozing.");
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let full = '';
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript + ' ';
          }
          setCandidateAnswer(full.trim());
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Next Question or Transition
  const handleNextQuestion = () => {
    triggerHaptic('light');
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    if (selectedPart === 'full_mock') {
      handleFullMockProgression();
      return;
    }

    const currentQ = selectedPart === 'part1'
      ? (p1Topic?.questions[p1Index] || '')
      : selectedPart === 'part2'
      ? (p2Topic?.cueCard || '')
      : (p3Topic?.questions[p3Index] || '');

    const newHistory = [
      ...transcriptHistory,
      { question: currentQ, answer: candidateAnswer.trim() || "(Audio nutq javobi qabul qilindi)" }
    ];
    setTranscriptHistory(newHistory);
    setCandidateAnswer('');

    if (selectedPart === 'part1') {
      if (p1Topic && p1Index + 1 < Math.min(p1Topic.questions.length, 4)) {
        const nextIdx = p1Index + 1;
        setP1Index(nextIdx);
        speakText(p1Topic.questions[nextIdx]);
      } else {
        finishAndEvaluate(newHistory, 'part1');
      }
    } else if (selectedPart === 'part2') {
      finishAndEvaluate(newHistory, 'part2');
    } else if (selectedPart === 'part3') {
      if (p3Topic && p3Index + 1 < Math.min(p3Topic.questions.length, 3)) {
        const nextIdx = p3Index + 1;
        setP3Index(nextIdx);
        speakText(p3Topic.questions[nextIdx]);
      } else {
        finishAndEvaluate(newHistory, 'part3');
      }
    }
  };

  // Full Mock Progression handler
  const handleFullMockProgression = () => {
    if (mockPhase === 'p1') {
      const currentQ = p1Topic?.questions[mockP1Idx] || '';
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 1] ${currentQ}`, answer: candidateAnswer.trim() || "(Part 1 javobi)" }
      ];
      setTranscriptHistory(newHistory);
      setCandidateAnswer('');

      if (p1Topic && mockP1Idx + 1 < 3) {
        const nextIdx = mockP1Idx + 1;
        setMockP1Idx(nextIdx);
        speakText(p1Topic.questions[nextIdx]);
      } else {
        // Transition to Part 2
        setMockPhase('p2_prep');
        setPrepSeconds(60);
        setIsPrepping(true);
        triggerHaptic('heavy');
        speakText(`Thank you. That is the end of Part 1. Now, we will begin Part 2. You have one minute to prepare. Here is your Cue Card: ${p2Topic?.cueCard}`);
      }
    } else if (mockPhase === 'p2_prep' || mockPhase === 'p2_speak') {
      // Completed Part 2
      setIsPrepping(false);
      setIsSpeakingPart2(false);
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 2 Cue Card] ${p2Topic?.cueCard}`, answer: candidateAnswer.trim() || "(Part 2 nutq monologi)" }
      ];
      setTranscriptHistory(newHistory);
      setCandidateAnswer('');

      // Transition to Part 3
      setMockPhase('p3');
      setMockP3Idx(0);
      triggerHaptic('heavy');
      speakText(`Thank you. Now let's move to Part 3. We will discuss ${p3Topic?.topic} in more depth. First question: ${p3Topic?.questions[0]}`);
    } else if (mockPhase === 'p3') {
      const currentQ = p3Topic?.questions[mockP3Idx] || '';
      const newHistory = [
        ...transcriptHistory,
        { question: `[Part 3] ${currentQ}`, answer: candidateAnswer.trim() || "(Part 3 javobi)" }
      ];
      setTranscriptHistory(newHistory);
      setCandidateAnswer('');

      if (p3Topic && mockP3Idx + 1 < 3) {
        const nextIdx = mockP3Idx + 1;
        setMockP3Idx(nextIdx);
        speakText(p3Topic.questions[nextIdx]);
      } else {
        // Complete Full Mock!
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
      // Evaluate using the linguistic IELTS engine
      const evalResult = evaluateCandidateSpeech(history, evaluatedType);
      setFeedback(evalResult);
      setIsEvaluating(false);

      // Save to Test Results History
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
    }, 1600);
  };

  // Get active part display name for feedback badge (1-rasm requirement)
  const getPartBadgeLabel = () => {
    switch (selectedPart) {
      case 'part1': return 'Part 1';
      case 'part2': return 'Part 2';
      case 'part3': return 'Part 3';
      case 'full_mock': return 'Full Mock';
      default: return 'Speaking';
    }
  };

  // ── Render Result Feedback Screen ──
  if (feedback) {
    const partLabel = getPartBadgeLabel();
    return (
      <div className="p-5 space-y-4 animate-in fade-in duration-300">
        <button
          onClick={() => setSelectedPart(null)}
          className="flex items-center space-x-1.5 text-xs font-black text-[#7052ff] hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Boshqa partni tanlash</span>
        </button>

        {/* Examiner Band Score Card (1-rasm: Qaysi part ekanligi aniq ko'rsatiladi) */}
        <div
          className="rounded-[2.2rem] p-6 text-white text-center shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 50%, #351e8c 100%)' }}
        >
          <div className="inline-flex items-center space-x-1.5 bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Award size={12} />
            <span>IELTS [{partLabel.toUpperCase()}] EXAMINER BAHOSI</span>
          </div>

          {/* 1-rasm talabi: Part 1 • Band 7.5 ko'rinishida */}
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

          {/* Kuchli tomonlar */}
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
          onClick={() => handleSelectPart(selectedPart || 'part1')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <RotateCcw size={18} />
          <span>Yana qayta mashq qilish</span>
        </button>
      </div>
    );
  }

  // ── Part Selector Screen ──
  if (!selectedPart) {
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
          
          {/* Audio toggle */}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
              speechEnabled ? 'bg-purple-50 border-purple-200 text-[#7052ff]' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{speechEnabled ? "Examiner ovozi yoqiq" : "Ovozsiz"}</span>
          </button>
        </div>

        {/* AI Examiner Persona Card */}
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
                10 marta 9.0 olgan, 10 yillik xalqaro Cambridge/IELTS eksperti
              </p>
            </div>
          </div>
          <p className="text-xs text-purple-200/80 mt-3 relative z-10 border-t border-white/10 pt-2.5 leading-relaxed">
            "Salom {userName}! Siz bilan rasmiy IELTS Speaking mezonlari (FC, LR, GRA, PR) asosida xolis va aniq mashq qilamiz."
          </p>
        </div>

        {/* Part Selection Buttons */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Qaysi Part bo'yicha mashq qilmoqchisiz?
          </h4>

          {/* Part 1 */}
          <div
            onClick={() => handleSelectPart('part1')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7052ff] flex items-center justify-center font-black text-sm">
                P1
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 1: Kirish & Kundalik mavzular</p>
                <p className="text-[11px] text-slate-500">4-5 ta savol · 57 ta mavzu banki</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#7052ff]">Boshlash →</span>
          </div>

          {/* Part 2 */}
          <div
            onClick={() => handleSelectPart('part2')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">
                P2
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 2: Cue Card (Yakka nutq)</p>
                <p className="text-[11px] text-slate-500">1 min tayyorlanish · 2 min nutq</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600">Boshlash →</span>
          </div>

          {/* Part 3 */}
          <div
            onClick={() => handleSelectPart('part3')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm">
                P3
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 3: Chuqur tahliliy muhokama</p>
                <p className="text-[11px] text-slate-500">Mavhum va jiddiy ijtimoiy savollar</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600">Boshlash →</span>
          </div>

          {/* 🌟 YANGI BO'LIM: Part 3 tagidagi FULL SPEAKING MOCK (Foydalanuvchi talabi) */}
          <div
            onClick={() => handleSelectPart('full_mock')}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#110e28] to-[#261763] text-white border border-purple-500/30 shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between group relative overflow-hidden"
          >
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#c4f82a] text-[#121124] flex items-center justify-center font-black text-sm shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <p className="text-sm font-black text-white">Full Speaking Mock (Part 1 + 2 + 3)</p>
                  <span className="text-[9px] font-black bg-[#c4f82a] text-[#121124] px-1.5 py-0.5 rounded">To'liq</span>
                </div>
                <p className="text-[11px] text-purple-200/80">
                  11-14 daqiqalik to'liq imtihon simulyatsiyasi · Qaytarilmas yangi savollar
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#c4f82a] shrink-0 pl-2">Topshirish →</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Session Screen ──
  return (
    <div className="p-5 space-y-4 animate-in fade-in duration-300">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            window.speechSynthesis?.cancel();
            setSelectedPart(null);
          }}
          className="flex items-center space-x-1 text-xs font-black text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          <span>To'xtatish</span>
        </button>

        <div className="flex items-center space-x-2">
          {selectedPart === 'full_mock' && (
            <span className="text-[10px] font-black uppercase bg-[#7052ff] text-white px-2 py-0.5 rounded-full">
              Full Mock: {mockPhase === 'p1' ? 'Part 1' : mockPhase.startsWith('p2') ? 'Part 2' : 'Part 3'}
            </span>
          )}
          <span className="text-xs font-bold text-slate-400">
            Boshlandi: {testStartTime}
          </span>
        </div>
      </div>

      {/* Part 1 Active Screen */}
      {(selectedPart === 'part1' || (selectedPart === 'full_mock' && mockPhase === 'p1')) && p1Topic && (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <span className="text-[10px] font-black uppercase text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-md">
              Mavzu: {p1Topic.topic}
            </span>
            <p className="text-base font-black text-slate-900 mt-2 leading-snug">
              {p1Topic.questions[selectedPart === 'full_mock' ? mockP1Idx : p1Index]}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Savol {(selectedPart === 'full_mock' ? mockP1Idx : p1Index) + 1} / {selectedPart === 'full_mock' ? 3 : Math.min(p1Topic.questions.length, 4)}
            </p>
          </div>
        </div>
      )}

      {/* Part 2 Active Screen */}
      {(selectedPart === 'part2' || (selectedPart === 'full_mock' && mockPhase.startsWith('p2'))) && p2Topic && (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Cue Card #{p2Topic.topicNumber}
              </span>
              {/* Prep or Speaking Timer */}
              {isPrepping && (
                <span className="text-xs font-black text-amber-600 bg-amber-100/80 px-2.5 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                  <Clock size={12} />
                  <span>Tayyorlanish: {prepSeconds}s</span>
                </span>
              )}
              {isSpeakingPart2 && (
                <span className="text-xs font-black text-emerald-600 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                  <Clock size={12} />
                  <span>Nutq vaqti: {speakingSeconds}s</span>
                </span>
              )}
            </div>

            <h3 className="text-base font-black text-slate-900 mt-1 leading-snug">
              {p2Topic.cueCard}
            </h3>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">You should say:</p>
              {p2Topic.bulletPoints.map((b, i) => (
                <p key={i}>• {b}</p>
              ))}
            </div>

            {/* Note taking during prep */}
            {isPrepping && (
              <div className="mt-3">
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Tayyorgarlik uchun qisqa qoralamalar (notes)..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-amber-400 resize-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Part 3 Active Screen */}
      {(selectedPart === 'part3' || (selectedPart === 'full_mock' && mockPhase === 'p3')) && p3Topic && (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Mavzu: {p3Topic.topic}
            </span>
            <p className="text-base font-black text-slate-900 mt-2 leading-snug">
              {p3Topic.questions[selectedPart === 'full_mock' ? mockP3Idx : p3Index]}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Savol {(selectedPart === 'full_mock' ? mockP3Idx : p3Index) + 1} / {selectedPart === 'full_mock' ? 3 : Math.min(p3Topic.questions.length, 3)}
            </p>
          </div>
        </div>
      )}

      {/* Candidate Response Card with Voice Recording and Text Editor */}
      <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700">Sizning javobingiz:</span>
          {isRecording && (
            <span className="text-[10px] font-black text-rose-500 animate-pulse flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Ovoz yozilmoqda...</span>
            </span>
          )}
        </div>

        <textarea
          value={candidateAnswer}
          onChange={(e) => setCandidateAnswer(e.target.value)}
          placeholder="Mikrofonni bosib gapiring yoki javobingizni shu yerga yozing..."
          rows={3}
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-[#7052ff] resize-none"
        />

        {/* Action Controls */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={toggleRecording}
            className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isRecording ? "Yozishni to'xtatish" : "Ovoz bilan gapirish"}</span>
          </button>

          <button
            disabled={isEvaluating}
            onClick={handleNextQuestion}
            className="flex-1 py-3 rounded-xl bg-[#7052ff] text-white font-black text-xs flex items-center justify-center space-x-1.5 hover:bg-[#5b3ce0] transition-all disabled:opacity-50"
          >
            <span>
              {selectedPart === 'full_mock'
                ? mockPhase === 'p3' && mockP3Idx >= 2
                  ? "Testni yakunlash"
                  : "Keyingisi"
                : "Keyingi savol"}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
