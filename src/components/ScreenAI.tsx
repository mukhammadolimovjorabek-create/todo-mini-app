import React, { useState, useEffect } from 'react';
import { Send, Bot, RefreshCw } from 'lucide-react';
import type { ChatMessage } from '../utils/aiService';
import { analyzeWithAI, extractTaskIntent } from '../utils/analyzer';
import { triggerHaptic } from '../utils/telegram';
import { loadTasks, today, addTask, updateStats } from '../utils/storage';

const QUICK_PROMPTS = [
  'Bugun qanday ketdi? Tahlil qil',
  'Nega bu qadar kam bajardim?',
  'Meni motivatsiya qil',
  'Qaysi vazifa muhimroq?',
];

interface Props {
  onTaskCreated?: () => void;
}

export const ScreenAI: React.FC<Props> = ({ onTaskCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [todaySummary, setTodaySummary] = useState({ total: 0, done: 0 });

  const refreshSummary = () => {
    const tasks = loadTasks().filter((t) => t.createdAt === today());
    setTodaySummary({ total: tasks.length, done: tasks.filter((t) => t.done).length });
  };

  useEffect(() => {
    refreshSummary();

    // Xush kelibsiz xabari
    setMessages([
      {
        role: 'assistant',
        content: `Salom! Men sizning **Smart AI Murabbiyingizman** 🤖\n\nBugungi vazifalaringizni tahlil qilish, motivatsiya olish yoki yangi reja tuzish uchun menga savol bering! Quyidagi tezkor savollardan ham foydalanishingiz mumkin.`,
      },
    ]);
  }, []);

  const sendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || input).trim();
    if (!msgText || loading) return;

    triggerHaptic('medium');
    const userMsg: ChatMessage = { role: 'user', content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. AI orqali tahlil qilish (Gemini -> Groq -> Offline)
      const rawReply = await analyzeWithAI(msgText, messages);

      // 2. Javobdan vazifa intentini ajratish
      const { cleanReply, task } = extractTaskIntent(rawReply);

      // 3. Agar foydalanuvchi vazifa aytgan bo'lsa, avtomatik qo'shamiz
      if (task) {
        addTask(
          task.text,
          task.priority || 'medium',
          task.category || 'personal',
          task.duration || undefined
        );
        updateStats();
        refreshSummary();
        onTaskCreated?.();
        triggerHaptic('heavy');
      }

      // 4. Chatga toza javobni chiqarish
      setMessages((prev) => [...prev, { role: 'assistant', content: cleanReply }]);
      triggerHaptic('light');
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    triggerHaptic('light');
    setMessages([
      {
        role: 'assistant',
        content: 'Chat tozalandi. Menga yangi vazifangizni yozing yoki savol bering! 🚀',
      },
    ]);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f6f7fb] pb-28">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-extrabold text-[#7052ff] uppercase tracking-wider">PRODUKTIVLIK</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Murabbiy 🤖</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              title="Chatni tozalash"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 active:scale-95 shadow-xs hover:text-indigo-600 transition-all"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Today's snapshot ── */}
        <div
          className="rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl mb-3"
          style={{ background: 'linear-gradient(135deg, #1e1552 0%, #2b1d79 100%)' }}
        >
          <p className="text-[10px] text-[#9e91db] font-extrabold uppercase tracking-wider mb-2">Bugungi holat</p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-6">
              <div>
                <p className="text-3xl font-black text-white">{todaySummary.done}</p>
                <p className="text-[11px] text-[#c4f82a] font-bold">Bajarildi ✅</p>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <p className="text-3xl font-black text-white">{todaySummary.total - todaySummary.done}</p>
                <p className="text-[11px] text-purple-200 font-bold">Qoldi ⏳</p>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <p className="text-3xl font-black text-white">
                  {todaySummary.total ? Math.round((todaySummary.done / todaySummary.total) * 100) : 0}%
                </p>
                <p className="text-[11px] text-purple-200 font-bold">Samaradorlik</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick prompts ── */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3.5 py-2 bg-white text-slate-700 text-xs font-semibold rounded-2xl border border-slate-200 shrink-0 active:scale-95 transition-all shadow-xs hover:border-indigo-300"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="px-5 flex-1 space-y-3 pb-2 pt-1">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#1e1552] flex items-center justify-center text-[#c4f82a] text-xs mr-2 shrink-0 mt-1 shadow-sm">
                <Bot size={15} />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm bg-[#7052ff]'
                  : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
              }`}
            >
              {msg.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-[#1e1552] flex items-center justify-center text-[#c4f82a] mr-2 shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-xs flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-[#7052ff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#7052ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#7052ff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar (Toza matn kiritish + Yuborish) ── */}
      <div className="px-5 py-3">
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs focus-within:border-indigo-400 transition-all">
          <input
            type="text"
            placeholder="Vazifani yozing yoki savol bering..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none pr-2"
          />

          {/* Yuborish tugmasi */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 active:scale-90 transition-all disabled:opacity-30 bg-[#7052ff] shadow-md shadow-indigo-500/30"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
