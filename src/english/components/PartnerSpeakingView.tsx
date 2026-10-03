import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, RotateCcw, Clock, ShieldAlert, PhoneCall, Star, ChevronRight } from 'lucide-react';
import { getRandomPart1Topic, getRandomPart2Topic, getRandomPart3Topic, type Part1Topic, type Part2CueCard, type Part3Topic } from '../data/speakingBank';
import { triggerHaptic } from '../../utils/telegram';

interface Props {
  onBack: () => void;
  userName: string;
  userGender?: 'male' | 'female';
}

type GenderFilter = 'any' | 'female' | 'male';
type RoomPart = 'part1' | 'part2' | 'part3';

interface MatchedPartner {
  id: string;
  name: string;
  gender: 'male' | 'female';
  targetBand: string;
  username: string;
  city: string;
}

// Sample partner pool for realistic matching simulation based on gender preference
const MALE_PARTNERS: MatchedPartner[] = [
  { id: 'p1', name: 'Jasur Bekmirzayev', gender: 'male', targetBand: '7.5', username: 'jasur_ielts7', city: 'Toshkent' },
  { id: 'p2', name: 'Shoxrux Aliyev', gender: 'male', targetBand: '7.0', username: 'shoxrux_eng', city: 'Samarqand' },
  { id: 'p3', name: 'Diyorbek Qodirov', gender: 'male', targetBand: '8.0', username: 'diyor_speaking', city: 'Buxoro' },
  { id: 'p4', name: 'Bobur Mirzayev', gender: 'male', targetBand: '7.5', username: 'bobur_english', city: 'Farg\'ona' },
];

const FEMALE_PARTNERS: MatchedPartner[] = [
  { id: 'p5', name: 'Malika Karimova', gender: 'female', targetBand: '7.5', username: 'malika_ielts', city: 'Toshkent' },
  { id: 'p6', name: 'Laylo Odilova', gender: 'female', targetBand: '8.0', username: 'laylo_speaking', city: 'Samarqand' },
  { id: 'p7', name: 'Zilola Rahimova', gender: 'female', targetBand: '7.0', username: 'zilola_english', city: 'Namangan' },
  { id: 'p8', name: 'Madina Usmonova', gender: 'female', targetBand: '7.5', username: 'madina_ielts9', city: 'Andijon' },
];

export const PartnerSpeakingView: React.FC<Props> = ({ onBack, userName, userGender = 'male' }) => {
  const [filterGender, setFilterGender] = useState<GenderFilter>('any');
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [searchTimer, setSearchTimer] = useState(0);
  const [matchedPartner, setMatchedPartner] = useState<MatchedPartner | null>(null);

  // Active Room state
  const [activePart, setActivePart] = useState<RoomPart>('part1');
  const [p1Topic, setP1Topic] = useState<Part1Topic>(() => getRandomPart1Topic());
  const [p1QuestionIdx, setP1QuestionIdx] = useState(0);

  const [p2Topic, setP2Topic] = useState<Part2CueCard>(() => getRandomPart2Topic());
  const [p2Timer, setP2Timer] = useState(60);
  const [isP2TimerRunning, setIsP2TimerRunning] = useState(false);
  const [p2Phase, setP2Phase] = useState<'prep' | 'speak'>('prep');

  const [p3Topic, setP3Topic] = useState<Part3Topic>(() => getRandomPart3Topic());
  const [p3QuestionIdx, setP3QuestionIdx] = useState(0);

  // Turn management: 'me' | 'partner'
  const [speakerTurn, setSpeakerTurn] = useState<'me' | 'partner'>('me');

  // Telegram consent exchange
  const [hasSharedConsent, setHasSharedConsent] = useState(false);
  const [partnerConsented, setPartnerConsented] = useState(false);

  // Rating modal on exit
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [partnerRating, setPartnerRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Search interval
  useEffect(() => {
    let interval: any;
    if (matchStatus === 'searching') {
      interval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);

      // Simulate match after 3.5 seconds
      const timeout = setTimeout(() => {
        let pool = [...MALE_PARTNERS, ...FEMALE_PARTNERS];
        if (filterGender === 'male') {
          pool = MALE_PARTNERS;
        } else if (filterGender === 'female') {
          pool = FEMALE_PARTNERS;
        }
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setMatchedPartner(picked);
        setMatchStatus('matched');
        triggerHaptic('heavy');
      }, 3500);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [matchStatus, filterGender]);

  // Part 2 Timer
  useEffect(() => {
    let timer: any;
    if (isP2TimerRunning && p2Timer > 0) {
      timer = setInterval(() => {
        setP2Timer((prev) => prev - 1);
      }, 1000);
    } else if (p2Timer === 0) {
      if (p2Phase === 'prep') {
        setP2Phase('speak');
        setP2Timer(120);
        triggerHaptic('heavy');
      } else {
        setIsP2TimerRunning(false);
        triggerHaptic('heavy');
      }
    }
    return () => clearInterval(timer);
  }, [isP2TimerRunning, p2Timer, p2Phase]);

  const handleStartSearch = () => {
    triggerHaptic('medium');
    setSearchTimer(0);
    setMatchStatus('searching');
  };

  const handleCancelSearch = () => {
    triggerHaptic('light');
    setMatchStatus('idle');
    setSearchTimer(0);
  };

  const handleShareConsent = () => {
    triggerHaptic('medium');
    setHasSharedConsent(true);
    // Partner consents shortly after
    setTimeout(() => {
      setPartnerConsented(true);
      triggerHaptic('heavy');
    }, 900);
  };

  const handleLeaveRoom = () => {
    triggerHaptic('medium');
    setShowRatingModal(true);
  };

  const handleFinishRating = () => {
    triggerHaptic('heavy');
    setShowRatingModal(false);
    setMatchedPartner(null);
    setMatchStatus('idle');
    setHasSharedConsent(false);
    setPartnerConsented(false);
  };

  return (
    <div className="english-root min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-10">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (matchStatus === 'matched') {
                handleLeaveRoom();
              } else {
                onBack();
              }
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Jonli Sheriklik
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Sherik bilan Speaking 👥
            </h2>
          </div>
        </div>

        {matchStatus === 'matched' && (
          <button
            onClick={handleLeaveRoom}
            className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-all border border-rose-100"
          >
            Xonadan chiqish
          </button>
        )}
      </div>

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-5">
        {/* ── STATE 1: IDLE / SETUP SEARCH ── */}
        {matchStatus === 'idle' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Banner card */}
            <div
              className="rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl"
              style={{ background: 'linear-gradient(135deg, #091f1a 0%, #0e3b32 60%, #155e51 100%)' }}
            >
              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center space-x-1 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#c4f82a]">
                  <Users size={12} />
                  <span>Real-Time Practice</span>
                </span>
                <h3 className="text-xl font-black">
                  Jonli Speaking Hamkorini Toping! 🚀
                </h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  IELTS rasmiy savollar banki asosida Part 1, 2 va 3 bo'limlarini sherigingiz bilan navbatma-navbat mashq qiling.
                </p>
              </div>
            </div>

            {/* Profile Confirmation */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg">
                  {userGender === 'female' ? '👧' : '👦'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{userName} (Siz)</h4>
                  <p className="text-[11px] text-slate-400">
                    Jins: {userGender === 'female' ? "Ayol / Qiz bola" : "Erkak / O'g'il bola"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">
                Tayyor
              </span>
            </div>

            {/* Gender Preference Filter */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Sherikning jinsini tanlang:
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterGender('any')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    filterGender === 'any'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">🤝</span>
                  <span className="text-[11px] block">Farqi yo'q</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterGender('female')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    filterGender === 'female'
                      ? 'border-pink-500 bg-pink-50/50 text-pink-900 font-bold ring-2 ring-pink-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">👧</span>
                  <span className="text-[11px] block">Faqat qizlar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterGender('male')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    filterGender === 'male'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base block mb-0.5">👦</span>
                  <span className="text-[11px] block">Faqat o'g'illar</span>
                </button>
              </div>
            </div>

            {/* Legal / Safety Disclaimers */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-[11px] text-amber-900 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                <span>Qonuniy va xavfsizlik kafolati</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed text-[10.5px]">
                Platforma o'quv muhitini ta'minlaydi. Ijtimoiy tarmoq kontaktlaringizni almashish faqat sizning shaxsiy xohishingizga bog'liq va uning oqibatlari uchun platforma javobgar bo'lmaydi.
              </p>
            </div>

            {/* Big Search Button */}
            <button
              onClick={handleStartSearch}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Search size={20} />
              <span>Sherik qidirishni boshlash (Search)</span>
            </button>
          </div>
        )}

        {/* ── STATE 2: SEARCHING / RADAR ANIMATION ── */}
        {matchStatus === 'searching' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-6 shadow-sm animate-in fade-in duration-300">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Radar pulse rings */}
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" />
              <div className="absolute inset-4 rounded-full border border-emerald-500/40 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 text-3xl">
                <Search className="animate-spin text-white" size={32} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Mos sherik qidirilmoqda...
              </h3>
              <p className="text-xs text-slate-500">
                {filterGender === 'female' ? "Faqat qizlar filtri faol" : filterGender === 'male' ? "Faqat o'g'il bolalar filtri faol" : "Barcha faol talabalar tekshirilmoqda"}
              </p>
              <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-mono font-bold">
                <Clock size={12} />
                <span>00:{searchTimer < 10 ? `0${searchTimer}` : searchTimer}</span>
              </div>
            </div>

            <button
              onClick={handleCancelSearch}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
            >
              Qidiruvni bekor qilish
            </button>
          </div>
        )}

        {/* ── STATE 3: MATCHED ROOM INTERFACE ── */}
        {matchStatus === 'matched' && matchedPartner && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Matched Partner Header Card */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl">
                    {matchedPartner.gender === 'female' ? '👧' : '👦'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-slate-900">{matchedPartner.name}</h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Bog'landi 🟢
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {matchedPartner.city} • Maqsad: Band {matchedPartner.targetBand}
                  </p>
                </div>
              </div>

              {/* Turn switch button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSpeakerTurn((prev) => (prev === 'me' ? 'partner' : 'me'));
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  speakerTurn === 'me'
                    ? 'bg-indigo-50 border-indigo-200 text-[#7052ff]'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {speakerTurn === 'me' ? '🎙️ Mening navbatim' : '👂 Sherigim navbati'}
              </button>
            </div>

            {/* Speaking Part Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActivePart('part1');
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  activePart === 'part1'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Part 1 (Savollar)
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActivePart('part2');
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  activePart === 'part2'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Part 2 (Cue Card)
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActivePart('part3');
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  activePart === 'part3'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Part 3 (Munozara)
              </button>
            </div>

            {/* ── PART 1 SECTION ── */}
            {activePart === 'part1' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#7052ff] bg-indigo-50 px-2 py-0.5 rounded-md">
                      Mavzu:
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{p1Topic.topic}</h4>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setP1Topic(getRandomPart1Topic());
                      setP1QuestionIdx(0);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                  >
                    <RotateCcw size={12} />
                    <span>Yangi mavzu</span>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Savol {p1QuestionIdx + 1} / {p1Topic.questions.length}</span>
                    <span className="font-mono text-emerald-600 font-bold">1 ta savolga 30-45 soniya</span>
                  </div>
                  <p className="text-base font-black text-slate-900 leading-snug">
                    "{p1Topic.questions[p1QuestionIdx] || p1Topic.questions[0]}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={p1QuestionIdx === 0}
                    onClick={() => {
                      triggerHaptic('light');
                      setP1QuestionIdx((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    Oldingi savol
                  </button>

                  <button
                    disabled={p1QuestionIdx >= p1Topic.questions.length - 1}
                    onClick={() => {
                      triggerHaptic('light');
                      setP1QuestionIdx((prev) => Math.min(p1Topic.questions.length - 1, prev + 1));
                    }}
                    className="px-4 py-2 rounded-xl bg-[#7052ff] text-white text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
                  >
                    <span>Keyingi savol</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── PART 2 SECTION ── */}
            {activePart === 'part2' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    Cue Card #{p2Topic.id}
                  </span>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setP2Topic(getRandomPart2Topic());
                      setP2Timer(60);
                      setP2Phase('prep');
                      setIsP2TimerRunning(false);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                  >
                    <RotateCcw size={12} />
                    <span>Boshqa Card</span>
                  </button>
                </div>

                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 space-y-3">
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {p2Topic.cueCard}
                  </h4>
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-bold text-amber-900 uppercase">You should say:</p>
                    <ul className="space-y-1">
                      {p2Topic.bulletPoints.map((bp, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                          <span className="text-amber-500">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {p2Phase === 'prep' ? 'Tayyorgarlik vaqti (1 min)' : 'Nutq vaqti (2 min)'}
                    </span>
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {Math.floor(p2Timer / 60)}:{p2Timer % 60 < 10 ? `0${p2Timer % 60}` : p2Timer % 60}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setIsP2TimerRunning(!isP2TimerRunning);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        isP2TimerRunning
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isP2TimerRunning ? 'Pauza' : 'Boshlash'}
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setIsP2TimerRunning(false);
                        setP2Phase('prep');
                        setP2Timer(60);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PART 3 SECTION ── */}
            {activePart === 'part3' && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Mavzu:
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{p3Topic.topic}</h4>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setP3Topic(getRandomPart3Topic());
                      setP3QuestionIdx(0);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                  >
                    <RotateCcw size={12} />
                    <span>Yangi mavzu</span>
                  </button>
                </div>

                <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Savol {p3QuestionIdx + 1} / {p3Topic.questions.length}</span>
                    <span className="font-mono text-emerald-700 font-bold">Chuqur tahliliy fikr</span>
                  </div>
                  <p className="text-base font-black text-slate-900 leading-snug">
                    "{p3Topic.questions[p3QuestionIdx] || p3Topic.questions[0]}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={p3QuestionIdx === 0}
                    onClick={() => {
                      triggerHaptic('light');
                      setP3QuestionIdx((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    Oldingi savol
                  </button>

                  <button
                    disabled={p3QuestionIdx >= p3Topic.questions.length - 1}
                    onClick={() => {
                      triggerHaptic('light');
                      setP3QuestionIdx((prev) => Math.min(p3Topic.questions.length - 1, prev + 1));
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
                  >
                    <span>Keyingi savol</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Direct Telegram Connect Option (Mutual Consent) */}
            <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PhoneCall size={16} className="text-[#7052ff]" />
                  <span className="text-xs font-black text-slate-900">Telegram orqali to'g'ridan-to'g'ri qo'ng'iroq</span>
                </div>
                {partnerConsented && hasSharedConsent && (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    Ochildi ✓
                  </span>
                )}
              </div>

              {!hasSharedConsent ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Agar sherigingiz bilan Telegram orqali ovozli qo'ng'iroq qilmoqchi bo'lsangiz, o'z roziligingizni bering. Har ikki tomon ruxsat berganda username ko'rinadi.
                  </p>
                  <button
                    onClick={handleShareConsent}
                    className="w-full py-2.5 rounded-xl bg-[#7052ff] hover:bg-[#5b3ce0] text-white text-xs font-black transition-all shadow-sm active:scale-95"
                  >
                    O'z username'imni ulashishga roziman
                  </button>
                </div>
              ) : !partnerConsented ? (
                <div className="text-center py-2">
                  <span className="text-xs text-indigo-700 font-bold animate-pulse">
                    Sherigingizdan rozilik kutilmoqda...
                  </span>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-3 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Sherigingiz Telegrami:</span>
                    <span className="text-sm font-black text-[#7052ff]">@{matchedPartner.username}</span>
                  </div>
                  <a
                    href={`https://t.me/${matchedPartner.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#7052ff] text-white text-xs font-black hover:bg-[#5b3ce0] transition-all"
                  >
                    Telegramda ochish
                  </a>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Partner Rating Modal on Exit ── */}
      {showRatingModal && matchedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0818]/90 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl border border-indigo-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto">
              ⭐
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Sherigingizni baholang
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {matchedPartner.name} bilan muloqot qanday o'tdi?
              </p>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center space-x-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setPartnerRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    size={28}
                    className={star <= partnerRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Qo'shimcha fikr yoki minnatdorchilik (ixtiyoriy)..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7052ff]/30 resize-none"
            />

            <button
              onClick={handleFinishRating}
              className="w-full py-3.5 rounded-xl bg-[#7052ff] hover:bg-[#5b3ce0] text-white font-black text-xs shadow-md transition-all active:scale-95"
            >
              Baholash va xonani yakunlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
