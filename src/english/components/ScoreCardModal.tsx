import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Sparkles, Check } from 'lucide-react';
import { buildMiniAppUrl, getTelegramWebApp, triggerHaptic } from '../../utils/telegram';

export interface ScoreCriterionBar {
  label: string;
  scoreText: string;
  ratio: number; // 0 to 1
}

interface ScoreCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  examType: 'ielts' | 'multilevel';
  moduleName: string;
  headlineScore: string;
  subtitle: string;
  dateStr: string;
  candidateName: string;
  criteria: ScoreCriterionBar[];
}

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const ScoreCardModal: React.FC<ScoreCardModalProps> = ({
  isOpen,
  onClose,
  examType,
  moduleName,
  headlineScore,
  subtitle,
  dateStr,
  candidateName,
  criteria,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 900;
    const H = 1120;
    canvas.width = W;
    canvas.height = H;

    // Deep night gradient background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0e0d1d');
    bg.addColorStop(0.55, '#191438');
    bg.addColorStop(1, examType === 'multilevel' ? '#072b24' : '#251a4e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow
    const glow = ctx.createRadialGradient(W * 0.78, H * 0.22, 30, W * 0.78, H * 0.22, 360);
    glow.addColorStop(0, examType === 'multilevel' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(112, 82, 255, 0.38)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Outer card border
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 42, 42, W - 84, H - 84, 42);
    ctx.stroke();

    // Header badge
    ctx.fillStyle = examType === 'multilevel' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(112, 82, 255, 0.25)';
    drawRoundedRect(ctx, 84, 88, 370, 52, 26);
    ctx.fill();
    ctx.fillStyle = examType === 'multilevel' ? '#6ee7b7' : '#c4f82a';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText(examType === 'multilevel' ? 'MILLIY SERTIFIKAT · UZBMB' : 'IELTS ACADEMIC · AI EXAM', 110, 122);

    // Date top-right
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '600 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, W - 88, 122);
    ctx.textAlign = 'left';

    // Candidate & Module
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 42px Inter, system-ui, sans-serif';
    ctx.fillText(candidateName || 'Study Lab Nomzodi', 84, 215);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 28px Inter, system-ui, sans-serif';
    ctx.fillText(moduleName, 84, 262);

    // Main Score Banner
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    drawRoundedRect(ctx, 84, 308, W - 168, 225, 34);
    ctx.fill();
    ctx.strokeStyle = examType === 'multilevel' ? 'rgba(16,185,129,0.45)' : 'rgba(196,248,42,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#c4f82a';
    ctx.font = '900 108px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(headlineScore, W / 2, 435);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 28px Inter, system-ui, sans-serif';
    ctx.fillText(subtitle.slice(0, 52), W / 2, 495);
    ctx.textAlign = 'left';

    // 4 Criteria bars
    let barY = 590;
    criteria.slice(0, 4).forEach((item) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 26px Inter, system-ui, sans-serif';
      ctx.fillText(item.label, 88, barY);

      ctx.fillStyle = '#c4f82a';
      ctx.font = '800 28px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.scoreText, W - 88, barY);
      ctx.textAlign = 'left';

      // Track
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      drawRoundedRect(ctx, 88, barY + 18, W - 176, 22, 11);
      ctx.fill();

      // Fill
      const safeRatio = Math.max(0.05, Math.min(1, item.ratio || 0));
      const fillGrad = ctx.createLinearGradient(88, 0, W - 88, 0);
      fillGrad.addColorStop(0, examType === 'multilevel' ? '#10b981' : '#7052ff');
      fillGrad.addColorStop(1, '#c4f82a');
      ctx.fillStyle = fillGrad;
      drawRoundedRect(ctx, 88, barY + 18, Math.max(24, (W - 176) * safeRatio), 22, 11);
      ctx.fill();

      barY += 92;
    });

    // Footer branding
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(84, H - 150);
    ctx.lineTo(W - 84, H - 150);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 30px Inter, system-ui, sans-serif';
    ctx.fillText('Study Lab · AI IELTS & Multilevel', 84, H - 96);

    ctx.fillStyle = '#c4f82a';
    ctx.font = '700 26px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('@aitasklistbot', W - 84, H - 96);
    ctx.textAlign = 'left';

    try {
      setImageUrl(canvas.toDataURL('image/png'));
    } catch {
      // ignore
    }
  }, [isOpen, examType, moduleName, headlineScore, subtitle, dateStr, candidateName, criteria]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    triggerHaptic('medium');
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `StudyLab_${examType}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleTelegramShare = async () => {
    triggerHaptic('medium');
    const appLink = buildMiniAppUrl(examType);
    const shareText = `🔥 Men Study Lab AI ilovasida ${moduleName} sinovidan ${headlineScore} (${subtitle}) natija oldim!\n\nSiz ham o'z darajangizni bepul tekshirib ko'ring:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appLink)}&text=${encodeURIComponent(shareText)}`;

    try {
      if (navigator.share && imageUrl) {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], 'studylab-score.png', { type: 'image/png' });
        if ((navigator as any).canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Study Lab Natijam', text: shareText });
          return;
        }
      }
    } catch {
      // fallback to Telegram share link
    }

    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-[2rem] max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-[#c4f82a]" />
            <h3 className="text-sm font-black uppercase tracking-wider">Natija Kartasi (PNG)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/40">
            <img src={imageUrl} alt="Study Lab Score Card" className="w-full h-auto block" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownload}
            className="py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-black flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
          >
            {downloaded ? <Check size={15} className="text-[#c4f82a]" /> : <Download size={15} />}
            <span>{downloaded ? 'Saqlandi!' : 'PNG Yuklash'}</span>
          </button>
          <button
            onClick={handleTelegramShare}
            className="py-3 rounded-xl bg-gradient-to-r from-[#7052ff] to-indigo-600 text-xs font-black flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 transition-all"
          >
            <Share2 size={15} />
            <span>Telegramda Ulashish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
