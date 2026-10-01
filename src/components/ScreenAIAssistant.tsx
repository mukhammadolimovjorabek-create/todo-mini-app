import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Menu,
  SlidersHorizontal,
  Camera,
  Mic,
  Video,
  Send,
  Sparkles,
  Key,
  CheckCircle2,
  X
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { SpeechRecognitionService, queryAI, type ChatMessage } from '../utils/aiService';

interface Props {
  onBack: () => void;
}

export const ScreenAIAssistant: React.FC<Props> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Salom! Men sizning ta\'lim murabbiyingizman. Bugun nimani o\'rganamiz?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [groqKey, setGroqKey] = useState<string>(() => localStorage.getItem('groq_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const speechRef = useRef<SpeechRecognitionService | null>(null);

  useEffect(() => {
    speechRef.current = new SpeechRecognitionService();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isLoading) return;

    triggerHaptic('medium');
    const newMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, newMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await queryAI(text, messages, groqKey);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      triggerHaptic('light');
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Kechirasiz, javob olishda xatolik yuz berdi. Qayta urinib ko\'ring.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMic = () => {
    triggerHaptic('heavy');
    if (!speechRef.current || !speechRef.current.isSupported) {
      alert('Brauzeringiz ovoz tanishni qo\'llab-quvvatlamaydi. Matn orqali yozishingiz mumkin.');
      return;
    }

    if (isListening) {
      speechRef.current.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      speechRef.current.startListening(
        (text, isFinal) => {
          setInputVal(text);
          if (isFinal) {
            setIsListening(false);
            handleSendMessage(text);
          }
        },
        (err) => {
          console.warn('Speech error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const saveKey = () => {
    localStorage.setItem('groq_api_key', tempKey);
    setGroqKey(tempKey);
    setShowSettings(false);
    triggerHaptic('medium');
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 text-slate-900 pb-20 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200/70 flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowLeft size={19} />
        </button>

        <h2 className="font-bold text-slate-900 text-base">AI Assistant</h2>

        <button
          onClick={() => {
            triggerHaptic('light');
            setTempKey(groqKey);
            setShowSettings(true);
          }}
          className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200/70 flex items-center justify-center active:scale-95 transition-all text-slate-700"
        >
          <Menu size={19} />
        </button>
      </div>

      {/* Hero AI Sound Wave Section */}
      <div className="px-6 py-2">
        <div className="relative bg-[#99bbf9] rounded-[2.5rem] p-5 overflow-hidden flex flex-col items-center shadow-xs">
          {/* Top avatars & Settings button */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center -space-x-2 bg-white/40 backdrop-blur-xs p-1 rounded-full border border-white/40">
              <img
                className="w-6 h-6 rounded-full border border-white object-cover"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"
                alt="user1"
              />
              <img
                className="w-6 h-6 rounded-full border border-white object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                alt="user2"
              />
              <img
                className="w-6 h-6 rounded-full border border-white object-cover"
                src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80"
                alt="user3"
              />
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                setShowSettings(true);
              }}
              className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-xs flex items-center justify-center text-slate-900"
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>

          {/* Glowing Animated Sound Orb */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Ambient Pulsing Rings */}
            <div
              className={`absolute w-36 h-36 rounded-full bg-white/20 blur-xl transition-all duration-700 ${
                isListening || isLoading ? 'scale-125 bg-indigo-300/40 animate-pulse' : 'scale-100'
              }`}
            />
            {/* Outer Glowing Shell */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-white/70 via-white/90 to-indigo-100/60 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/60">
              {/* Inner Wave SVG */}
              <svg viewBox="0 0 100 100" className="w-20 h-20 animate-spin" style={{ animationDuration: isListening ? '3s' : '12s' }}>
                <defs>
                  <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 50 15 C 65 15, 85 30, 85 50 C 85 70, 65 85, 50 85 C 30 85, 15 65, 15 50 C 15 35, 35 15, 50 15 Z"
                  fill="none"
                  stroke="url(#waveGrad)"
                  strokeWidth="6"
                  strokeDasharray="18 8"
                />
              </svg>
            </div>
          </div>

          {/* AI Message Bubble */}
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-xs text-xs font-semibold text-slate-800 mb-4 z-10 text-center max-w-[90%]">
            {isListening
              ? '🎤 Sizni tinglayapman...'
              : isLoading
              ? '✨ O\'ylamoqda...'
              : messages[messages.length - 1]?.content || 'Hi! How can I help you?'}
          </div>

          {/* Voice & Media Buttons */}
          <div className="flex items-center space-x-5 z-10 pb-1">
            <button
              onClick={() => triggerHaptic('light')}
              className="w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            >
              <Camera size={19} />
            </button>

            {/* Central Big Mic Button */}
            <button
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all ${
                isListening
                  ? 'bg-rose-500 ring-4 ring-rose-300 animate-pulse'
                  : 'bg-[#111827] hover:bg-slate-800'
              }`}
            >
              <Mic size={24} />
            </button>

            <button
              onClick={() => triggerHaptic('light')}
              className="w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            >
              <Video size={19} />
            </button>
          </div>
        </div>
      </div>

      {/* Prompts left and Model badge */}
      <div className="flex items-center justify-between px-7 py-1.5 text-[11px] text-slate-500">
        <div className="flex items-center space-x-1">
          <Sparkles size={13} className="text-amber-500" />
          <span className="font-semibold text-slate-700">Cheksiz bepul</span>
        </div>
        <span>{groqKey ? 'Groq Llama-3.3 (Ulangan)' : 'Smart AI (0 Xarajat)'}</span>
      </div>

      {/* Chat Input Field */}
      <div className="px-6 py-1">
        <div className="flex items-center bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputVal.trim() || isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              inputVal.trim()
                ? 'bg-slate-900 text-white active:scale-95'
                : 'text-slate-300'
            }`}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="px-6 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSendMessage('Haftalik o\'quv summarysini ko\'rsat')}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#111827] text-white shrink-0 active:scale-95 transition-all shadow-xs"
        >
          Week Summary
        </button>
        <button
          onClick={() => handleSendMessage('Menga yangi 4 haftalik o\'quv rejasi tuzib ber')}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shrink-0 active:scale-95 transition-all"
        >
          Create New Plan
        </button>
        <button
          onClick={() => handleSendMessage('Keyingi amaliy qadamlar nimalardan iborat?')}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shrink-0 active:scale-95 transition-all"
        >
          Apply Steps
        </button>
      </div>

      {/* Roadmap / Timeline Section */}
      <div className="px-6 pt-3 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-sm">Roadmap</h3>
          {/* Period selector */}
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-400">
            {(['Day', 'Week', 'Month', 'Year'] as const).map((t) => (
              <span
                key={t}
                onClick={() => {
                  triggerHaptic('light');
                  setTimeframe(t);
                }}
                className={`cursor-pointer transition-colors ${
                  timeframe === t ? 'text-slate-900 font-bold' : 'hover:text-slate-600'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Visual Timeline Gantt Bar */}
        <div className="relative bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-3">
          {/* Milestone 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                🎯
              </div>
              <span className="text-xs font-bold text-slate-800">Ignite Curiosity</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                13%
              </span>
              <div className="w-24 h-6 rounded-full bg-[#fb923c] flex items-center px-2 text-[10px] font-bold text-white shadow-xs">
                Map the Path
              </div>
            </div>
          </div>

          {/* Milestone 2: Assess Skills with striped pattern and avatars */}
          <div className="flex items-center justify-between pt-1">
            <div className="w-32 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center px-2 text-[10px] font-bold text-indigo-900">
              ⚡ Assess Skills
            </div>

            <div className="flex items-center -space-x-1.5 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              <img
                className="w-5 h-5 rounded-full border border-white object-cover"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80"
                alt="user1"
              />
              <img
                className="w-5 h-5 rounded-full border border-white object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80"
                alt="user2"
              />
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="flex items-center space-x-2 pt-1">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
              🎓
            </div>
            <span className="text-xs font-semibold text-slate-700">Launch Your Journey</span>
          </div>

          {/* Days axis */}
          <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
            <span>Mon</span>
            <span>Tue</span>
            <span className="text-slate-900 font-bold">Wed</span>
            <span>Thr</span>
            <span>Fri</span>
          </div>
        </div>
      </div>

      {/* Groq Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-900 text-base">AI Sozlamalari (Ixtiyoriy)</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ilova hozirning o'zida bepul aqlli algoritmlar orqali 100% ishlaydi. Agar <b>groq.com</b> bepul API kalitingiz bo'lsa, bu yerga kiritib, to'g'ridan-to'g'ri Llama-3.3 70B modeliga ulashingiz mumkin:
            </p>

            <input
              type="password"
              placeholder="gsk_..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex space-x-2">
              <button
                onClick={saveKey}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 active:scale-95 transition-all"
              >
                <CheckCircle2 size={16} />
                <span>Saqlash</span>
              </button>
              <button
                onClick={() => {
                  setTempKey('');
                  localStorage.removeItem('groq_api_key');
                  setGroqKey('');
                  setShowSettings(false);
                }}
                className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Tozalash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
