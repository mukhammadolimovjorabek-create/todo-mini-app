import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Users, RotateCcw, Clock, ShieldAlert, ChevronRight, Share2, Check, Lock, AlertTriangle, Send, Sparkles } from 'lucide-react';
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
  const [matchedPartner, setMatchedPartner] = useState<any>(null);


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

  // Like/Dislike rating modal on exit
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<'like' | 'dislike' | null>(null);
  const [dislikeReason, setDislikeReason] = useState<string>('');

  // Real room ID for Telegram direct pairing
  const urlRoom = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : null;
  const [roomId] = useState(() => urlRoom || ('room_' + Math.floor(100000 + Math.random() * 900000)));
  const [isDirectInvite, setIsDirectInvite] = useState(() => Boolean(urlRoom));
  const [selectedPart, setSelectedPart] = useState<RoomPart | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [, setWs] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Audio / Push-to-talk states
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cross-platform audio references
  const persistentStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Unlock mobile audio playback upon any user gesture
  const unlockAudioContext = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
      silentAudio.play().catch(() => {});
    } catch {}
  };

  // Reusable microphone stream: requested ONCE, kept active/muted so Telegram never prompts again!
  const getAudioStream = async (): Promise<MediaStream> => {
    if (persistentStreamRef.current && persistentStreamRef.current.active) {
      persistentStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
      return persistentStreamRef.current;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    persistentStreamRef.current = stream;
    return stream;
  };

  // Cleanup microphone tracks when component unmounts
  useEffect(() => {
    return () => {
      if (persistentStreamRef.current) {
        persistentStreamRef.current.getTracks().forEach((track) => track.stop());
        persistentStreamRef.current = null;
      }
    };
  }, []);

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

  // Auto-start search if user joined via room invite URL
  useEffect(() => {
    if (urlRoom && matchStatus === 'idle') {
      setIsDirectInvite(true);
      setMatchStatus('searching');
    }
  }, [urlRoom]);

  // Keep lock state synced
  useEffect(() => {
    const current = getDislikesCount(userId);
    setDislikes(current);
    setIsLocked(current >= 10);
  }, [userId]);

  const handleShareInvite = () => {
    triggerHaptic('medium');
    setIsDirectInvite(true);
    setMatchStatus('searching');
    const inviteUrl = `${window.location.origin}?room=${roomId}&module=english`;
    const shareText = `Salom! Men bilan IELTS Speaking mashq qilasizmi? Bosing va kiring: ${inviteUrl}`;
    
    const tg = getTelegramWebApp();
    if (tg && typeof (tg as any).openTelegramLink === 'function') {
      (tg as any).openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`);
    } else {
      navigator.clipboard?.writeText?.(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    }
  };

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/aac'];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  const startRecording = async () => {
    try {
      triggerHaptic('medium');
      unlockAudioContext();
      const stream = await getAudioStream();

      audioChunksRef.current = [];
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mikrofon xatosi:', err);
      alert('Mikrofondan foydalanishga ruxsat berilmadi. Iltimos brauzer yoki Telegram sozlamalarida mikrofonga ruxsat bering.');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    triggerHaptic('medium');
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const mimeType = getSupportedMimeType();
        const recordedType = mediaRecorderRef.current?.mimeType || mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const targetWs = wsRef.current;
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({ type: 'voice_note', audio: base64Audio }));
          } else {
            console.warn("WebSocket not open, cannot send voice note");
          }
        };
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.stop();
    }
  };

  const playIncomingAudio = async (audioUri: string) => {
    try {
      unlockAudioContext();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      let playSrc = audioUri;
      if (audioUri.startsWith('data:')) {
        try {
          const parts = audioUri.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'audio/mp4';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          playSrc = URL.createObjectURL(blob);
        } catch {
          playSrc = audioUri;
        }
      }

      const audio = new Audio(playSrc);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setIsPartnerSpeaking(false);
      };
      audio.onerror = () => {
        setIsPartnerSpeaking(false);
      };
      await audio.play();
      setIsPartnerSpeaking(true);
    } catch (e) {
      console.log('Autoplay deferred or error:', e);
      setIsPartnerSpeaking(false);
    }
  };

  const handleEndSession = () => {
    triggerHaptic('medium');
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
      setWs(null);
    }
    if (isRecording) {
      stopRecording();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (persistentStreamRef.current) {
      persistentStreamRef.current.getTracks().forEach((track) => track.stop());
      persistentStreamRef.current = null;
    }
    setIsPartnerSpeaking(false);
    setMatchStatus('idle');
    setShowRatingModal(true);
  };

  // WebSocket Search logic
  useEffect(() => {
    let interval: any;
    if (matchStatus === 'searching') {
      interval = setInterval(() => {
        setSearchTimer((prev: number) => {
          if (prev >= 60) {
            handleCancelSearch();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      
      const targetRoom = isDirectInvite ? roomId : '';
      const socket = new WebSocket(`wss://todo-mini-app-cwkd.onrender.com/ws/matchmake?user_id=${userId}&user_name=${encodeURIComponent(userName)}&gender=${userGender || 'male'}&filter_gender=${filterGender}&room_id=${targetRoom}`);
      wsRef.current = socket;
      setWs(socket);

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'match_found') {
          setMatchedPartner(data.partner);
          setMatchStatus('matched');
          triggerHaptic('heavy');
          unlockAudioContext();
        } else if (data.type === 'voice_note') {
          if (data.audio) {
            setLastAudioUrl(data.audio);
            triggerHaptic('heavy');
            playIncomingAudio(data.audio);
          }
        } else if (data.type === 'chat_message') {
          if (data.text === 'TURN_SWITCH') {
            setSpeakerTurn(prev => prev === 'me' ? 'partner' : 'me');
            triggerHaptic('light');
          } else if (data.text.startsWith('PART_SELECT_')) {
            const chosen = data.text.replace('PART_SELECT_', '').toLowerCase() as RoomPart;
            setSelectedPart(chosen);
            triggerHaptic('heavy');
          } else if (data.text === 'PART_DESELECT') {
            setSelectedPart(null);
            triggerHaptic('light');
          }
        } else if (data.type === 'partner_left') {
          handleEndSession();
        }
      };
      socket.onclose = () => {
        setWs(null);
        wsRef.current = null;
      };
    }

    return () => {
      if (interval) clearInterval(interval);
      // NOTE: Do NOT close socket here because when transitioning from searching -> matched,
      // React unmounts this effect and closing the socket would kill the active match!
    };
  }, [matchStatus, userId]);

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

  const choosePart = (p: RoomPart) => {
    triggerHaptic('medium');
    setSelectedPart(p);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat_message', text: `PART_SELECT_${p.toUpperCase()}` }));
    }
  };

  const deselectPart = () => {
    triggerHaptic('light');
    setSelectedPart(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat_message', text: 'PART_DESELECT' }));
    }
  };

  const handleStartSearch = () => {
    triggerHaptic('medium');
    setIsDirectInvite(false);
    setSearchTimer(0);
    setMatchStatus('searching');
  };

  const handleCancelSearch = () => {
    triggerHaptic('light');
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
      setWs(null);
    }
    setMatchStatus('idle');
    setSearchTimer(0);
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
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
      setWs(null);
    }
    if (persistentStreamRef.current) {
      persistentStreamRef.current.getTracks().forEach((track) => track.stop());
      persistentStreamRef.current = null;
    }
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
                {isDirectInvite ? "Do'stingiz kutilmoqda..." : "Mos sherik qidirilmoqda..."}
              </h3>
              <p className="text-xs text-slate-500">
                {isDirectInvite ? `Xona ID: ${roomId} • Do'stingiz havola orqali kirsa avtomat ulanadi` : filterGender === 'female' ? "Faqat qizlar filtri faol" : filterGender === 'male' ? "Faqat o'g'il bolalar filtri faol" : "Barcha faol talabalar tekshirilmoqda"}
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
                    {matchedPartner.name ? matchedPartner.name[0].toUpperCase() : '👤'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-slate-900">{matchedPartner.name}</h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Bog'landi 🟢
                    </span>
                  </div>
                  {(() => {
                    const l = Number(matchedPartner.likes || 0);
                    const d = Number(matchedPartner.dislikes || 0);
                    const netLikes = Math.max(0, l - d);
                    const netDislikes = Math.max(0, d - l);
                    return (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-medium">
                        <span className="text-indigo-600 font-bold flex items-center gap-1">
                          👍 {netLikes} ta like
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-500 font-bold flex items-center gap-1">
                          👎 {netDislikes} ta dislike
                        </span>
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Turn switch button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  const nextTurn = speakerTurn === 'me' ? 'partner' : 'me';
                  setSpeakerTurn(nextTurn);
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'chat_message', text: 'TURN_SWITCH' }));
                  }
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

            {/* Part Selection Screen if not selected yet */}
            {!selectedPart ? (
              <div className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-sm space-y-3.5 text-center animate-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">Mashq bo'limini tanlang 🎯</h3>
                  <p className="text-xs text-slate-500">Ikkalangiz birga mashq qiladigan bo'limni tanlang:</p>
                </div>

                <div className="space-y-2 text-left">
                  <button
                    onClick={() => choosePart('part1')}
                    className="w-full p-3.5 rounded-2xl border border-indigo-100 hover:border-[#7052ff] bg-indigo-50/40 hover:bg-indigo-50 flex items-center justify-between transition-all active:scale-[0.98] group"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-[#7052ff]">Part 1: Savollar (Interview)</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">Shaxsiy hayot va qiziqishlar bo'yicha qisqa savollar</p>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white text-[#7052ff] font-black text-xs flex items-center justify-center shadow-xs">
                      1
                    </div>
                  </button>

                  <button
                    onClick={() => choosePart('part2')}
                    className="w-full p-3.5 rounded-2xl border border-amber-100 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50 flex items-center justify-between transition-all active:scale-[0.98] group"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-amber-700">Part 2: Cue Card (Nutq)</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">1 min tayyorgarlik va 2 min monolog nutqi</p>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white text-amber-600 font-black text-xs flex items-center justify-center shadow-xs">
                      2
                    </div>
                  </button>

                  <button
                    onClick={() => choosePart('part3')}
                    className="w-full p-3.5 rounded-2xl border border-emerald-100 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 flex items-center justify-between transition-all active:scale-[0.98] group"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700">Part 3: Munozara (Discussion)</h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">Chuqur mavzular bo'yicha tahliliy muloqot</p>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-white text-emerald-600 font-black text-xs flex items-center justify-center shadow-xs">
                      3
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-100 px-3.5 py-2 rounded-2xl text-xs font-black text-slate-700 border border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {selectedPart === 'part1' ? 'Part 1 (Savollar)' : selectedPart === 'part2' ? 'Part 2 (Cue Card)' : 'Part 3 (Munozara)'}
                </span>
                <button
                  onClick={deselectPart}
                  className="text-[#7052ff] hover:text-[#5b3ce0] flex items-center space-x-1 text-[11px] font-bold"
                >
                  <RotateCcw size={12} />
                  <span>Bo'limni almashtirish</span>
                </button>
              </div>
            )}

            {/* ── PART 1 SECTION ── */}
            {selectedPart === 'part1' && (
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
            {selectedPart === 'part2' && (
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
            {selectedPart === 'part3' && (
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

            {/* Live Voice Chat / Push-to-Talk Communicator */}
            <div className="bg-gradient-to-br from-indigo-900 via-[#1e1a44] to-[#0e0d1d] text-white rounded-3xl p-5 border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isPartnerSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
                  <span className="text-xs font-black tracking-wide">
                    {isPartnerSpeaking ? "🔊 Sherigingiz ovozi yangramoqda..." : "🎙️ Jonli Ovozli Muloqot"}
                  </span>
                </div>
              </div>

              {/* Prominent Audio Player Card for received voice notes */}
              {lastAudioUrl && (
                <div className="bg-white/10 border border-emerald-400/40 rounded-2xl p-3.5 flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{isPartnerSpeaking ? '🔊' : '🎙️'}</span>
                    <div>
                      <h5 className="text-xs font-black text-white">
                        {isPartnerSpeaking ? "Ovoz tinglanmoqda..." : "Yangi ovozli xabar keldi!"}
                      </h5>
                      <p className="text-[10px] text-emerald-300 font-medium">
                        {isPartnerSpeaking ? "Jonli ijro etilmoqda" : "Eshitish uchun tugmani bosing"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      if (isPartnerSpeaking && currentAudioRef.current) {
                        currentAudioRef.current.pause();
                        setIsPartnerSpeaking(false);
                      } else if (lastAudioUrl) {
                        playIncomingAudio(lastAudioUrl);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#c4f82a] text-[#0e0d1d] font-black text-xs shadow-md active:scale-95 transition-all flex items-center space-x-1 shrink-0"
                  >
                    <span>{isPartnerSpeaking ? "⏸️ To'xtatish" : "▶️ Tinglash"}</span>
                  </button>
                </div>
              )}

              {/* Microphone interaction card */}
              <div className="flex flex-col items-center justify-center py-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/30 shadow-rose-500/50'
                      : 'bg-[#c4f82a] text-[#0e0d1d] hover:bg-[#b5eb22] shadow-emerald-500/30'
                  }`}
                >
                  {isRecording ? (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">⏹️</span>
                      <span className="text-[10px] font-black uppercase mt-0.5">To'xtatish</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">🎙️</span>
                      <span className="text-[10px] font-black uppercase mt-0.5">Gapirish</span>
                    </div>
                  )}
                </button>

                <div className="text-center space-y-1">
                  {isRecording ? (
                    <div className="flex items-center justify-center space-x-2 text-rose-300 font-mono text-sm font-black">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>Ovoz yozilmoqda: 00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-medium">
                      Mikrofonni bosing va gapiring. Tugatgach yana bosing — ovozingiz sherigingizga boradi!
                    </p>
                  )}
                </div>
              </div>
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
                      try {
                        await fetch(`https://todo-mini-app-cwkd.onrender.com/api/rate_partner`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ 
                              partner_id: matchedPartner.id, 
                              rater_id: userId,
                              action: selectedSticker,
                              reason: dislikeReason
                            })
                        });
                      } catch (err) {
                        console.error('Rating error:', err);
                      }
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
