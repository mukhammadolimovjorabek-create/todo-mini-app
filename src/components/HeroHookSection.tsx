import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface HeroHookSectionProps {
  userName: string;
  greeting: string;
  coins: number;
  floatingCoin: { amount: number; key: number } | null;
  onOpenEnglish?: () => void;
  hideIeltsCard?: boolean;
}

const TYPEWRITER_PHRASES = [
  '🎙️ AI Examiner bilan Speaking topshirib Band ballingizni bilib oling!',
  '📊 Writing Task 1 diagramma va Task 2 insholarni 10 soniyada tekshiring!',
  '🇺🇿 Milliy Sertifikat (75 ballik CEFR B1–C1) sinovida o\'zingizni sinang!',
  '👥 Jonli Sherik topib, ingliz tilida ovozli suhbat quring!',
  '📖 Academic Reading (3 ta Passage, 40 savol) va xatolar tahlilini ko\'ring!',
];

export const HeroHookSection: React.FC<HeroHookSectionProps> = ({
  userName,
  greeting,
  coins,
  floatingCoin,
  onOpenEnglish,
  hideIeltsCard = false,
}) => {
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour < 6;
  const isMorning = hour >= 6 && hour < 12;

  // ── #7: Typewriter AI State ──
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIdx];
    const speed = isDeleting ? 22 : 42;

    const timer = setTimeout(() => {
      if (!isDeleting && typedText.length < currentPhrase.length) {
        setTypedText(currentPhrase.slice(0, typedText.length + 1));
      } else if (!isDeleting && typedText.length === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && typedText.length > 0) {
        setTypedText(currentPhrase.slice(0, typedText.length - 1));
      } else if (isDeleting && typedText.length === 0) {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIdx]);

  // ── #10: 3D Tilt & Spotlight State ──
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50, active: false });

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const rotateY = ((pctX - 50) / 50) * 8; // -8deg to +8deg
    const rotateX = -((pctY - 50) / 50) * 7; // -7deg to +7deg

    setTilt({ rotateX, rotateY, spotX: pctX, spotY: pctY, active: true });
  };

  const resetTilt = () => {
    setTilt((prev) => ({ ...prev, rotateX: 0, rotateY: 0, active: false }));
  };

  return (
    <div className="space-y-3.5">
      <style>{`
        @keyframes skyShootingStar {
          0% { transform: translateX(0) translateY(0) rotate(-25deg); opacity: 0; }
          10% { opacity: 1; }
          40% { transform: translateX(-180px) translateY(75px) rotate(-25deg); opacity: 0; }
          100% { transform: translateX(-180px) translateY(75px) rotate(-25deg); opacity: 0; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes cardShimmerSweep {
          0% { transform: translateX(-130%) skewX(-20deg); }
          45%, 100% { transform: translateX(220%) skewX(-20deg); }
        }
        @keyframes sunFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.06); }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* #8: DYNAMIC TIME-OF-DAY SKY HEADER + #7: TYPEWRITER AI BUBBLE     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-[2rem] p-4.5 relative overflow-hidden shadow-md border transition-all"
        style={{
          background: isNight
            ? 'linear-gradient(135deg, #0d0b26 0%, #191347 55%, #2b1d6e 100%)'
            : isMorning
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)'
            : 'linear-gradient(135deg, #17153b 0%, #261fb3 55%, #3b28cc 100%)',
          borderColor: 'rgba(165, 180, 252, 0.25)',
        }}
      >
        {/* Night Sky Stars & Shooting Star */}
        {isNight ? (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute top-2.5 left-1/4 text-[10px] text-amber-200" style={{ animation: 'starTwinkle 2.2s infinite ease-in-out' }}>✦</span>
            <span className="absolute top-6 left-1/2 text-[8px] text-indigo-200" style={{ animation: 'starTwinkle 3.1s infinite ease-in-out 0.6s' }}>★</span>
            <span className="absolute top-3 right-24 text-[11px] text-[#c4f82a]" style={{ animation: 'starTwinkle 2.7s infinite ease-in-out 1.1s' }}>✦</span>
            <span className="absolute bottom-12 right-12 text-[8px] text-purple-200" style={{ animation: 'starTwinkle 2.5s infinite ease-in-out 0.3s' }}>✦</span>
            {/* Glowing Moon Aura */}
            <div className="absolute -top-6 right-16 w-20 h-20 rounded-full bg-amber-300/15 blur-xl" />
            {/* Shooting Star */}
            <div
              className="absolute top-2 right-6 w-14 h-[2px] bg-gradient-to-l from-transparent via-[#c4f82a] to-white rounded-full"
              style={{ animation: 'skyShootingStar 5s infinite ease-out 1s' }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Daytime / Morning Sun Rays */}
            <div
              className="absolute -top-8 right-12 w-28 h-28 rounded-full bg-amber-400/20 blur-2xl"
              style={{ animation: 'sunFloat 4s infinite ease-in-out' }}
            />
            <span className="absolute top-3 right-24 text-xs text-amber-300/80" style={{ animation: 'starTwinkle 3s infinite ease-in-out' }}>☀</span>
          </div>
        )}

        {/* Greeting & Coins Row */}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-indigo-200">{greeting},</span>
              <span className="text-xs">{isNight ? '🌙' : isMorning ? '🌅' : '☀️'}</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
              {userName}! 👋
            </h1>
            <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Coins Counter */}
          <div className="relative">
            <div className="flex items-center space-x-1.5 bg-white/10 border border-amber-300/40 px-3.5 py-1.5 rounded-full shadow-sm backdrop-blur-md">
              <span className="text-lg select-none">🪙</span>
              <span className="text-sm font-black text-[#c4f82a] tracking-tight">{coins}</span>
            </div>

            {floatingCoin && (
              <div
                key={floatingCoin.key}
                className="absolute -top-7 right-1 pointer-events-none text-xs font-black text-[#121124] bg-[#c4f82a] px-2 py-0.5 rounded-full shadow-md animate-bounce"
              >
                +{floatingCoin.amount} 🪙
              </div>
            )}
          </div>
        </div>

        {/* #7: Typewriter AI Assistant Bar */}
        <div
          onClick={onOpenEnglish}
          className="mt-3 relative z-10 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2 flex items-center space-x-2 cursor-pointer transition-all"
        >
          <span className="inline-flex items-center space-x-1 bg-[#c4f82a] text-[#121124] text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(196,248,42,0.6)]">
            <Sparkles size={10} />
            <span>AI</span>
          </span>
          <p className="text-[11px] font-bold text-white truncate flex-1">
            <span>{typedText}</span>
            <span className="inline-block w-[2px] h-3.5 bg-[#c4f82a] ml-0.5 align-middle animate-pulse" />
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* #10: IELTS & MULTILEVEL CARD WITH 3D TILT & SPOTLIGHT (NO #6)      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {onOpenEnglish && !hideIeltsCard && (
        <div
          ref={cardRef}
          onClick={onOpenEnglish}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseLeave={resetTilt}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={resetTilt}
          className="rounded-[2.2rem] p-5 text-white shadow-xl cursor-pointer border border-indigo-400/30 relative overflow-hidden select-none"
          style={{
            background: 'linear-gradient(135deg, #100b2e 0%, #1e135e 50%, #341299 100%)',
            transform: `perspective(850px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.active ? 1.015 : 1})`,
            transition: tilt.active ? 'transform 60ms linear' : 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: tilt.active
              ? '0 20px 40px -12px rgba(112, 82, 255, 0.55), 0 0 24px rgba(196, 248, 42, 0.3)'
              : undefined,
          }}
        >
          {/* Ambient neon glow */}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#c4f82a]/20 rounded-full blur-2xl pointer-events-none" />

          {/* #10: Interactive Finger/Mouse Spotlight */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: tilt.active ? 1 : 0,
              background: `radial-gradient(200px circle at ${tilt.spotX}% ${tilt.spotY}%, rgba(196, 248, 42, 0.22), rgba(112, 82, 255, 0.15) 45%, transparent 80%)`,
            }}
          />

          {/* Periodic Glass Shimmer Sweep */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ animation: 'cardShimmerSweep 4.5s infinite ease-in-out' }}
            />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[#c4f82a]/20 border border-[#c4f82a]/40 flex items-center justify-center font-black text-base text-[#c4f82a] shrink-0 shadow-inner backdrop-blur-xs uppercase">
                {userName ? userName.slice(0, 2).toUpperCase() : 'ME'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="animate-bounce inline-block text-[11px] font-black bg-[#c4f82a] text-[#121124] px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(196,248,42,0.9),0_0_22px_rgba(196,248,42,0.5)] whitespace-nowrap">
                    Yangi 🔥
                  </span>
                  <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">IELTS & CEFR</span>
                </div>
                <h4 className="text-sm font-black text-white tracking-tight leading-tight">
                  IELTS & Multilevel Practice
                </h4>
                <p className="text-[11px] text-purple-200/90 truncate mt-0.5 font-medium">
                  AI Examiner (9.0), Writing & Jonli Sheriklik
                </p>
              </div>
            </div>

            {/* Boshlash tugmasi */}
            <div className="pl-2 shrink-0">
              <button
                type="button"
                className="eng-cta inline-flex items-center space-x-1.5 bg-[#c4f82a] text-[#121124] px-4 py-2.5 rounded-full text-xs font-black shadow-md select-none cursor-pointer"
              >
                <span>Boshlash</span>
                <span className="eng-cta__arrow font-sans font-bold" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
