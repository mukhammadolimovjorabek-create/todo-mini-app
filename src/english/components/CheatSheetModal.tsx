import React, { useState } from 'react';
import { X, Send, Download, CheckCircle2, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { loadMistakes, markMistakeReviewed, saveMistakes, type MistakeEntry } from '../../utils/shop';
import { getTelegramInitData, triggerHaptic } from '../../utils/telegram';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>(() => loadMistakes());
  const [filter, setFilter] = useState<'all' | 'speaking' | 'writing' | 'reading' | 'listening'>('all');
  const [sendingTg, setSendingTg] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const filtered = filter === 'all' ? mistakes : mistakes.filter((m) => m.source === filter);

  const handleReview = (id: string) => {
    triggerHaptic('light');
    setMistakes(markMistakeReviewed(id));
  };

  const handleClear = () => {
    triggerHaptic('medium');
    saveMistakes([]);
    setMistakes([]);
    setStatusMsg({ ok: true, text: "Xatolar banki tozalandi." });
  };

  const handleSendToTelegram = async () => {
    const targetList = (filtered.length > 0 ? filtered : mistakes).slice(0, 10);
    if (targetList.length === 0) {
      setStatusMsg({ ok: false, text: "Yuborish uchun kamida 1 ta xato yozuvi bo'lishi kerak." });
      return;
    }

    setSendingTg(true);
    setStatusMsg(null);
    triggerHaptic('medium');

    const initData = getTelegramInitData();
    const payload = JSON.stringify({
      title: 'Study Lab — 1-Betlik SOS Xatolar Konspekti',
      mistakes: targetList.map((m) => ({
        wrong: m.userText,
        right: m.correction,
        reason: m.explanation,
      })),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
    };

    const urls = ['/api/send_cheatsheet', ...(API_BASE_URL ? [`${API_BASE_URL}/api/send_cheatsheet`] : [])];
    let delivered = false;
    let errText = '';

    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'POST', headers, body: payload });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          delivered = true;
          break;
        }
        if (data?.error) errText = String(data.error);
      } catch {
        // try next endpoint
      }
    }

    setSendingTg(false);
    if (delivered) {
      triggerHaptic('heavy');
      setStatusMsg({ ok: true, text: "✅ 1-betlik konspekt Telegram bot chatingizga yuborildi!" });
    } else {
      setStatusMsg({
        ok: false,
        text: errText || "Telegram botga yuborish uchun ilovani Telegram Mini App ichidan oching yoki HTML varaqni yuklang.",
      });
    }
  };

  const handleDownloadPrintable = () => {
    const items = (filtered.length > 0 ? filtered : mistakes).slice(0, 15);
    if (items.length === 0) return;
    triggerHaptic('medium');

    const escHtml = (s: string) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowsHtml = items
      .map(
        (m, i) => `
      <div class="card">
        <div class="meta">${i + 1}. ${escHtml(m.source.toUpperCase())} · ${escHtml(m.skillTag)} · ${escHtml(m.date)}</div>
        <div class="wrong">❌ ${escHtml(m.userText)}</div>
        <div class="right">✅ ${escHtml(m.correction)}</div>
        ${m.explanation ? `<div class="why">💡 ${escHtml(m.explanation)}</div>` : ''}
      </div>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>Study Lab — 1-Betlik SOS Konspekt</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 800px; margin: 24px auto; padding: 0 16px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #312e81; }
  p.sub { font-size: 12px; color: #475569; margin: 0 0 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; break-inside: avoid; background: #f8fafc; }
  .meta { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
  .wrong { font-size: 12px; color: #b91c1c; margin-bottom: 4px; }
  .right { font-size: 12px; color: #047857; font-weight: 700; margin-bottom: 4px; }
  .why { font-size: 11px; color: #334155; }
  @media print { body { margin: 8mm; } }
</style>
</head>
<body>
  <h1>Study Lab — Imtihon oldidan 1-betlik SOS Konspekt</h1>
  <p class="sub">Eng ko'p takrorlanadigan xatolaringiz va to'g'ri C1/Band 8.0 muqobillari (@aitasklistbot)</p>
  <div class="grid">${rowsHtml}</div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyLab_SOS_Konspekt_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0e0d1d] to-[#231d47] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen size={20} className="text-[#c4f82a]" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Xatolar Banki & SOS Konspekt</h3>
              <p className="text-[11px] text-white/70">Imtihon oldidan eng zaif nuqtalarni 1 daqiqada takrorlang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-slate-50">
          {(
            [
              { id: 'all', label: `Hammasi (${mistakes.length})` },
              { id: 'speaking', label: 'Speaking' },
              { id: 'writing', label: 'Writing' },
              { id: 'reading', label: 'Reading' },
              { id: 'listening', label: 'Listening' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition-all ${
                filter === tab.id ? 'bg-[#7052ff] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mistakes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Sparkles size={32} className="mx-auto text-indigo-400" />
              <p className="text-sm font-black text-slate-700">Hali xatolar banki bo'sh</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Speaking, Writing, Reading yoki Listening testini yakunlaganingizda, xatolar va yaxshilanishlar avtomatik shu yerga tushadi.
              </p>
            </div>
          ) : (
            filtered.map((m) => (
              <div key={m.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    {m.source} · {m.skillTag}
                  </span>
                  <button
                    onClick={() => handleReview(m.id)}
                    className={`text-[11px] font-bold flex items-center space-x-1 px-2 py-0.5 rounded-md transition-colors ${
                      m.reviewedCount > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    <span>{m.reviewedCount > 0 ? `Takrorlandi (${m.reviewedCount}x)` : 'Takrorladim'}</span>
                  </button>
                </div>

                {m.userText && (
                  <p className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-100">
                    ❌ {m.userText}
                  </p>
                )}
                <p className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                  ✅ {m.correction}
                </p>
                {m.explanation && <p className="text-[11px] text-slate-600 leading-relaxed">💡 {m.explanation}</p>}
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-2.5 shrink-0">
          {statusMsg && (
            <p className={`text-xs font-bold text-center ${statusMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
              {statusMsg.text}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSendToTelegram}
              disabled={sendingTg || mistakes.length === 0}
              className="py-3 rounded-xl bg-[#7052ff] hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <Send size={14} />
              <span>{sendingTg ? 'Yuborilmoqda...' : 'Telegramga SOS Yuborish'}</span>
            </button>
            <button
              onClick={handleDownloadPrintable}
              disabled={mistakes.length === 0}
              className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <Download size={14} className="text-[#c4f82a]" />
              <span>1-Betlik Varaq (Print)</span>
            </button>
          </div>
          {mistakes.length > 0 && (
            <button
              onClick={handleClear}
              className="w-full py-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-500 flex items-center justify-center space-x-1"
            >
              <Trash2 size={12} />
              <span>Ro'yxatni tozalash</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
