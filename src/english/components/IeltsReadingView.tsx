import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';
import { saveTestResult } from '../utils/storage';
import type { TestResultItem } from '../types';

interface Props {
  onBack: () => void;
  userName: string;
}

interface ReadingQuestion {
  id: number;
  type: 'tfng' | 'mcq'; // True/False/Not Given OR Multiple Choice
  questionText: string;
  options?: string[]; // for mcq
  correctAnswer: string;
  explanation: string;
}

interface ReadingPassage {
  id: string;
  title: string;
  subtitle: string;
  paragraphs: { label: string; text: string }[];
  questions: ReadingQuestion[];
}

const READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'passage_1',
    title: 'The Science of Sleep and Memory Consolidation',
    subtitle: 'IELTS Academic Reading Passage 1',
    paragraphs: [
      {
        label: 'A',
        text: 'For centuries, sleep was considered a passive state in which the brain simply shut down to recover from daily fatigue. However, modern neurobiological research has revealed that the sleeping brain is highly active, performing critical cognitive functions, foremost among them being the consolidation of memories acquired during wakefulness.',
      },
      {
        label: 'B',
        text: 'During Non-Rapid Eye Movement (NREM) slow-wave sleep, electrical oscillations called slow waves synchronize across the cerebral cortex. Simultaneously, fast bursts of activity known as sleep spindles originate in the thalamus. Neuroscientists at Harvard University demonstrated that these coordinated signals facilitate the transfer of recently learned information from the temporary storage of the hippocampus to the permanent architecture of the neocortex.',
      },
      {
        label: 'C',
        text: 'Rapid Eye Movement (REM) sleep, characterized by vivid dreaming and rapid ocular saccades, serves an equally vital complementary role. While NREM sleep stabilizes declarative facts and semantic knowledge, REM sleep integrates novel emotional experiences and fosters creative problem-solving by forging unexpected neural associations across distant semantic networks.',
      },
      {
        label: 'D',
        text: 'Conversely, chronic sleep deprivation severely impairs these neurochemical processes. Individuals restricted to fewer than six hours of sleep per night exhibit a 40% reduction in hippocampal retention capacity. Furthermore, lack of sleep triggers an accumulation of beta-amyloid proteins, toxic metabolic waste products directly linked to neurodegenerative disorders such as Alzheimer\'s disease.',
      },
    ],
    questions: [
      {
        id: 1,
        type: 'tfng',
        questionText: 'Early historical theories accurately recognized that the brain remains cognitively active during sleep.',
        correctAnswer: 'FALSE',
        explanation: 'Paragraph A states that historically, sleep was viewed as a passive shutdown state, which contradicts the statement.',
      },
      {
        id: 2,
        type: 'tfng',
        questionText: 'Sleep spindles are generated in the thalamus during NREM slow-wave sleep.',
        correctAnswer: 'TRUE',
        explanation: 'Paragraph B explicitly confirms that sleep spindles originate in the thalamus during NREM sleep.',
      },
      {
        id: 3,
        type: 'tfng',
        questionText: 'REM sleep primarily consolidates factual and declarative knowledge rather than emotional integration.',
        correctAnswer: 'FALSE',
        explanation: 'Paragraph C explains that NREM stabilizes declarative facts, while REM integrates emotional experiences and creative associations.',
      },
      {
        id: 4,
        type: 'tfng',
        questionText: 'The Harvard University study received funding from international healthcare organizations.',
        correctAnswer: 'NOT GIVEN',
        explanation: 'Paragraph B mentions Harvard University neuroscientists, but makes no reference to their funding sources.',
      },
      {
        id: 5,
        type: 'mcq',
        questionText: 'According to Paragraph D, chronic sleep restriction leads to:',
        options: [
          'A permanent destruction of the thalamus',
          'A 40% decline in hippocampal memory retention',
          'Immediate elimination of beta-amyloid proteins',
          'A total inability to enter slow-wave sleep',
        ],
        correctAnswer: 'A 40% decline in hippocampal memory retention',
        explanation: 'Paragraph D states that individuals restricted to under six hours show a 40% reduction in hippocampal retention capacity.',
      },
    ],
  },
  {
    id: 'passage_2',
    title: 'Vertical Farming: Cultivating the Cities of Tomorrow',
    subtitle: 'IELTS Academic Reading Passage 2',
    paragraphs: [
      {
        label: 'A',
        text: 'With the global human population projected to reach nearly 10 billion by 2050, traditional agriculture faces unprecedented constraints. Arable land is diminishing rapidly due to soil erosion and urbanization, while conventional farming consumes over 70% of accessible freshwater reserves worldwide.',
      },
      {
        label: 'B',
        text: 'Vertical farming offers an innovative technological alternative. By cultivating crops in vertically stacked layers within climate-controlled indoor skyscrapers, growers eliminate dependence on seasonal weather. Utilizing closed-loop aeroponic and hydroponic irrigation systems, vertical farms reduce water consumption by up to 95% compared to traditional open-field farming.',
      },
      {
        label: 'C',
        text: 'Despite these remarkable ecological benefits, critics highlight considerable financial challenges. The capital expenditure required for specialized LED grow lights, sophisticated climate sensors, and automated robotics remains prohibitive. Consequently, commercial vertical farms currently focus almost exclusively on high-value leafy greens and strawberries, rather than staple caloric crops like wheat or maize.',
      },
    ],
    questions: [
      {
        id: 1,
        type: 'tfng',
        questionText: 'Traditional agriculture currently utilizes the majority of global accessible freshwater.',
        correctAnswer: 'TRUE',
        explanation: 'Paragraph A states conventional farming consumes over 70% of accessible freshwater reserves.',
      },
      {
        id: 2,
        type: 'tfng',
        questionText: 'Vertical farms consume approximately the same amount of water as open-field agriculture.',
        correctAnswer: 'FALSE',
        explanation: 'Paragraph B notes vertical farms reduce water consumption by up to 95%.',
      },
      {
        id: 3,
        type: 'mcq',
        questionText: 'Why do most current vertical farms avoid growing staple crops such as wheat or maize?',
        options: [
          'Staple crops cannot grow under artificial LED lighting',
          'High operational and setup costs limit profitability to high-value produce',
          'Government regulations forbid indoor cereal production',
          'Vertical farming requires soil for grain cultivation',
        ],
        correctAnswer: 'High operational and setup costs limit profitability to high-value produce',
        explanation: 'Paragraph C explains that high capital expenditure means farms currently focus on high-value greens rather than staple caloric crops.',
      },
    ],
  },
];

export const IeltsReadingView: React.FC<Props> = ({ onBack, userName: _userName }) => {
  const [selectedPassageIdx, setSelectedPassageIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [bandScore, setBandScore] = useState<number>(0);

  // 20 minute timer
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Time tracking
  const [startTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const currentPassage = READING_PASSAGES[selectedPassageIdx];

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, isSubmitted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: number, answer: string) => {
    if (isSubmitted) return;
    triggerHaptic('light');
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    currentPassage.questions.forEach((q) => {
      if (answers[q.id]?.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()) {
        correctCount += 1;
      }
    });

    const total = currentPassage.questions.length;
    const ratio = correctCount / total;
    let band = 5.0;
    if (ratio === 1.0) band = 9.0;
    else if (ratio >= 0.8) band = 8.0;
    else if (ratio >= 0.6) band = 7.0;
    else if (ratio >= 0.4) band = 6.0;

    setScore(correctCount);
    setBandScore(band);
    setIsSubmitted(true);
    setIsTimerRunning(false);
    triggerHaptic('heavy');

    // Save to Test History
    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

    const historyItem: TestResultItem = {
      id: `reading_${Date.now()}`,
      date: dateStr,
      startTime,
      endTime,
      testType: 'reading',
      title: `IELTS Reading: ${currentPassage.title}`,
      topic: 'Academic Reading Passage',
      overallBand: band,
      criteriaScores: {
        c1Name: 'Correct Answers',
        c1Score: correctCount,
        c2Name: 'Total Questions',
        c2Score: total,
        c3Name: 'Accuracy',
        c3Score: Math.round(ratio * 100),
        c4Name: 'Band Score',
        c4Score: band,
      },
      strengths: [
        `${total} ta savoldan ${correctCount} tasiga to'g'ri javob berildi (${Math.round(ratio * 100)}%).`,
        `Akademik matndan faktik ma'lumotlarni qidirish tezligi yaxshi.`,
      ],
      improvements: [
        correctCount < total
          ? `Noto'g'ri belgilangan savollarning izohlarini (explanations) diqqat bilan o'rganing.`
          : `Ajoyib natija! Keyingi matnlarda vaqtni tejash ustida ishlang.`,
      ],
    };

    saveTestResult(historyItem);
  };

  const handleReset = () => {
    triggerHaptic('medium');
    setAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setBandScore(0);
    setTimeLeft(20 * 60);
    setIsTimerRunning(true);
  };

  return (
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-12">
      {/* ── Top Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#7052ff]">IELTS Academic</span>
              <span className="text-[10px] font-bold bg-indigo-50 text-[#7052ff] px-2 py-0.5 rounded-full">Reading</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Reading Sinovi 📖
            </h2>
          </div>
        </div>

        {/* Timer */}
        <button
          onClick={() => !isSubmitted && setIsTimerRunning(!isTimerRunning)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
            isTimerRunning && !isSubmitted
              ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
          title="Vaqt"
        >
          <Clock size={13} />
          <span>{formatTimer(timeLeft)}</span>
        </button>
      </div>

      <div className="flex-1 p-5 space-y-4 max-w-xl mx-auto w-full">
        {/* Passage Switcher */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl">
          {READING_PASSAGES.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedPassageIdx(idx);
                setAnswers({});
                setIsSubmitted(false);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                selectedPassageIdx === idx
                  ? 'bg-white text-[#7052ff] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passage {idx + 1}
            </button>
          ))}
        </div>

        {/* Passage Header */}
        <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase text-[#7052ff] bg-indigo-50 px-2.5 py-0.5 rounded-md">
            {currentPassage.subtitle}
          </span>
          <h3 className="text-base font-black text-slate-900 leading-snug">
            {currentPassage.title}
          </h3>
        </div>

        {/* Passage Text Container */}
        <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3.5 max-h-[360px] overflow-y-auto">
          {currentPassage.paragraphs.map((p) => (
            <div key={p.label} className="text-xs leading-relaxed text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 mr-1.5 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                [{p.label}]
              </span>
              <span>{p.text}</span>
            </div>
          ))}
        </div>

        {/* Questions Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Savollar ({currentPassage.questions.length} ta):
            </h4>
            <span className="text-[11px] font-bold text-slate-400">
              Belgilandi: {Object.keys(answers).length} / {currentPassage.questions.length}
            </span>
          </div>

          {currentPassage.questions.map((q) => {
            const selected = answers[q.id];
            const isCorrect = isSubmitted && selected?.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();

            return (
              <div
                key={q.id}
                className={`bg-white rounded-[1.8rem] p-4.5 border transition-all space-y-3 ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-100 shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-[#7052ff] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {q.id}
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    {q.questionText}
                  </p>
                </div>

                {/* Question Options */}
                {q.type === 'tfng' ? (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                      <button
                        key={opt}
                        disabled={isSubmitted}
                        onClick={() => handleSelectAnswer(q.id, opt)}
                        className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                          selected === opt
                            ? 'bg-[#7052ff] text-white border-[#7052ff] shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {q.options?.map((opt) => (
                      <button
                        key={opt}
                        disabled={isSubmitted}
                        onClick={() => handleSelectAnswer(q.id, opt)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs text-left border transition-all ${
                          selected === opt
                            ? 'bg-[#7052ff] text-white border-[#7052ff] font-bold shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Explanation after submit */}
                {isSubmitted && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center space-x-1 font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-600 flex items-center space-x-1">
                          <CheckCircle2 size={13} />
                          <span>To'g'ri!</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center space-x-1">
                          <AlertCircle size={13} />
                          <span>To'g'ri javob: <strong>{q.correctAnswer}</strong></span>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit / Results Button */}
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#5938ea] text-white font-black text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>Javoblarni Tekshirish va Baholash</span>
            </button>
          ) : (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#7052ff]">IELTS Reading Natijasi</span>
                  <h4 className="text-lg font-black text-slate-900">
                    {score} / {currentPassage.questions.length} to'g'ri
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#7052ff] font-mono">
                    Band {bandScore.toFixed(1)}
                  </span>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Natija</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
              >
                Qaytadan topshirish 🔄
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
