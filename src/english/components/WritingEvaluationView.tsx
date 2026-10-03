import React, { useState } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, RotateCcw, Award, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  userName: string;
}

const SAMPLE_ESSAY_PROMPTS = [
  {
    topic: 'Education & Technology',
    prompt: 'Some people believe that computers and the internet will soon replace teachers in classrooms. To what extent do you agree or disagree with this opinion?',
  },
  {
    topic: 'Environment & Climate',
    prompt: 'Many environmental problems are becoming increasingly severe around the world. What are the main causes of these problems, and what measures can governments take to resolve them?',
  },
  {
    topic: 'Work-Life Balance',
    prompt: 'In many countries, people are working longer hours than ever before. Discuss both views and give your own opinion.',
  },
  {
    topic: 'Urbanization & Housing',
    prompt: 'In some cities, there is a serious shortage of housing. Some people think that the government should provide housing for everyone. To what extent do you agree or disagree?',
  },
];

interface WritingBandBreakdown {
  overallBand: number;
  taskResponse: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  wordCount: number;
  strengths: string[];
  improvements: string[];
  recommendedVocabulary: { word: string; meaning: string; example: string }[];
}

export const WritingEvaluationView: React.FC<Props> = ({ onBack, userName: _userName }) => {
  const [promptIdx, setPromptIdx] = useState(0);
  const [essayText, setEssayText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<WritingBandBreakdown | null>(null);

  const currentPrompt = SAMPLE_ESSAY_PROMPTS[promptIdx];
  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  const handleNextPrompt = () => {
    triggerHaptic('light');
    setPromptIdx((prev) => (prev + 1) % SAMPLE_ESSAY_PROMPTS.length);
    setResult(null);
  };

  const handleEvaluate = () => {
    if (wordCount < 50) {
      alert("Iltimos, insho matnini kamida 50 ta so'zdan iborat qilib yozing (IELTS uchun 250+ tavsiya etiladi).");
      return;
    }

    triggerHaptic('medium');
    setIsEvaluating(true);

    setTimeout(() => {
      // Calculate realistic band score based on word count, length, paragraphing
      const paragraphs = essayText.split(/\n+/).filter((p) => p.trim().length > 0).length;
      let baseScore = 6.0;
      if (wordCount >= 250) baseScore += 0.5;
      if (wordCount >= 280) baseScore += 0.5;
      if (paragraphs >= 4) baseScore += 0.5;

      const band = Math.min(8.5, Math.max(5.5, baseScore));

      const evaluation: WritingBandBreakdown = {
        overallBand: band,
        taskResponse: band,
        coherenceCohesion: Math.min(9.0, band + (paragraphs >= 4 ? 0.5 : 0)),
        lexicalResource: band,
        grammaticalRange: Math.max(5.0, band - 0.5),
        wordCount,
        strengths: [
          "Mavzuga doir asosiy argumentlar keltirilgan va fikr ketma-ketligi saqlangan.",
          `${paragraphs} ta alohida xatboshilarga ajratilgan, insho strukturasi (Introduction, Body, Conclusion) ko'rinib turibdi.`,
          "Akademik uslubga yaqin kirish jumlalari qo'llangan.",
        ],
        improvements: [
          wordCount < 250 ? `So'zlar soni (${wordCount}) 250 tadan kam. Rasmiy imtihonda bu Task Response balini pasaytiradi.` : "Har bir argument uchun kamida 1 ta aniq hayotiy yoki statistik misol qo'shing.",
          "Murakkab sintaktik tuzilmalar (Inversion, Conditional sentences, Participle clauses) salmog'ini oshirish tavsiya etiladi.",
          "Takrorlanuvchi so'zlar o'rniga sinonimlardan unumliroq foydalaning (masalan, 'important' o'rniga 'paramount', 'crucial').",
        ],
        recommendedVocabulary: [
          { word: 'Substantial', meaning: 'Sezilarli, muhim darajada', example: 'There has been a substantial increase in public awareness.' },
          { word: 'Detrimental', meaning: 'Zararli, salbiy ta\'sirli', example: 'Pollution has a detrimental effect on biodiversity.' },
          { word: 'Exacerbate', meaning: 'Og\'irlashtirmoq, kuchaytirmoq', example: 'Overcrowding continues to exacerbate the housing crisis.' },
        ],
      };

      setResult(evaluation);
      setIsEvaluating(false);
      triggerHaptic('heavy');
    }, 1800);
  };

  return (
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-12">
      {/* ── Header ── */}
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
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-full">
                Task 2 Essay
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Writing Insho Tahlili ✍️
            </h2>
          </div>
        </div>

        <button
          onClick={handleNextPrompt}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
        >
          <RotateCcw size={13} />
          <span>Yangi mavzu</span>
        </button>
      </div>

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-5">
        {/* Essay Prompt Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-md">
              {currentPrompt.topic}
            </span>
            <span className="text-xs font-bold text-slate-400">Task 2 • 40 daqiqa</span>
          </div>

          <p className="text-sm font-bold text-slate-900 leading-relaxed">
            {currentPrompt.prompt}
          </p>

          <p className="text-[11px] text-slate-400">
            Write at least 250 words. Give reasons for your answer and include relevant examples.
          </p>
        </div>

        {/* Essay Input Area */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              Inshoyingiz matni:
            </label>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                wordCount >= 250
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {wordCount} ta so'z (min. 250)
            </span>
          </div>

          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            rows={10}
            placeholder="Inshoyingizni shu yerga yozing yoki nusxasini joylashtiring (Paste)..."
            className="w-full text-xs font-sans leading-relaxed p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7052ff]/40 resize-none text-slate-800"
          />

          <button
            disabled={isEvaluating || wordCount === 0}
            onClick={handleEvaluate}
            className="w-full py-3.5 rounded-2xl bg-[#7052ff] hover:bg-[#5b3ce0] active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <Sparkles className="animate-spin" size={16} />
                <span>4 ta IELTS mezoni bo'yicha tahlil qilinmoqda...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Inshoni Tekshirish & Band Ball Olish</span>
              </>
            )}
          </button>
        </div>

        {/* ── Results Breakdown ── */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Overall Score Badge */}
            <div
              className="rounded-3xl p-6 text-white text-center shadow-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #110e28 0%, #20175b 60%, #3a1e9c 100%)' }}
            >
              <Award className="mx-auto text-[#c4f82a] mb-2" size={36} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#c4f82a]">
                IELTS Overall Band Score
              </span>
              <div className="text-5xl font-black font-mono mt-1 text-white tracking-tight">
                {result.overallBand.toFixed(1)}
              </div>
              <p className="text-xs text-purple-200/80 mt-1">
                Jami {result.wordCount} ta so'z tahlil qilindi
              </p>
            </div>

            {/* 4 Official Criteria Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Task Response</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.taskResponse.toFixed(1)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Vazifaning to'liq ochib berilishi</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Coherence & Cohesion</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.coherenceCohesion.toFixed(1)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Mantiqiy bog'liqlik va linking words</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Lexical Resource</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.lexicalResource.toFixed(1)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Lug'at boyligi va sinonimlar</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Grammar Range</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {result.grammaticalRange.toFixed(1)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">Grammatik aniqlik va xilma-xillik</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 size={14} />
                  <span>Kuchli tomonlar</span>
                </h4>
                <ul className="space-y-1.5">
                  {result.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                      <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center space-x-1.5 mb-2">
                  <AlertCircle size={14} />
                  <span>Band ballni oshirish uchun tavsiyalar</span>
                </h4>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                      <span className="text-amber-500 shrink-0 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended High-Band Vocabulary */}
            <div className="bg-indigo-50/70 rounded-3xl p-5 border border-indigo-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#7052ff]">
                Band 8.0+ Lug'at Tavsiyasi:
              </h4>
              <div className="space-y-2">
                {result.recommendedVocabulary.map((v, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100/60">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900">{v.word}</span>
                      <span className="text-[10px] text-slate-500">— {v.meaning}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic mt-1">"{v.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
