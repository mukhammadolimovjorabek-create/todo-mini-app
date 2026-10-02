import React, { useState, useEffect } from 'react';
import { Send, Bot, Sparkles, RefreshCw } from 'lucide-react';
import type { ChatMessage } from '../utils/aiService';
import { analyzeWithAI } from '../utils/analyzer';
import { triggerHaptic } from '../utils/telegram';
import { loadTasks, today } from '../utils/storage';

const QUICK_PROMPTS = [
  'Bugun qanday ketdi? Tahlil qil',
  'Nega bu qadar kam bajardim?',
  "Ertaga uchun reja tuz",
  'Meni motivatsiya qil',
  'Qaysi vazifa muhimroq?',
];

export const ScreenAI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [todaySummary, setTodaySummary] = useState({ total: 0, done: 0 });

  useEffect(() => {
    const tasks = loadTasks().filter((t) => t.createdAt === today());
    setTodaySummary({ total: tasks.length, done: tasks.filter((t) => t.done).length });

    // Auto welcome message
    setMessages([{
      role: 'assistant',
      content: `Salom! Men sizning **produktivlik tahlilchingizman** 🤖\n\nBugun **${tasks.length}** ta vazifadan **${tasks.filter(t=>t.done).length}** tasini bajardingiz. Menga biror savol yozing yoki quyidagi tezkor savollardan birini tanlang!`,
    }]);
  }, []);

  const sendMessage = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || loading) return;

    triggerHaptic('medium');
    const userMsg: ChatMessage = { role: 'user', content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await analyzeWithAI(msgText, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      triggerHaptic('light');
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    triggerHaptic('light');
    setMessages([{
      role: 'assistant',
      content: 'Chat tozalandi. Menga yangi savol yozing! 🚀',
    }]);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f0f2ff] pb-24">
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Produktivlik</p>
            <h1 className="text-2xl font-extrabold text-slate-900">AI Tahlilchi 🤖</h1>
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
          className="rounded-3xl p-5 text-white relative overflow-hidden shadow-lg mb-4"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)' }}
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mb-2">Bugungi holat</p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-6">
              <div>
                <p className="text-3xl font-black">{todaySummary.done}</p>
                <p className="text-xs text-white/70">Bajarildi ✅</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-3xl font-black">{todaySummary.total - todaySummary.done}</p>
                <p className="text-xs text-white/70">Qoldi ⏳</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-3xl font-black">
                  {todaySummary.total ? Math.round((todaySummary.done / todaySummary.total) * 100) : 0}%
                </p>
                <p className="text-xs text-white/70">Samaradorlik</p>
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
      <div className="px-5 flex-1 space-y-3 pb-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs mr-2 shrink-0 mt-1 shadow-sm">
                <Bot size={14} />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
              }`}
              style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
            >
              {/* Simple bold markdown */}
              {msg.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mr-2 shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-sm border border-slate-100 shadow-xs flex items-center space-x-1.5">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="px-5 py-3">
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs focus-within:border-indigo-400 transition-all">
          <Sparkles size={16} className="text-indigo-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Savol yozing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white ml-2 shrink-0 active:scale-90 transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
