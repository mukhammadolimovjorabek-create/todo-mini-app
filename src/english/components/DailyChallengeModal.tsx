import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Square, Trophy, Sparkles, Volume2, CheckCircle2, Flame, Send } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { getTelegramInitData, triggerHaptic } from '../../utils/telegram';
import { markDailyChallengeDone } from '../../utils/shop';
import { COINS_PER_DAILY_CHALLENGE, recalculateCoins } from '../../utils/gamification';
import { createExamRecorder, transcribeAudio } from '../utils/examRecorder';
import { evaluateCandidateSpeechWithAI } from '../utils/ieltsScoring';
import { speakEnglishText } from '../../utils/speechVoice';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId?: string | null;
}

interface DailyLeaderboardRow {
  userId: string;
  firstName: string;
  examType: string;
  score: number;
  transcript: string;
  feedbackUz: string;
}

const MINI_QUIZZES: Record<
  string,
  {
    title: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanationUz: string;
  }
> = {
  quiz_ielts1: {
    title: 'IELTS Band 8.0 Collocation',
    question: 'Governments should introduce strict subsidies to _____ the economic burden on rural families.',
    options: ['A) exacerbate', 'B) alleviate', 'C) deteriorate', 'D) escalate'],
    correctIndex: 1,
    explanationUz:
      "To'g'ri javob B (alleviate = yengillashtirmoq, yumshatmoq). Qolgan variantlar esa muammoni yanada og'irlashtirish ma'nosini bildiradi.",
  },
  quiz_ml1: {
    title: 'Multilevel C1 Inversion Trap',
    question: 'Not only _____ renewable energy, but it also creates thousands of green jobs.',
    options: [
      'A) solar power reduces emissions',
      'B) does solar power reduce emissions',
      'C) solar power does reduce emissions',
      'D) reduces solar power emissions',
    ],
    correctIndex: 1,
    explanationUz:
      "Gap 'Not only' bilan boshlanganda birinchi qismda inversiya ishlatiladi: Not only + does + ega + fe'l (B javob).",
  },
  quiz_ielts2: {
    title: 'IELTS Reading: FALSE vs NOT GIVEN',
    question:
      'Matn: "The museum opened its digital archive in 2019, making 40% of its manuscripts accessible online." Savol: All of the museum\'s manuscripts are now available on the internet.',
    options: ['A) TRUE', 'B) FALSE', 'C) NOT GIVEN'],
    correctIndex: 1,
    explanationUz:
      "To'g'ri javob FALSE! Matn 40% qo'lyozma onlayn ekanini aniq aytyapti, savol esa 'barchasi (100%)' deya matnga to'g'ridan-to'g'ri zid kelyapti.",
  },
};

const FALLBACK_PROMPT = {
  id: 'dc_local',
  topic: 'Technology & Daily Life',
  question: 'Describe a mobile app or digital tool that significantly improved your study or daily productivity. Explain how you use it and why you recommend it.',
  uzHint: "Qaysi ilova sizga o'qishda eng ko'p foyda berganini aniq misollar bilan tushuntiring.",
  targetSeconds: 60,
};

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ isOpen, onClose, quizId }) => {
  const initialMode = quizId && MINI_QUIZZES[quizId] ? 'quiz' : 'voice';
  const [tab, setTab] = useState<'voice' | 'quiz'>(initialMode);
  const [selectedQuizKey, setSelectedQuizKey] = useState<string>(
    quizId && MINI_QUIZZES[quizId] ? quizId : 'quiz_ielts1'
  );
  const [pickedOption, setPickedOption] = useState<number | null>(null);

  const [promptData, setPromptData] = useState(FALLBACK_PROMPT);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardRow[]>([]);
  const [myEntry, setMyEntry] = useState<DailyLeaderboardRow | null>(null);

  const recorderRef = useRef(createExamRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [manualText, setManualText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [rewardedMsg, setRewardedMsg] = useState('');

  useEffect(() => {
    if (quizId && MINI_QUIZZES[quizId]) {
      setTab('quiz');
      setSelectedQuizKey(quizId);
      setPickedOption(null);
    } else if (quizId === 'quiz_daily') {
      setTab('voice');
    }
  }, [quizId]);

  const fetchChallenge = async () => {
    const initData = getTelegramInitData();
    const headers: Record<string, string> = initData ? { 'X-Telegram-Init-Data': initData } : {};
    const urls = ['/api/daily_challenge', ...(API_BASE_URL ? [`${API_BASE_URL}/api/daily_challenge`] : [])];

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.prompt) setPromptData(data.prompt);
        if (Array.isArray(data?.leaderboard)) setLeaderboard(data.leaderboard);
        if (data?.myEntry) setMyEntry(data.myEntry);
        return;
      } catch {
        // try next
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      recorderRef.current.release();
      return;
    }
    fetchChallenge();
    return () => {
      recorderRef.current.release();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const startVoiceAnswer = async () => {
    triggerHaptic('medium');
    setLiveText('');
    setRewardedMsg('');
    const ok = await recorderRef.current.ensureMic();
    if (!ok) {
      setRewardedMsg("Mikrofon ruxsati yo'q — pastga matn ko'rinishida yozib topshirishingiz mumkin.");
      return;
    }
    const started = recorderRef.current.startTurn((txt) => setLiveText(txt));
    if (started) setIsRecording(true);
  };

  const stopAndGradeVoice = async () => {
    if (!isRecording) return;
    triggerHaptic('heavy');
    setIsRecording(false);
    setIsGrading(true);

    try {
      const blob = await recorderRef.current.stopTurn();
      const metrics = recorderRef.current.getLastMetrics();
      const transcript = blob ? await transcribeAudio(blob, promptData.question, 0) : liveText.trim();
      const finalSpeech = (transcript || liveText || manualText).trim();
      await submitEvaluatedText(finalSpeech, metrics);
    } finally {
      setIsGrading(false);
    }
  };

  const submitEvaluatedText = async (speechText: string, metrics: any = null) => {
    if (!speechText || speechText.split(/\s+/).length < 4) {
      setRewardedMsg("Kamida 4-5 ta so'z bilan ingliz tilida javob bering.");
      return;
    }
    setIsGrading(true);
    try {
      const evalRes = await evaluateCandidateSpeechWithAI(
        [{ question: promptData.question, answer: speechText, metrics }],
        'part2'
      );
      const feedbackSummary = evalRes.strengths[0] || evalRes.improvements[0] || `Band ${evalRes.overallBand}`;

      const localEntry: DailyLeaderboardRow = {
        userId: 'me',
        firstName: 'Siz',
        examType: 'ielts',
        score: evalRes.overallBand,
        transcript: speechText,
        feedbackUz: feedbackSummary,
      };
      setMyEntry(localEntry);

      const granted = markDailyChallengeDone();
      recalculateCoins();
      setRewardedMsg(
        granted
          ? `🎉 Natija: Band ${evalRes.overallBand}! +${COINS_PER_DAILY_CHALLENGE} 🪙 Coin berildi!`
          : `✅ Natijangiz yangilandi: Band ${evalRes.overallBand}!`
      );

      // Sync to server leaderboard
      const initData = getTelegramInitData();
      if (initData) {
        const payload = JSON.stringify({
          examType: 'ielts',
          score: evalRes.overallBand,
          transcript: speechText,
          feedbackUz: feedbackSummary,
        });
        const urls = ['/api/daily_challenge', ...(API_BASE_URL ? [`${API_BASE_URL}/api/daily_challenge`] : [])];
        for (const url of urls) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initData },
              body: payload,
            });
            if (res.ok) {
              await fetchChallenge();
              break;
            }
          } catch {
            // continue
          }
        }
      }
    } finally {
      setIsGrading(false);
    }
  };

  const activeQuiz = MINI_QUIZZES[selectedQuizKey] || MINI_QUIZZES.quiz_ielts1;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0e0d1d] via-[#261c56] to-[#4c1d95] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center">
              <Flame size={20} className="text-[#c4f82a]" />
            </div>
            <div>
              <h3 className="text-sm font-black">Kun Savoli & Mini-Quiz</h3>
              <p className="text-[11px] text-white/75">Ishtirok uchun +{COINS_PER_DAILY_CHALLENGE} 🪙 Coin oling</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-2 bg-slate-100 grid grid-cols-2 gap-1.5 shrink-0">
          <button
            onClick={() => setTab('voice')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              tab === 'voice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            🎙 Kunlik Voice Challenge
          </button>
          <button
            onClick={() => setTab('quiz')}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              tab === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            ⚡ Inline Mini-Quizlar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'voice' ? (
            <>
              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#7052ff] bg-white px-2.5 py-1 rounded-full">
                    {promptData.topic}
                  </span>
                  <button
                    onClick={() => speakEnglishText(promptData.question, { rate: 0.94 })}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200"
                  >
                    <Volume2 size={13} />
                    <span>Eshitish</span>
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">{promptData.question}</p>
                <p className="text-[11px] text-slate-600">💡 {promptData.uzHint}</p>
              </div>

              {/* Voice capture controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3 text-center">
                {!isRecording ? (
                  <button
                    onClick={startVoiceAnswer}
                    disabled={isGrading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7052ff] to-indigo-600 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all disabled:opacity-60"
                  >
                    <Mic size={16} />
                    <span>{isGrading ? 'AI baholamoqda...' : 'Ovozli javob yozish (60 soniya)'}</span>
                  </button>
                ) : (
                  <button
                    onClick={stopAndGradeVoice}
                    className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg animate-pulse"
                  >
                    <Square size={15} />
                    <span>To'xtatish va AI baho olish</span>
                  </button>
                )}

                {liveText && (
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 text-left">
                    “{liveText}”
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Yoki javobingizni ingliz tilida yozing..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#7052ff]"
                  />
                  <button
                    onClick={() => submitEvaluatedText(manualText)}
                    disabled={isGrading || !manualText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black disabled:opacity-40 flex items-center space-x-1"
                  >
                    <Send size={13} />
                  </button>
                </div>

                {rewardedMsg && <p className="text-xs font-black text-emerald-600">{rewardedMsg}</p>}
              </div>

              {myEntry && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">Sizning bugungi natijangiz</span>
                    <span className="text-sm font-black text-emerald-700">Band {myEntry.score}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">{myEntry.feedbackUz}</p>
                </div>
              )}

              {/* Top-3 / Daily Leaderboard */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-black text-slate-700">
                  <Trophy size={14} className="text-amber-500" />
                  <span>Bugungi Top-3 Eng Yaxshi Javoblar</span>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    Bugun hali hech kim javob topshirmagan — birinchi bo'lib Top-1 o'rinni egallang! 🏆
                  </p>
                ) : (
                  leaderboard.slice(0, 5).map((item, idx) => (
                    <div key={`${item.userId}-${idx}`} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {item.firstName}
                        </span>
                        <span className="text-[#7052ff]">Band {item.score}</span>
                      </div>
                      {item.transcript && <p className="text-[11px] text-slate-600 italic line-clamp-2">"{item.transcript}"</p>}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Object.entries(MINI_QUIZZES).map(([key, q]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedQuizKey(key);
                      setPickedOption(null);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap ${
                      selectedQuizKey === key
                        ? 'bg-[#7052ff] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {q.title}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                <p className="text-sm font-bold text-slate-900 leading-relaxed">{activeQuiz.question}</p>
                <div className="space-y-2">
                  {activeQuiz.options.map((opt, idx) => {
                    const isPicked = pickedOption === idx;
                    const isCorrect = idx === activeQuiz.correctIndex;
                    let cls = 'bg-white border-slate-200 text-slate-800';
                    if (pickedOption !== null) {
                      if (isCorrect) cls = 'bg-emerald-50 border-emerald-400 text-emerald-900';
                      else if (isPicked) cls = 'bg-rose-50 border-rose-400 text-rose-900';
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (pickedOption !== null) return;
                          triggerHaptic(idx === activeQuiz.correctIndex ? 'medium' : 'heavy');
                          setPickedOption(idx);
                          if (idx === activeQuiz.correctIndex) {
                            markDailyChallengeDone();
                            recalculateCoins();
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${cls}`}
                      >
                        <span>{opt}</span>
                        {pickedOption !== null && isCorrect && <CheckCircle2 size={15} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {pickedOption !== null && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-950 space-y-1">
                    <div className="flex items-center space-x-1 font-black">
                      <Sparkles size={13} className="text-[#7052ff]" />
                      <span>Tahlil:</span>
                    </div>
                    <p>{activeQuiz.explanationUz}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
