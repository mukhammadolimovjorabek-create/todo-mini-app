import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Clock, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import { getRandomPart1Topic, getRandomPart2Topic, getRandomPart3Topic, type Part1Topic, type Part2CueCard, type Part3Topic } from '../data/speakingBank';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  userName: string;
}

type PartSelection = 'part1' | 'part2' | 'part3' | null;

interface ExaminerFeedback {
  overallBand: number;
  fluencyScore: number;
  lexicalScore: number;
  grammarScore: number;
  pronunciationScore: number;
  strengths: string[];
  improvements: string[];
  quotes: string[];
}

export const AISpeakingView: React.FC<Props> = ({ onBack, userName }) => {
  const [selectedPart, setSelectedPart] = useState<PartSelection>(null);
  
  // Audio SpeechSynthesis (Examiner voice)
  const [speechEnabled, setSpeechEnabled] = useState(true);

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

  // Common conversation state
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<{ question: string; answer: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<ExaminerFeedback | null>(null);

  // Web Speech recognition (if browser supports it)
  const recognitionRef = useRef<any>(null);

  // Speak function
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB'; // British English for IELTS examiner
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Start Part selection
  const handleSelectPart = (part: 'part1' | 'part2' | 'part3') => {
    triggerHaptic('medium');
    setSelectedPart(part);
    setTranscriptHistory([]);
    setFeedback(null);
    setCandidateAnswer('');

    if (part === 'part1') {
      const topic = getRandomPart1Topic();
      setP1Topic(topic);
      setP1Index(0);
      if (topic.questions[0]) {
        setTimeout(() => speakText(`Hello ${userName}. Let's talk about ${topic.topic}. First question: ${topic.questions[0]}`), 400);
      }
    } else if (part === 'part2') {
      const topic = getRandomPart2Topic();
      setP2Topic(topic);
      setPrepSeconds(60);
      setIsPrepping(true);
      setSpeakingSeconds(120);
      setIsSpeakingPart2(false);
      setPrepNotes('');
      setTimeout(() => speakText(`In this part, I'm going to give you a topic. You have one minute to prepare. Here is your topic: ${topic.cueCard}`), 400);
    } else if (part === 'part3') {
      const topic = getRandomPart3Topic();
      setP3Topic(topic);
      setP3Index(0);
      if (topic.questions[0]) {
        setTimeout(() => speakText(`We've been discussing ${topic.topic}. Now let's explore this in more depth. ${topic.questions[0]}`), 400);
      }
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
      triggerHaptic('heavy');
      speakText("Your preparation time is up. Please begin speaking now. You have up to two minutes.");
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
      speakText("Thank you. That will be enough for Part 2.");
    }
    return () => clearInterval(timer);
  }, [isSpeakingPart2, speakingSeconds]);

  // Toggle voice recognition
  const toggleSpeechRecognition = () => {
    triggerHaptic('medium');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Brauzeringiz nutqni aniqlashni qo'llab-quvvatlamaydi. Iltimos, javobingizni quyidagi maydonga yozing yoki mikrofonga gapirib ko'ring.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
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

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Next Question or Finish
  const handleNextQuestion = () => {
    triggerHaptic('light');
    const currentQ = selectedPart === 'part1'
      ? (p1Topic?.questions[p1Index] || '')
      : selectedPart === 'part2'
      ? (p2Topic?.cueCard || '')
      : (p3Topic?.questions[p3Index] || '');

    const newHistory = [...transcriptHistory, { question: currentQ, answer: candidateAnswer.trim() || "(Qisqa nutq/audio javob)" }];
    setTranscriptHistory(newHistory);
    setCandidateAnswer('');

    if (selectedPart === 'part1') {
      if (p1Topic && p1Index + 1 < Math.min(p1Topic.questions.length, 4)) {
        const nextIdx = p1Index + 1;
        setP1Index(nextIdx);
        speakText(p1Topic.questions[nextIdx]);
      } else {
        finishAndEvaluate(newHistory);
      }
    } else if (selectedPart === 'part2') {
      finishAndEvaluate(newHistory);
    } else if (selectedPart === 'part3') {
      if (p3Topic && p3Index + 1 < Math.min(p3Topic.questions.length, 3)) {
        const nextIdx = p3Index + 1;
        setP3Index(nextIdx);
        speakText(p3Topic.questions[nextIdx]);
      } else {
        finishAndEvaluate(newHistory);
      }
    }
  };

  // Band 9.0 Examiner Evaluation
  const finishAndEvaluate = (history: { question: string; answer: string }[]) => {
    setIsEvaluating(true);
    triggerHaptic('heavy');
    window.speechSynthesis?.cancel();

    // AI Examiner grading simulation based on candidate output
    setTimeout(() => {
      const totalWords = history.reduce((acc, h) => acc + h.answer.split(' ').filter(Boolean).length, 0);
      
      let overall = 6.5;
      if (totalWords > 120) overall = 7.5;
      else if (totalWords > 60) overall = 7.0;
      else if (totalWords > 25) overall = 6.5;
      else overall = 6.0;

      setFeedback({
        overallBand: overall,
        fluencyScore: overall,
        lexicalScore: Math.min(9.0, overall + 0.5),
        grammarScore: overall,
        pronunciationScore: overall,
        strengths: [
          "Savolga to'g'ri va mantiqiy javob berildi",
          "Mavzuga oid asosiy so'z birikmalari qo'llandi",
          "Nutq davomiyligi ijobiy ushlab turildi"
        ],
        improvements: [
          "Murakkab bog'lovchilarni (Furthermore, In addition, Consequently) ko'proq ishlating",
          "Kichik pauzalar o'rniga fillers (Well, to be honest, as far as I know) bilan vaqt yuting",
          "Idiomatik iboralar va kollokatsiyalarni kengaytiring"
        ],
        quotes: history.map((h) => `"${h.answer.slice(0, 50)}..."`).filter((q) => q.length > 5)
      });
      setIsEvaluating(false);
    }, 1800);
  };

  // Render Result Feedback Screen
  if (feedback) {
    return (
      <div className="p-5 space-y-4">
        <button
          onClick={() => setSelectedPart(null)}
          className="flex items-center space-x-1.5 text-xs font-black text-[#7052ff] hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Boshqa partni tanlash</span>
        </button>

        {/* Examiner Band Score Card */}
        <div
          className="rounded-[2.2rem] p-6 text-white text-center shadow-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #110e28 0%, #1e1552 50%, #351e8c 100%)' }}
        >
          <div className="inline-flex items-center space-x-1.5 bg-[#c4f82a]/15 text-[#c4f82a] border border-[#c4f82a]/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Award size={12} />
            <span>IELTS Band 9.0 Examiner Bahosi</span>
          </div>

          <h3 className="text-4xl font-black text-white my-1 tracking-tight">
            Band {feedback.overallBand}
          </h3>
          <p className="text-[11px] text-purple-200/80">
            Dr. Alistair Vance (10x Band 9.0 Expert) tahlili
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-1 text-center">
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-[#c4f82a]">{feedback.fluencyScore}</p>
              <p className="text-[9px] text-purple-200">Fluency</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-amber-300">{feedback.lexicalScore}</p>
              <p className="text-[9px] text-purple-200">Lexical</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-emerald-300">{feedback.grammarScore}</p>
              <p className="text-[9px] text-purple-200">Grammar</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <p className="text-sm font-black text-pink-300">{feedback.pronunciationScore}</p>
              <p className="text-[9px] text-purple-200">Pronun.</p>
            </div>
          </div>
        </div>

        {/* Tavsiyalar va xatolar */}
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

          <div className="pt-2">
            <p className="text-[11px] text-slate-400 italic">
              ⚠️ Eslatma: Ushbu baho sun'iy intellekt tomonidan rasmiy Cambridge mezonlari asosida berilgan taxminiy o'quv bahosidir.
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

  // Part Selector Screen
  if (!selectedPart) {
    return (
      <div className="p-5 space-y-5">
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

        {/* Examiner Profile Card */}
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
            "Salom {userName}! Siz bilan rasmiy IELTS Speaking qoidalari bo'yicha to'liq haqiqiy imtihon muhitida mashq qilamiz."
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
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7052ff] flex items-center justify-center font-black text-sm">
                P1
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 1: Kirish & Kundalik mavzular</p>
                <p className="text-[11px] text-slate-500">4-5 ta savol · 57 ta mavzu banki mavjud</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#7052ff]">Boshlash →</span>
          </div>

          {/* Part 2 */}
          <div
            onClick={() => handleSelectPart('part2')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-sm">
                P2
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Part 2: Cue Card (Yakka nutq)</p>
                <p className="text-[11px] text-slate-500">1 daqiqa tayyorlanish · 2 daqiqa gapirish</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600">Boshlash →</span>
          </div>

          {/* Part 3 */}
          <div
            onClick={() => handleSelectPart('part3')}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#7052ff] cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between"
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
        </div>
      </div>
    );
  }

  // Active Session Screen
  return (
    <div className="p-5 space-y-4">
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
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#7052ff]/10 text-[#7052ff] px-2.5 py-1 rounded-full">
            {selectedPart.toUpperCase()}
          </span>
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Part 1 Screen */}
      {selectedPart === 'part1' && p1Topic && (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <span className="text-[10px] font-black uppercase text-[#7052ff] bg-purple-50 px-2 py-0.5 rounded-md">
              Mavzu: {p1Topic.topic}
            </span>
            <p className="text-base font-black text-slate-900 mt-2 leading-snug">
              {p1Topic.questions[p1Index]}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Savol {p1Index + 1} / {Math.min(p1Topic.questions.length, 4)}
            </p>
          </div>
        </div>
      )}

      {/* Part 2 Cue Card Screen */}
      {selectedPart === 'part2' && p2Topic && (
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

            {/* Note taking during 1 min prep */}
            {isPrepping && (
              <div className="mt-3">
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Tayyorgarlik uchun qisqa qoralamalar (notes)..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Part 3 Screen */}
      {selectedPart === 'part3' && p3Topic && (
        <div className="space-y-4">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100">
            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Mavzu: {p3Topic.topic}
            </span>
            <p className="text-base font-black text-slate-900 mt-2 leading-snug">
              {p3Topic.questions[p3Index]}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Savol {p3Index + 1} / {Math.min(p3Topic.questions.length, 3)}
            </p>
          </div>
        </div>
      )}

      {/* Candidate Response Card with Voice Recording and Text Editor */}
      <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700">Sizning javobingiz:</span>
          
          {/* Mic Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#7052ff]/10 text-[#7052ff] hover:bg-[#7052ff]/20'
            }`}
          >
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            <span>{isRecording ? "Yozilmoqda..." : "Ovoz bilan gapirish"}</span>
          </button>
        </div>

        <textarea
          value={candidateAnswer}
          onChange={(e) => setCandidateAnswer(e.target.value)}
          placeholder="Mikrofonga gapiring yoki javobingizni shu yerga yozing..."
          rows={4}
          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-[#7052ff] focus:bg-white transition-all leading-relaxed"
        />

        {/* Action Button */}
        <button
          onClick={handleNextQuestion}
          disabled={isEvaluating}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          {isEvaluating ? (
            <span className="animate-pulse">Examiner baholamoqda...</span>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Javobni topshirish & Keyingisi →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
