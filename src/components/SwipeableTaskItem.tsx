import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import type { Task, TaskCategory } from '../types';
import { getCategoryColor, getCategoryLabel, getPriorityColor, getPriorityLabel } from '../utils/storage';
import { triggerHaptic } from '../utils/telegram';

const CAT_EMOJIS: Record<TaskCategory, string> = {
  work: '💼', personal: '🌟', health: '💪', learning: '📚', other: '✨',
};

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SwipeableTaskItem: React.FC<Props> = ({ task, onToggle, onDelete }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const didExceedThreshold = useRef(false);

  // Reset offset if task changes
  useEffect(() => {
    setOffsetX(0);
    setIsOpen(false);
    setIsDeleting(false);
  }, [task.id]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = startXRef.current;
    isHorizontalSwipe.current = null;
    didExceedThreshold.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - startXRef.current;
    const diffY = touchY - startYRef.current;

    // Determine direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Agar vertikal skroll bo'lsa, xalaqit bermaymiz
    if (isHorizontalSwipe.current === false) return;

    currentXRef.current = touchX;

    // Hisoblash
    const baseOffset = isOpen ? -72 : 0;
    let newOffset = baseOffset + diffX;

    // O'ngga tortishni cheklash
    if (newOffset > 10) {
      newOffset = 10;
    }
    // Chapga tortish
    if (newOffset < -160) {
      newOffset = -160 - (Math.abs(newOffset + 160) * 0.2);
    }

    // Tebranish berish (agar -120px dan o'tsa to'liq o'chirish ostonasi)
    if (newOffset < -115 && !didExceedThreshold.current) {
      didExceedThreshold.current = true;
      triggerHaptic('medium');
    } else if (newOffset >= -115 && didExceedThreshold.current) {
      didExceedThreshold.current = false;
    }

    setOffsetX(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Agar vertikal skroll bo'lgan bo'lsa
    if (isHorizontalSwipe.current === false) {
      setOffsetX(isOpen ? -72 : 0);
      return;
    }

    const diffX = currentXRef.current - startXRef.current;

    // 1. To'liq chapga tortib o'chirish (Full swipe to delete, > 115px)
    if (offsetX < -115 || (isOpen && diffX < -45)) {
      triggerHaptic('heavy');
      setIsDeleting(true);
      setOffsetX(-400); // Ekrandan chiqib ketish animatsiyasi
      setTimeout(() => {
        onDelete(task.id);
      }, 250);
      return;
    }

    // 2. Qisman tortib o'chirish tugmasini ochish (> 45px chapga)
    if (offsetX < -45) {
      setOffsetX(-72);
      setIsOpen(true);
      triggerHaptic('light');
    } else {
      // 3. Orqaga qaytish
      setOffsetX(0);
      setIsOpen(false);
    }
  };

  // Mouse Handlers (Kompyuter brauzerida ham sichqoncha bilan chapga tortish uchun)
  const isMouseDown = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDown.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentXRef.current = e.clientX;
    isHorizontalSwipe.current = null;
    didExceedThreshold.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    const diffX = e.clientX - startXRef.current;
    currentXRef.current = e.clientX;

    const baseOffset = isOpen ? -72 : 0;
    let newOffset = baseOffset + diffX;
    if (newOffset > 10) newOffset = 10;
    if (newOffset < -160) newOffset = -160;

    if (newOffset < -115 && !didExceedThreshold.current) {
      didExceedThreshold.current = true;
      triggerHaptic('medium');
    }

    setOffsetX(newOffset);
  };

  const handleMouseUp = () => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    handleTouchEnd();
  };

  // Card bosilganda (agar ochilmagan bo'lsa toggle, ochilgan bo'lsa yopish)
  const handleCardClick = (e: React.MouseEvent) => {
    const totalMove = Math.abs(currentXRef.current - startXRef.current);
    if (totalMove > 6) {
      e.stopPropagation();
      return;
    }

    if (isOpen) {
      setOffsetX(0);
      setIsOpen(false);
      return;
    }

    onToggle(task.id);
  };

  const executeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    setIsDeleting(true);
    setOffsetX(-400);
    setTimeout(() => {
      onDelete(task.id);
    }, 220);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl select-none transition-all duration-200 ${
        isDeleting ? 'max-h-0 opacity-0 my-0 py-0 overflow-hidden' : 'max-h-32'
      }`}
    >
      {/* ── Orqa fon (Qizil O'chirish qismi) ── */}
      <div
        onClick={executeDelete}
        className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-red-500 via-rose-500 to-rose-600 rounded-2xl flex items-center justify-end px-5 cursor-pointer z-0 shadow-inner"
      >
        <div
          className="flex items-center space-x-2 text-white font-extrabold text-xs transition-transform"
          style={{
            transform: `scale(${Math.min(1.25, Math.max(0.85, Math.abs(offsetX) / 72))})`,
          }}
        >
          <Trash2 size={20} className="animate-pulse" />
          {Math.abs(offsetX) > 105 && (
            <span className="tracking-wide uppercase text-[11px] animate-fade-in">O'chirish</span>
          )}
        </div>
      </div>

      {/* ── Asosiy Vazifa Kartasi (Old qism) ── */}
      <div
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative z-10 flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer active:cursor-grabbing ${
          isDragging ? '' : 'transition-transform duration-250 ease-out'
        } ${
          task.done
            ? 'bg-white/80 border-slate-100 opacity-70'
            : 'bg-white border-slate-100 shadow-xs hover:border-purple-200'
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        {/* Checkbox */}
        <div
          className="shrink-0 p-0.5 active:scale-90 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) {
              setOffsetX(0);
              setIsOpen(false);
            } else {
              onToggle(task.id);
            }
          }}
        >
          {task.done ? (
            <CheckCircle2 size={24} style={{ color: getCategoryColor(task.category) }} />
          ) : (
            <Circle size={24} style={{ color: getCategoryColor(task.category) }} className="opacity-50" />
          )}
        </div>

        {/* Text and Badges */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.text}
          </p>
          <div className="flex items-center space-x-2 mt-0.5 flex-wrap gap-y-0.5">
            <span className="text-[10px] font-bold" style={{ color: getCategoryColor(task.category) }}>
              {CAT_EMOJIS[task.category]} {getCategoryLabel(task.category)}
            </span>
            <span className="text-[10px] text-slate-300">•</span>
            <span className="text-[10px] font-bold" style={{ color: getPriorityColor(task.priority) }}>
              ● {getPriorityLabel(task.priority)}
            </span>
            {task.scope === 'weekly' && (
              <>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md">
                  📅 Hafta
                </span>
              </>
            )}
            {task.duration && (
              <>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-0.5">
                  <Clock size={9} />
                  <span>
                    {task.duration >= 60
                      ? `${Math.floor(task.duration / 60)} soat${task.duration % 60 ? ` ${task.duration % 60} daqiqa` : ''}`
                      : `${task.duration} daqiqa`}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
