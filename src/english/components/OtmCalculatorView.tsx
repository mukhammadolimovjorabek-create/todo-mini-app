import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calculator, GraduationCap, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { getTestResults } from '../utils/storage';
import { triggerHaptic } from '../../utils/telegram';

interface OtmCalculatorViewProps {
  onBack: () => void;
  onGoExam?: (exam: 'ielts' | 'multilevel') => void;
}

type DirectionMode = 'philology' | 'non_philology';
type CertOption = 'none' | 'ml_b1' | 'ml_b2' | 'ml_c1' | 'ielts_55' | 'ielts_60' | 'ielts_70';

const CERT_OPTIONS: { id: CertOption; label: string; badge: string }[] = [
  { id: 'none', label: "Sertifikat yo'q", badge: '0%' },
  { id: 'ml_b1', label: 'Multilevel B1 (30–49 ball)', badge: 'Imtiyozsiz' },
  { id: 'ml_b2', label: 'Multilevel B2 (50–64 ball)', badge: 'Max ball*' },
  { id: 'ml_c1', label: 'Multilevel C1 (65–75 ball)', badge: '100% Max ball' },
  { id: 'ielts_55', label: 'IELTS Band 5.5', badge: 'No-filologiya B2*' },
  { id: 'ielts_60', label: 'IELTS Band 6.0 – 6.5', badge: 'Max ball*' },
  { id: 'ielts_70', label: 'IELTS Band 7.0+', badge: '100% Max ball' },
];

export const OtmCalculatorView: React.FC<OtmCalculatorViewProps> = ({ onBack, onGoExam }) => {
  const results = useMemo(() => getTestResults(), []);
  const latestIelts = results.find((r) => !r.id.startsWith('ml_'));
  const latestMl = results.find((r) => r.id.startsWith('ml_'));

  const [direction, setDirection] = useState<DirectionMode>('non_philology');
  const [cert, setCert] = useState<CertOption>('ml_b2');
  const [mockEnglishCorrect, setMockEnglishCorrect] = useState<number>(19); // 0-30 savol
  const [otherMajorCorrect, setOtherMajorCorrect] = useState<number>(22); // 0-30 savol (boshqa asosiy fan)
  const [mandatoryCorrect, setMandatoryCorrect] = useState<number>(24); // 0-30 majburiy 3 ta fan (1.1 balldan)

  const calc = useMemo(() => {
    const langWeight = direction === 'philology' ? 3.1 : 2.1;
    const otherWeight = direction === 'philology' ? 2.1 : 3.1;
    const langMax = direction === 'philology' ? 93.0 : 63.0;
    const otherMax = direction === 'philology' ? 63.0 : 93.0;

    // Without certificate (raw test score)
    const rawLangScore = Number((mockEnglishCorrect * langWeight).toFixed(1));
    const otherScore = Number(Math.min(otherMax, otherMajorCorrect * otherWeight).toFixed(1));
    const mandatoryScore = Number(Math.min(33.0, mandatoryCorrect * 1.1).toFixed(1));
    const totalWithoutCert = Number((rawLangScore + otherScore + mandatoryScore).toFixed(1));

    // Official UzBMB / OTM exemption check:
    // Note: For philology / foreign language majors, C1 (or specific IELTS) guarantees 100% max;
    // For non-philology majors, B2 (Multilevel 50+ or IELTS 5.5/6.0+) grants full max score of that block!
    const grantsFullExemption =
      cert === 'ml_c1' ||
      cert === 'ielts_70' ||
      (direction === 'non_philology' && (cert === 'ml_b2' || cert === 'ielts_55' || cert === 'ielts_60'));

    const certLangScore = grantsFullExemption ? langMax : rawLangScore;
    const bonusGain = Number(Math.max(0, certLangScore - rawLangScore).toFixed(1));
    const totalWithCert = Number((certLangScore + otherScore + mandatoryScore).toFixed(1));

    const maxWithC1 = Number((langMax + otherScore + mandatoryScore).toFixed(1));

    return {
      langWeight,
      langMax,
      rawLangScore,
      otherScore,
      mandatoryScore,
      totalWithoutCert,
      certLangScore,
      bonusGain,
      totalWithCert,
      maxWithC1,
      grantsFullExemption,
    };
  }, [direction, cert, mockEnglishCorrect, otherMajorCorrect, mandatoryCorrect]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="bg-gradient-to-br from-[#0e0d1d] via-[#1c1640] to-[#083b31] text-white px-5 pt-5 pb-7 rounded-b-[2rem] shadow-lg">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-white/80 hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          <span>Study Lab menyusiga qaytish</span>
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider bg-white/10 text-[#c4f82a] px-2.5 py-1 rounded-full mb-2">
              <GraduationCap size={12} />
              <span>O'zbekiston OTM · Bilimni baholash agentligi</span>
            </span>
            <h1 className="text-xl font-black leading-tight">OTM Imtiyoz & Ball Kalkulyatori</h1>
            <p className="text-xs text-white/75 mt-1">
              IELTS yoki Multilevel sertifikati DTM balingizga necha ball foyda berishini hisoblang.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Calculator size={24} className="text-[#c4f82a]" />
          </div>
        </div>

        {(latestIelts || latestMl) && (
          <div className="mt-4 bg-white/10 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-white/80">Study Lab oxirgi natijangiz:</span>
            <span className="font-black text-[#c4f82a]">
              {latestMl ? `Multilevel: ${latestMl.overallBand}/75` : ''}
              {latestMl && latestIelts ? ' · ' : ''}
              {latestIelts ? `IELTS: Band ${latestIelts.overallBand}` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        {/* Yo'nalish turi */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2.5">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">1. Topshirayotgan yo'nalishingiz</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setDirection('non_philology');
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                direction === 'non_philology'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <p className="text-xs font-black">IT, Iqtisod, Tibbiyot, Texnika</p>
              <p className="text-[11px] opacity-80 mt-0.5">Chet tili 2-fan (max 63.0 ball) · B2 yetarli*</p>
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setDirection('philology');
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                direction === 'philology'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <p className="text-xs font-black">Filologiya / Xorijiy tillar</p>
              <p className="text-[11px] opacity-80 mt-0.5">Chet tili 1-fan (max 93.0 ball) · C1 talab etiladi*</p>
            </button>
          </div>
        </div>

        {/* Sertifikat darajasi */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-2.5">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">2. Sertifikatingiz (yoki maqsadingiz)</p>
          <div className="grid grid-cols-1 gap-1.5">
            {CERT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  triggerHaptic('light');
                  setCert(opt.id);
                }}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  cert === opt.id
                    ? 'bg-[#7052ff] text-white border-[#7052ff] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${cert === opt.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                  {opt.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">3. Testda to'g'ri yechadigan savollaringiz</p>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Chet tili (sertifikatsiz bo'lsa): {mockEnglishCorrect}/30</span>
              <span className="text-indigo-600">{calc.rawLangScore} / {calc.langMax} ball</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={mockEnglishCorrect}
              onChange={(e) => setMockEnglishCorrect(Number(e.target.value))}
              className="w-full accent-[#7052ff]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Asosiy ixtisoslik fani ({direction === 'philology' ? '2-fan' : '1-fan'}): {otherMajorCorrect}/30</span>
              <span className="text-emerald-600">{calc.otherScore} ball</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={otherMajorCorrect}
              onChange={(e) => setOtherMajorCorrect(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>3 ta Majburiy fan jami: {mandatoryCorrect}/30</span>
              <span className="text-slate-600">{calc.mandatoryScore} / 33.0 ball</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={mandatoryCorrect}
              onChange={(e) => setMandatoryCorrect(Number(e.target.value))}
              className="w-full accent-slate-700"
            />
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-gradient-to-br from-[#0e0d1d] to-[#1e1845] text-white rounded-[2rem] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Jami DTM Balingiz</span>
            {calc.grantsFullExemption ? (
              <span className="inline-flex items-center space-x-1 text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} />
                <span>Chet tili blokidan 100% OZOD!</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full">
                Imtiyoz yo'q ({direction === 'philology' ? 'C1 kerak' : 'B2/C1 kerak'})
              </span>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-[#c4f82a]">
                {calc.totalWithCert} <span className="text-base font-bold text-white/60">/ 189.0</span>
              </p>
              <p className="text-xs text-white/70 mt-1">Sertifikatsiz natija: {calc.totalWithoutCert} ball</p>
            </div>
            {calc.bonusGain > 0 && (
              <div className="text-right bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-3.5 py-2">
                <p className="text-[10px] uppercase font-black text-emerald-300">Sof foyda</p>
                <p className="text-lg font-black text-emerald-300">+{calc.bonusGain} ball</p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-white/65 leading-relaxed">
            *Eslatma: Konkret OTM va yo'nalishlar bo'yicha B2 yoki C1 talabi DTM/UzBMB ning joriy yilgi qabul jadvaliga qarab farq qilishi mumkin. C1 (Multilevel 65+ yoki IELTS 7.0+) barcha yo'nalishlarda maksimal {calc.langMax} ball kafolatlaydi (sizda bu {calc.maxWithC1} ball bo'ladi).
          </p>

          {onGoExam && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => onGoExam('multilevel')}
                className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
              >
                <TrendingUp size={15} />
                <span>Multilevel Mashq</span>
              </button>
              <button
                onClick={() => onGoExam('ielts')}
                className="py-3 rounded-xl bg-[#7052ff] hover:bg-indigo-600 text-white text-xs font-black flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
              >
                <Sparkles size={15} />
                <span>IELTS Mashq</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
