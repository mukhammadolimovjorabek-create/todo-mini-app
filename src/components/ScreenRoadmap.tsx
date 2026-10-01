import React from 'react';
import { ArrowLeft, Clock, Search, ChevronRight, GraduationCap } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface Props {
  onBack: () => void;
  onOpenCourse: (course: string) => void;
}

export const ScreenRoadmap: React.FC<Props> = ({ onBack, onOpenCourse }) => {
  const days = [
    { name: 'Sun', active: true, status: 'done' },
    { name: 'Mon', active: false, status: 'empty' },
    { name: 'Tue', active: true, status: 'done' },
    { name: 'Wed', active: true, status: 'current' }, // Today orange
    { name: 'Thu', active: true, status: 'done' },
    { name: 'Fri', active: true, status: 'done' },
    { name: 'Sat', active: true, status: 'done' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#99bbf9] text-slate-900 pb-20 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all text-slate-800"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={() => triggerHaptic('light')}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all text-slate-800"
        >
          <Clock size={20} />
        </button>
      </div>

      {/* Main Title */}
      <div className="px-6 pt-2 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          Check Your Learning Roadmap <br />
          and <span className="underline decoration-wavy decoration-indigo-400">Upcoming Lessons</span>
        </h1>
      </div>

      {/* Artistic Playful Illustration */}
      <div className="relative mx-6 my-2 h-44 flex items-center justify-center">
        {/* Floating Doodles */}
        <div className="absolute top-2 left-6 text-xl animate-bounce duration-1000">👁️</div>
        <div className="absolute top-0 right-10 text-xl">🖤</div>
        <div className="absolute top-8 left-16 text-lg">✏️</div>
        <div className="absolute top-3 right-24 text-lg">🎵</div>
        <div className="absolute bottom-6 left-8 text-lg">📅</div>
        <div className="absolute bottom-4 right-12 text-lg">📐</div>

        {/* Dynamic Running Character SVG */}
        <svg viewBox="0 0 240 180" className="w-52 h-40 filter drop-shadow-sm">
          {/* Runner Head & Smiling Face */}
          <circle cx="115" cy="45" r="16" fill="white" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="112" cy="43" r="2.5" fill="#1e293b" />
          <path d="M110 50 Q116 55 122 50" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Hair swoosh */}
          <path d="M104 35 Q115 28 126 34" stroke="#1e293b" strokeWidth="3" fill="none" />
          
          {/* Torso */}
          <path d="M115 62 Q112 85 96 110" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M102 68 L130 92 L102 108 Z" fill="white" stroke="#1e293b" strokeWidth="2.5" />

          {/* Arms swinging */}
          <path d="M105 75 Q72 82 55 88" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M124 78 Q155 70 178 74" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          
          {/* Legs running forward */}
          <path d="M96 110 Q70 125 58 152" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Shoe Left */}
          <ellipse cx="54" cy="153" rx="10" ry="5" fill="white" stroke="#1e293b" strokeWidth="2.5" />
          
          {/* Leg Right */}
          <path d="M115 108 Q145 125 174 134" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Shoe Right */}
          <ellipse cx="178" cy="135" rx="10" ry="5" fill="white" stroke="#1e293b" strokeWidth="2.5" />

          {/* Wind dash lines */}
          <line x1="42" y1="140" x2="32" y2="140" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <line x1="46" y1="146" x2="34" y2="146" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Week Calendar / Streak Bar */}
      <div className="mx-5 bg-white/70 backdrop-blur-md rounded-3xl p-3 shadow-sm border border-white/50">
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">{d.name}</span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  d.status === 'current'
                    ? 'bg-[#f59e0b] text-white shadow-md scale-105'
                    : d.status === 'done'
                    ? 'bg-[#18181b] text-white'
                    : 'border-2 border-dashed border-slate-400 bg-transparent text-transparent'
                }`}
              >
                {d.status !== 'empty' && <GraduationCap size={16} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Courses Section */}
      <div className="px-6 mt-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
          <button className="text-slate-800 p-1 hover:bg-white/30 rounded-full">
            <Search size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Course 1: Black Pill */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              onOpenCourse('Path');
            }}
            className="flex items-center justify-between p-4 bg-[#111827] text-white rounded-3xl shadow-md cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-wide">Path</h3>
                <p className="text-xs text-slate-400">Unlock the Grid</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </div>

          {/* Course 2: Light Blue Pill */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenCourse('Mode');
            }}
            className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm text-slate-900 rounded-3xl shadow-sm border border-white/60 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-wide">Mode</h3>
                <p className="text-xs text-slate-600">Focus Mode</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center">
              <ChevronRight size={18} className="text-slate-700" />
            </div>
          </div>

          {/* Course 3: Lab Pill */}
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenCourse('Lab');
            }}
            className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm text-slate-900 rounded-3xl shadow-sm border border-white/60 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <span className="text-lg">🧪</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-wide">Lab</h3>
                <p className="text-xs text-slate-600">UX Motion Lab</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center">
              <ChevronRight size={18} className="text-slate-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
