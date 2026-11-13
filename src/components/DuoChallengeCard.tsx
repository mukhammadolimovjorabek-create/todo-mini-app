import React, { useEffect, useState } from 'react';
import { Flame, Send, Copy, Check, Zap, UserPlus, Unlink } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { loadDuoState, saveDuoState, type DuoState } from '../utils/shop';
import {
  buildMiniAppUrl,
  getTelegramInitData,
  getTelegramUser,
  getTelegramWebApp,
  triggerHaptic,
} from '../utils/telegram';

interface DuoChallengeCardProps {
  onStatusSync?: () => void;
}

export const DuoChallengeCard: React.FC<DuoChallengeCardProps> = ({ onStatusSync }) => {
  const [duo, setDuo] = useState<DuoState>(() => loadDuoState());
  const [canNudge, setCanNudge] = useState(true);
  const [loadingAction, setLoadingAction] = useState<'nudge' | 'unpair' | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const tgUser = getTelegramUser();
  const initData = getTelegramInitData();

  useEffect(() => {
    if (!initData) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/duo`, {
          headers: { 'X-Telegram-Init-Data': initData },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.duo) {
          const next: DuoState = {
            active: true,
            partnerId: Number(data.duo.partnerId) || undefined,
            partnerName: String(data.duo.partnerName || 'Sherik'),
            sharedStreak: Number(data.duo.mutualStreak) || 1,
            partnerActiveToday: Boolean(data.duo.partnerActiveToday),
          };
          setDuo(next);
          setCanNudge(data.duo.canNudge !== false);
          saveDuoState(next, false);
        } else {
          const empty: DuoState = { active: false, sharedStreak: 0 };
          setDuo(empty);
          saveDuoState(empty, false);
        }
      } catch {
        // Offline / local fallback keeps cached state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initData]);

  const inviteUrl = buildMiniAppUrl(tgUser?.id ? `duo_${tgUser.id}` : undefined);

  const handleTelegramInvite = () => {
    triggerHaptic('medium');
    const text = `Study Lab'da men bilan Duo Streak boshlang! Har kuni vazifa va IELTS mashqlarini birga bajaramiz 🔥`;
    const shareLink = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareLink);
    } else {
      window.open(shareLink, '_blank');
    }
  };

  const handleCopyInvite = async () => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback(inviteUrl);
    }
  };

  const handleNudge = async () => {
    if (!initData) {
      setFeedback('Telegram ichida ochilganda turtki yuborish ishlaydi.');
      return;
    }
    setLoadingAction('nudge');
    setFeedback(null);
    triggerHaptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/api/duo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify({ action: 'nudge' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerHaptic('heavy');
        setCanNudge(false);
        setFeedback('Sherigingizga Telegramdan eslatma yuborildi! ⚡');
      } else {
        setFeedback(data?.error || 'Hozir turtki yuborib bo‘lmadi (4 soatlik cheklov).');
      }
    } catch {
      setFeedback('Internet xatosi: qayta urinib ko‘ring.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnpair = async () => {
    triggerHaptic('medium');
    setLoadingAction('unpair');
    try {
      if (initData) {
        await fetch(`${API_BASE_URL}/api/duo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData,
          },
          body: JSON.stringify({ action: 'unpair' }),
        });
      }
      const next: DuoState = { active: false, sharedStreak: 0 };
      setDuo(next);
      saveDuoState(next);
      onStatusSync?.();
    } catch {
      setFeedback('Juftlikni uzishda xatolik yuz berdi.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (duo.active) {
    return (
      <div
        className="rounded-[2rem] p-5 text-white relative overflow-hidden shadow-lg border border-indigo-500/30 space-y-3.5"
        style={{ background: 'linear-gradient(135deg, #13112b 0%, #241957 100%)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#c4f82a]/15 border border-[#c4f82a]/35 flex items-center justify-center text-[#c4f82a] shrink-0">
              <Flame size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-white truncate">
                  Duo: {duo.partnerName || 'Sherik'}
                </h4>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    duo.partnerActiveToday
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {duo.partnerActiveToday ? 'Bugun faol ✓' : 'Kutilmoqda'}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 font-medium">
                Umumiy seriya: {duo.sharedStreak} kun ketma-ket
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUnpair}
            disabled={loadingAction === 'unpair'}
            title="Juftlikni uzish"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/25 flex items-center justify-center text-white/60 hover:text-rose-300 transition-colors shrink-0"
          >
            <Unlink size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleNudge}
          disabled={!canNudge || loadingAction === 'nudge'}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 ${
            canNudge
              ? 'bg-[#c4f82a] text-[#0e0d1d] hover:brightness-110 shadow-[0_0_16px_rgba(196,248,42,0.3)]'
              : 'bg-white/10 text-slate-300 cursor-not-allowed'
          }`}
        >
          <Zap size={14} />
          <span>
            {loadingAction === 'nudge'
              ? 'Yuborilmoqda...'
              : canNudge
                ? 'Sherikka Turtki (Nudge) yuborish'
                : 'Eslatma yuborilgan (4 soat kuting)'}
          </span>
        </button>

        {feedback && <p className="text-[11px] text-indigo-200 text-center font-semibold">{feedback}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3.5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#7052ff] flex items-center justify-center shrink-0">
          <UserPlus size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900">Study Duo — Do‘st bilan Streak</h4>
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
            Yaqin do‘stingizni taklif qiling va har kuni bir-biringizga Telegram orqali turtki berib dars qiling.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleTelegramInvite}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#7052ff] hover:bg-[#5e3df5] text-white text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Send size={14} />
          <span>Sherik taklif qilish</span>
        </button>

        <button
          type="button"
          onClick={handleCopyInvite}
          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          <span>{copied ? 'Nusxalandi' : 'Havola'}</span>
        </button>
      </div>

      {feedback && <p className="text-[11px] text-indigo-600 font-semibold">{feedback}</p>}
    </div>
  );
};
