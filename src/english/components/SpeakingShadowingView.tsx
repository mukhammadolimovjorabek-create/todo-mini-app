import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Volume2, Mic, Square, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';
import { speakEnglishText, stopSpeaking } from '../../utils/speechVoice';
import { createExamRecorder, transcribeAudio } from '../utils/examRecorder';
import { addMistakes } from '../../utils/shop';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  examType?: 'ielts' | 'multilevel';
}

interface ShadowSentence {
  id: string;
  topic: string;
  level: string;
  text: string;
  uzTip: string;
}

const SHADOW_SENTENCES: ShadowSentence[] = [
  {
    id: 'sh1',
    topic: 'Work & Technology',
    level: 'Band 8.5 · C1',
    text: 'Although artificial intelligence streamlines routine administrative tasks, human empathy and ethical judgment remain utterly irreplaceable.',
    uzTip: '"artifiSHAL", "adMI-nis-tra-tiv", "utterly irrePLACEable" urg\'ulariga e\'tibor bering.',
  },
  {
    id: 'sh2',
    topic: 'Environment & Cities',
    level: 'Band 8.0 · B2–C1',
    text: 'Expanding reliable public transit networks is one of the most practical ways to curb traffic congestion and lower urban emissions.',
    uzTip: '"curb traffic conGEStion" iborasini bir nafasda bog\'lab talaffuz qiling.',
  },
  {
    id: 'sh3',
    topic: 'Education',
    level: 'Band 8.5 · C1',
    text: 'Encouraging critical thinking from an early age equips students to evaluate conflicting sources rather than memorizing facts blindly.',
    uzTip: '"conFLICting sources" va "RATHER than" pauzasini aniq ajrating.',
  },
  {
    id: 'sh4',
    topic: 'Personal Growth',
    level: 'Band 9.0 · C1',
    text: 'Had I not stepped outside my comfort zone during university, I would never have discovered my passion for cross-cultural communication.',
    uzTip: '"Had I not..." shart inversiyasini tabiiy ko\'tariluvchi intonatsiya bilan ayting.',
  },
  {
    id: 'sh5',
    topic: 'Culture & Uzbekistan',
    level: 'Multilevel C1',
    text: 'Preserving historic architectural monuments alongside modern infrastructure gives residents a strong sense of continuity and pride.',
    uzTip: '"archiTEC-tu-ral", "infraSTRUC-ture", "contiNU-ity" urg\'ularini aniq chiqaring.',
  },
];

const cleanToken = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

export const SpeakingShadowingView: React.FC<Props> = ({ onBack, examType = 'ielts' }) => {
  const [idx, setIdx] = useState(0);
  const [rate, setRate] = useState<0.85 | 1>(1);
  const [isSpeakingModel, setIsSpeakingModel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [spokenResult, setSpokenResult] = useState('');

  const recorderRef = useRef(createExamRecorder());
  const sample = SHADOW_SENTENCES[idx];

  useEffect(() => {
    return () => {
      stopSpeaking();
      recorderRef.current.release();
    };
  }, []);

  const handleListenModel = () => {
    triggerHaptic('light');
    setIsSpeakingModel(true);
    speakEnglishText(sample.text, {
      voice: 'en-GB-RyanNeural',
      rate,
      preferNeural: true,
      onEnd: () => setIsSpeakingModel(false),
    });
  };

  const handleStartShadow = async () => {
    stopSpeaking();
    setIsSpeakingModel(false);
    setSpokenResult('');
    setLiveTranscript('');
    triggerHaptic('medium');

    const ok = await recorderRef.current.ensureMic();
    if (!ok) {
      alert("Mikrofonga ruxsat berilmadi. Brauzer/Telegram sozlamalarini tekshiring.");
      return;
    }
    const started = recorderRef.current.startTurn((txt) => setLiveTranscript(txt));
    if (started) setIsRecording(true);
  };

  const handleStopShadow = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);
    triggerHaptic('heavy');

    try {
      const blob = await recorderRef.current.stopTurn();
      const transcript = blob ? await transcribeAudio(blob, sample.text, idx) : liveTranscript;
      const finalTxt = (transcript || liveTranscript).trim();
      setSpokenResult(finalTxt);

      if (finalTxt) {
        const spokenSet = new Set(finalTxt.split(/\s+/).map(cleanToken).filter(Boolean));
        const missed = sample.text
          .split(/\s+/)
          .filter((w) => !spokenSet.has(cleanToken(w)));

        if (missed.length > 0 && missed.length <= 8) {
          addMistakes([
            {
              source: 'speaking',
              skillTag: 'pronunciation',
              title: `Shadowing: ${sample.topic}`,
              userText: `Tushib qolgan/noto'g'ri so'zlar: ${missed.slice(0, 5).join(', ')}`,
              correction: sample.text,
              explanation: sample.uzTip,
            },
          ]);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const targetTokens = sample.text.split(/\s+/);
  const spokenSet = new Set(spokenResult.split(/\s+/).map(cleanToken).filter(Boolean));
  const matchedCount = spokenResult
    ? targetTokens.filter((w) => spokenSet.has(cleanToken(w))).length
    : 0;
  const accuracyPct = spokenResult ? Math.round((matchedCount / targetTokens.length) * 100) : 0;

  return (
    <div className="english-root min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-100 px-4 py-3.5 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              stopSpeaking();
              recorderRef.current.release();
              onBack();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase bg-indigo-50 text-[#7052ff] px-2 py-0.5 rounded-md">
              {examType === 'multilevel' ? 'Multilevel C1 Shadowing' : 'IELTS Band 9.0 Shadowing'}
            </span>
            <h2 className="text-sm font-black">Talaffuz & Soya Mashqi</h2>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
          {([0.85, 1] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${
                rate === r ? 'bg-white text-[#7052ff] shadow-xs' : 'text-slate-500'
              }`}
            >
              {r === 0.85 ? '0.85x Sekin' : '1.0x Asl'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4">
        {/* Stepper pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SHADOW_SENTENCES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                stopSpeaking();
                setIdx(i);
                setSpokenResult('');
                setLiveTranscript('');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border ${
                i === idx ? 'bg-[#0e0d1d] text-white border-[#0e0d1d]' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              #{i + 1} · {s.topic}
            </button>
          ))}
        </div>

        {/* Target sentence card */}
        <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {sample.level}
            </span>
            <button
              onClick={handleListenModel}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all ${
                isSpeakingModel ? 'bg-[#7052ff] text-white animate-pulse' : 'bg-indigo-50 text-[#7052ff] hover:bg-indigo-100'
              }`}
            >
              <Volume2 size={15} />
              <span>{isSpeakingModel ? 'Eshiting...' : 'Namunani Tinglash'}</span>
            </button>
          </div>

          {/* Word-by-word highlighted text */}
          <div className="text-base sm:text-lg font-bold leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1">
            {targetTokens.map((word, wIdx) => {
              const matched = spokenResult && spokenSet.has(cleanToken(word));
              const missed = spokenResult && !matched;
              return (
                <span
                  key={wIdx}
                  className={`px-1 rounded transition-colors ${
                    matched
                      ? 'bg-emerald-100 text-emerald-900'
                      : missed
                      ? 'bg-rose-100 text-rose-800 underline decoration-rose-400'
                      : 'text-slate-900'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            💡 <b>Talaffuz maslahati:</b> {sample.uzTip}
          </p>
        </div>

        {/* Mic control */}
        <div className="bg-gradient-to-br from-[#0e0d1d] to-[#231d47] text-white rounded-[2rem] p-5 space-y-3 text-center shadow-lg">
          {!isRecording ? (
            <button
              onClick={handleStartShadow}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-[#c4f82a] text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all disabled:opacity-60"
            >
              <Mic size={18} />
              <span>{isProcessing ? 'AI tahlil qilmoqda...' : 'Mikrofonni yoqib takrorlang'}</span>
            </button>
          ) : (
            <button
              onClick={handleStopShadow}
              className="w-full py-4 rounded-2xl bg-rose-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg animate-pulse"
            >
              <Square size={16} />
              <span>Tugatish va Solishtirish</span>
            </button>
          )}

          {liveTranscript && !spokenResult && (
            <p className="text-xs text-white/80 italic">Eshitilmoqda: "{liveTranscript}"</p>
          )}

          {spokenResult && (
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-black text-[#c4f82a]">
                  <Sparkles size={14} />
                  <span>Talaffuz Mosligi</span>
                </div>
                <span className="text-lg font-black text-[#c4f82a]">{accuracyPct}%</span>
              </div>
              <p className="text-xs text-white/85">Sizning nutqingiz: "{spokenResult}"</p>
              {accuracyPct >= 85 && (
                <p className="text-xs text-emerald-300 font-bold flex items-center space-x-1">
                  <CheckCircle2 size={14} />
                  <span>Ajoyib! Native ritm va so'zlarni juda to'g'ri chiqardingiz.</span>
                </p>
              )}
              <button
                onClick={() => {
                  setSpokenResult('');
                  setLiveTranscript('');
                }}
                className="text-[11px] font-bold text-white/70 hover:text-white inline-flex items-center space-x-1 pt-1"
              >
                <RotateCcw size={12} />
                <span>Qayta urinish</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
