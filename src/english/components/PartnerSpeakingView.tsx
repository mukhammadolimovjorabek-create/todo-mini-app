import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, RotateCcw, Clock, ShieldAlert, PhoneCall, ChevronRight, Share2, Check, Lock, AlertTriangle, Send, Sparkles } from 'lucide-react';
import { getRandomPart1Topic, getRandomPart2Topic, getRandomPart3Topic, type Part1Topic, type Part2CueCard, type Part3Topic } from '../data/speakingBank';
import { triggerHaptic, getTelegramWebApp, getTelegramUser } from '../../utils/telegram';
import {
  getDislikesCount,
  setDislikesCount,
  recordDislike,
  recordLike,
  isUserLocked,
  unlockUser,
  notifyAdminForUnlock,
} from '../utils/reputation';

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
  const telegramUser = getTelegramUser();
  const userId = telegramUser?.id || 'me';
  const isDev = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');

  // Reputation & Lock states
  const [dislikes, setDislikes] = useState<number>(() => getDislikesCount(userId));
  const [isLocked, setIsLocked] = useState<boolean>(() => isUserLocked(userId));
  const [isNotifyingAdmin, setIsNotifyingAdmin] = useState(false);
  const [adminNotified, setAdminNotified] = useState(false);
  const [unlockedToast, setUnlockedToast] = useState(false);

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

  // Like/Dislike rating modal on exit
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<'like' | 'dislike' | null>(null);
  const [dislikeReason, setDislikeReason] = useState<string>('');

  // Real room ID for Telegram direct pairing
  const [roomId] = useState(() => 'room_' + Math.floor(100000 + Math.random() * 900000));
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Check URL params for unblock query (?unblocked=1)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('unblocked') === '1' || urlParams.get('unblock') === 'true') {
      unlockUser(userId);
      setDislikes(0);
      setIsLocked(false);
      setUnlockedToast(true);
      setTimeout(() => setUnlockedToast(false), 5000);
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } catch {
        // ignore
      }
    }
  }, [userId]);

  // Keep lock state synced
  useEffect(() => {
    const current = getDislikesCount(userId);
    setDislikes(current);
    setIsLocked(current >= 10);
  }, [userId]);

  const handleShareInvite = () => {
    triggerHaptic('medium');
    const inviteUrl = `${window.location.origin}?room=${roomId}&module=english`;
    const shareText = `Salom! Men bilan IELTS Speaking mashq qilasizmi? Xona ID: ${roomId}`;
    
    const tg = getTelegramWebApp();
    if (tg && typeof (tg as any).openTelegramLink === 'function') {
      (tg as any).openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`);
    } else {
      navigator.clipboard?.writeText?.(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  // Search interval
  useEffect(() => {
    let interval: any;
    if (matchStatus === 'searching') {
      interval = setInterval(() => {
        setSearchTimer((prev: number) => prev + 1);
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
        setP2Timer((prev: number) => prev - 1);
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

  const handleRequestUnlock = async () => {
    setIsNotifyingAdmin(true);
    triggerHaptic('heavy');
    await notifyAdminForUnlock({
      id: userId,
      name: telegramUser?.first_name || userName || 'Foydalanuvchi',
      username: telegramUser?.username,
    });
    setIsNotifyingAdmin(false);
    setAdminNotified(true);
  };

  const handleLeaveRoom = () => {
    triggerHaptic('medium');
    setSelectedSticker(null);
    setDislikeReason('');
    setShowRatingModal(true);
  };

  const handleFinishRating = () => {
    triggerHaptic('heavy');
    if (matchedPartner) {
      if (selectedSticker === 'dislike') {
        recordDislike(matchedPartner.id);
      } else if (selectedSticker === 'like') {
        recordLike(matchedPartner.id);
      }
    }

    setShowRatingModal(false);
    setSelectedSticker(null);
    setDislikeReason('');
    setMatchedPartner(null);
    setMatchStatus('idle');
    setHasSharedConsent(false);
    setPartnerConsented(false);
  };

  // ── RENDER LOCKED STATE IF USER HAS >= 10 DISLIKES ──
  if (isLocked) {
    return (
      <div className="english-root min-h-screen bg-[#0a0818] text-slate-100 flex flex-col pb-10">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 bg-[#110e24]/90 backdrop-blur-md border-b border-rose-950/40 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Qulflangan
            </span>
            <h2 className="text-base font-black text-white">Sherik bilan Speaking</h2>
          </div>
          <div className="w-9" />
        </div>

        {/* Lock Body */}
        <div className="p-5 flex-1 max-w-md mx-auto w-full flex flex-col justify-center space-y-5 animate-in fade-in duration-300">
          {/* Animated Lock Shield */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-rose-500/40 animate-pulse" />
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 border border-rose-400/30">
              <Lock size={36} className="text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white tracking-tight">
              Suhbat bo'limi qulflangan! 🔒
            </h3>
            <p className="text-xs text-rose-300/90 font-medium leading-relaxed bg-rose-950/30 p-3.5 rounded-2xl border border-rose-800/40 text-left">
              ⚠️ <strong className="text-rose-200">Sababi:</strong> Siz <b>10 ta shikoyat/dislike</b> oldingiz (odob-axloq qoidalarini buzganlik, kontakt so'rash yoki noo'rin xatti-harakatlar uchun).
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-[#171330] to-[#1e173e] rounded-3xl p-5 border border-rose-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Qulfni ochish to'lovi
                </span>
                <span className="text-2xl font-black text-[#c4f82a] tracking-tight">
                  6,700 so'm
                </span>
              </div>
              <span className="text-xs font-bold bg-white/10 text-white px-3 py-1 rounded-full border border-white/10">
                1 martalik to'lov
              </span>
            </div>

            <p className="text-[11px] text-slate-300/80 leading-relaxed">
              To'lov qilib adminga chekni yuborganingizdan so'ng hisobingizdagi barcha jarimalar 0 ga tushiriladi va speaking tizimi darhol ochiladi.
            </p>

            {/* Notification Sent or Action Button */}
            {adminNotified ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-2 text-emerald-200 text-xs">
                <div className="flex items-center space-x-2 font-bold">
                  <Check size={16} className="text-emerald-400" />
                  <span>Adminga xabarnoma yuborildi!</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  Admin tez orada bot orqali sizga karta yoki telefon raqamini yuboradi. To'lov chekini botga rasm sifatida tashlasangiz, dostup beriladi.
                </p>
              </div>
            ) : (
              <button
                onClick={handleRequestUnlock}
                disabled={isNotifyingAdmin}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isNotifyingAdmin ? (
                  <>
                    <RotateCcw className="animate-spin" size={18} />
                    <span>Adminga yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>To'lov qilish / Adminga murojaat</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                const refreshed = getDislikesCount(userId);
                setDislikes(refreshed);
                setIsLocked(refreshed >= 10);
                triggerHaptic('light');
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            >
              <RotateCcw size={14} />
              <span>Qulf holatini qayta tekshirish</span>
            </button>
          </div>

            {/* Discreet Testing controls for developers only */}
            {isDev && (
              <div className="pt-2 text-center space-y-1">
                <button
                  onClick={() => {
                    unlockUser(userId);
                    setDislikes(0);
                    setIsLocked(false);
                    triggerHaptic('heavy');
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  🛠️ Dev Test: Qulfni ochish (Reset)
                </button>
              </div>
            )}
        </div>
      </div>
    );
  }

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

      {/* Unlocked Toast Banner */}
      {unlockedToast && (
        <div className="mx-5 mt-4 bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center space-x-3 animate-in slide-in-from-top duration-300">
          <Check size={20} className="shrink-0 text-emerald-200" />
          <div>
            <h4 className="text-xs font-black">Qulf ochildi! 🎉</h4>
            <p className="text-[11px] text-emerald-100">
              Admin to'lovingizni tasdiqladi. Barcha taqiqlar olib tashlandi, bemalol speaking mashq qilishingiz mumkin!
            </p>
          </div>
        </div>
      )}

      <div className="p-5 flex-1 max-w-lg mx-auto w-full space-y-5">
        {/* ── STATE 1: IDLE / SETUP SEARCH ── */}
        {matchStatus === 'idle' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Warning if user has any strikes */}
            {dislikes > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-amber-900 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold">
                    Sizda <b>{dislikes}/10</b> ta shikoyat bor. 10 taga yetsa qulflanadi.
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                  Ehtiyot bo'ling
                </span>
              </div>
            )}

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

            {/* Direct Friend Invite Link for real deployment */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-800 block">Do'stni to'g'ridan-to'g'ri chaqirish</span>
                <span className="text-[10px] text-slate-400">Xona kodi: <code className="font-mono text-emerald-600 font-bold">{roomId}</code></span>
              </div>
              <button
                onClick={handleShareInvite}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#7052ff] text-xs font-bold flex items-center space-x-1.5 transition-all border border-indigo-100 active:scale-95"
              >
                {copiedInvite ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                <span>{copiedInvite ? "Nusxalandi ✓" : "Ulashish / Taklif"}</span>
              </button>
            </div>

            {/* Developer / Testing shortcut (only visible with ?dev=1 in URL) */}
            {isDev && (
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400">🧪 Dev:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const u = recordLike(userId);
                      setDislikes(u);
                      triggerHaptic('light');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px]"
                    title="Like berish (jarimani kamaytiradi)"
                  >
                    +1 👍
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const u = recordDislike(userId);
                      setDislikes(u);
                      if (u >= 10) setIsLocked(true);
                      triggerHaptic('heavy');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px]"
                    title="Dislike berish (+1 jarima)"
                  >
                    +1 👎 ({dislikes}/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDislikesCount(userId, 10);
                      setDislikes(10);
                      setIsLocked(true);
                      triggerHaptic('heavy');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-black text-[10px]"
                    title="10 ta dislike bilan qulflash"
                  >
                    🔒 Qulflash (10 ta)
                  </button>
                </div>
              </div>
            )}
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
                  setSpeakerTurn((prev: 'me' | 'partner') => (prev === 'me' ? 'partner' : 'me'));
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
                      setP1QuestionIdx((prev: number) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    Oldingi savol
                  </button>

                  <button
                    disabled={p1QuestionIdx >= p1Topic.questions.length - 1}
                    onClick={() => {
                      triggerHaptic('light');
                      setP1QuestionIdx((prev: number) => Math.min(p1Topic.questions.length - 1, prev + 1));
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
                      {p2Topic.bulletPoints.map((bp: string, i: number) => (
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
                      setP3QuestionIdx((prev: number) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"
                  >
                    Oldingi savol
                  </button>

                  <button
                    disabled={p3QuestionIdx >= p3Topic.questions.length - 1}
                    onClick={() => {
                      triggerHaptic('light');
                      setP3QuestionIdx((prev: number) => Math.min(p3Topic.questions.length - 1, prev + 1));
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

      {/* ── Partner Rating Modal on Exit (Like / Dislike Stickers) ── */}
      {showRatingModal && matchedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0818]/90 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl border border-indigo-100 text-center animate-in zoom-in-95 duration-200">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-indigo-50 text-[#7052ff] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                <Sparkles size={12} />
                <span>Muloqot madaniyati</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Sherigingizni baholang
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong className="text-slate-800">{matchedPartner.name}</strong> bilan suhbat qanday o'tdi?
              </p>
            </div>

            {/* 2 Sticker Selection Cards */}
            <div className="grid grid-cols-2 gap-3 py-1">
              {/* LIKE STICKER */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setSelectedSticker('like');
                  setDislikeReason('');
                }}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                  selectedSticker === 'like'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-md scale-[1.02]'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl mb-2 transition-transform active:scale-125">
                  👍
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-950 block">Zo'r (Like)</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Odobli, faol va foydali
                  </span>
                </div>

              </button>

              {/* DISLIKE STICKER */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  setSelectedSticker('dislike');
                  if (!dislikeReason) {
                    setDislikeReason("Kontakt/raqam so'rab bezovta qildi");
                  }
                }}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                  selectedSticker === 'dislike'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-md scale-[1.02]'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-3xl mb-2 transition-transform active:scale-125">
                  👎
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-rose-950 block">Yomon (Dislike)</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    Noo'rin harakat / bezovtalik
                  </span>
                </div>

              </button>
            </div>

            {/* Reasons if Dislike is selected */}
            {selectedSticker === 'dislike' && (
              <div className="space-y-1.5 text-left animate-in fade-in duration-200 bg-rose-50/60 p-3 rounded-2xl border border-rose-200/60">
                <span className="text-[10px] font-bold text-rose-900 block">
                  Dislike sababini belgilang:
                </span>
                <div className="space-y-1">
                  {[
                    "Kontakt/raqam so'rab bezovta qildi",
                    "Nomaqbul yoki odobsiz so'zlar",
                    "Inglizcha gaplashmadi / jim o'tirdi",
                    "Darsdan chalg'ituvchi boshqa harakat",
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDislikeReason(reason)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                        dislikeReason === reason
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-rose-100 hover:bg-rose-50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Explanatory rule pill */}
            

            <button
              onClick={async () => {
                  if (matchedPartner && selectedSticker) {
                      await fetch(`https://todo-mini-app-cwkd.onrender.com/api/rate_partner`, {
                          method: 'POST',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ partner_id: matchedPartner.id, action: selectedSticker })
                      });
                  }
                  handleFinishRating();
              }}
              disabled={!selectedSticker}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#5b3ce0] hover:from-[#5b3ce0] hover:to-[#4a2fd0] text-white font-black text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-40"
            >
              Baholashni tasdiqlash va chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
