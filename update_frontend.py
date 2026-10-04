import os

# Update ScreenAnalytics.tsx
with open("src/components/ScreenAnalytics.tsx", "r", encoding="utf-8") as f:
    content = f.read()

unfriend_fn = """  const handleUnfriend = async (friendId: string) => {
    try {
      const user = getTelegramUser();
      await fetch(`https://todo-mini-app-cwkd.onrender.com/api/unfriend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, friend_id: friendId })
      });
      setFriendsList(prev => prev.filter(f => f.id !== friendId));
    } catch(e) {
      console.error(e);
    }
  };"""

content = content.replace("const scoreData = calculateUserPoints();", unfriend_fn + "\n\n  const scoreData = calculateUserPoints();")

friend_item_old = """                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-50">
                      {friend.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{friend.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{friend.joinedAt} da qo'shildi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-500">{friend.points} ball</p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                      <Flame size={10} className="text-amber-500" />
                      {friend.streak} kun
                    </p>
                  </div>"""

friend_item_new = """                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-50">
                      {friend.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{friend.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{friend.joinedAt} da qo'shildi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-emerald-500">{friend.points} ball</p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                        <Flame size={10} className="text-amber-500" />
                        {friend.streak} kun
                      </p>
                    </div>
                    <button onClick={() => handleUnfriend(friend.id)} className="p-2 text-red-400 hover:text-red-500 bg-red-50 rounded-xl transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" y1="8" x2="23" y2="14"></line><line x1="23" y1="8" x2="17" y2="14"></line></svg>
                    </button>
                  </div>"""

content = content.replace(friend_item_old, friend_item_new)

with open("src/components/ScreenAnalytics.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Update ScreenLanguage.tsx
with open("src/components/ScreenLanguage.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()
    
# We need to replace the whole fake matchmaking logic with WebSocket logic
import re

content2 = content2.replace("import { Play, Square, Mic, BookOpen, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, User, MicOff, Check, X, ThumbsUp, ThumbsDown, StopCircle } from 'lucide-react';", "import { Play, Square, Mic, BookOpen, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, User, MicOff, Check, X, ThumbsUp, ThumbsDown, StopCircle } from 'lucide-react';\nimport { getTelegramUser } from '../utils/telegram';")

old_hooks = """  const [isSearching, setIsSearching] = useState(false);
  const [partnerFound, setPartnerFound] = useState(false);
  const [partnerChat, setPartnerChat] = useState<{me: boolean, text: string}[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);"""

new_hooks = """  const [isSearching, setIsSearching] = useState(false);
  const [partnerFound, setPartnerFound] = useState(false);
  const [partnerChat, setPartnerChat] = useState<{me: boolean, text: string}[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [chatPartner, setChatPartner] = useState<any>(null);"""

content2 = content2.replace(old_hooks, new_hooks)

old_start_search = """  const startPartnerSearch = () => {
    setIsSearching(true);
    setPartnerFound(false);
    setShowEvaluation(false);
    triggerHaptic('medium');
    
    // Simulate finding a partner after 3 seconds
    setTimeout(() => {
      setIsSearching(false);
      setPartnerFound(true);
      setPartnerChat([{me: false, text: "Hi! I'm Alex. Are you ready to practice speaking?"}]);
      triggerHaptic('success');
    }, 3000);
  };"""
  
new_start_search = """  const startPartnerSearch = () => {
    setIsSearching(true);
    setPartnerFound(false);
    setShowEvaluation(false);
    setPartnerChat([]);
    triggerHaptic('medium');
    
    const userId = getTelegramUser()?.id || Date.now();
    const socket = new WebSocket(`wss://todo-mini-app-cwkd.onrender.com/ws/matchmake?user_id=${userId}`);
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'match_found') {
            setChatPartner(data.partner);
            setIsSearching(false);
            setPartnerFound(true);
            triggerHaptic('success');
        } else if (data.type === 'chat_message') {
            setPartnerChat(prev => [...prev, { text: data.text, me: false }]);
            triggerHaptic('light');
        } else if (data.type === 'partner_left') {
            socket.close();
            setWs(null);
            setPartnerFound(false);
            setShowEvaluation(true);
        }
    };
    socket.onclose = () => {
        if (!showEvaluation) {
           setWs(null);
           setIsSearching(false);
           setPartnerFound(false);
        }
    };
    setWs(socket);
  };"""
  
content2 = content2.replace(old_start_search, new_start_search)

old_end_chat = """  const endPartnerChat = () => {
    setPartnerFound(false);
    setShowEvaluation(true);
    triggerHaptic('medium');
  };"""
  
new_end_chat = """  const endPartnerChat = () => {
    if (ws) {
        ws.close();
        setWs(null);
    }
    setPartnerFound(false);
    setShowEvaluation(true);
    triggerHaptic('medium');
  };"""
  
content2 = content2.replace(old_end_chat, new_end_chat)

old_send_msg = """  const sendPartnerMessage = () => {
    if (!partnerInput.trim()) return;
    setPartnerChat(prev => [...prev, {me: true, text: partnerInput}]);
    setPartnerInput('');
    triggerHaptic('light');
    
    // Simulate partner response
    setTimeout(() => {
      setPartnerChat(prev => [...prev, {me: false, text: "That's a great point! Tell me more about it."}]);
      triggerHaptic('light');
    }, 2000);
  };"""
  
new_send_msg = """  const sendPartnerMessage = () => {
    if (!partnerInput.trim() || !ws) return;
    ws.send(JSON.stringify({ type: 'chat_message', text: partnerInput }));
    setPartnerChat(prev => [...prev, {me: true, text: partnerInput}]);
    setPartnerInput('');
    triggerHaptic('light');
  };"""
  
content2 = content2.replace(old_send_msg, new_send_msg)

old_rate = """                            <div className="flex gap-3">
                              <button 
                                onClick={() => setShowEvaluation(false)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-700 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                              >
                                <ThumbsDown size={24} className="text-red-500 mb-1" />
                                <span>Dislike</span>
                                <span className="text-[10px] text-slate-400 font-normal">1 ta jarima ayiradi</span>
                              </button>
                              <button 
                                onClick={() => setShowEvaluation(false)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-md shadow-indigo-200"
                              >
                                <ThumbsUp size={24} className="mb-1" />
                                <span>Like</span>
                                <span className="text-[10px] text-indigo-200 font-normal">1 ta qo'shadi</span>
                              </button>
                            </div>"""
                            
new_rate = """                            <div className="flex gap-3">
                              <button 
                                onClick={async () => {
                                  if (chatPartner) {
                                      await fetch(`https://todo-mini-app-cwkd.onrender.com/api/rate_partner`, {
                                          method: 'POST',
                                          headers: {'Content-Type': 'application/json'},
                                          body: JSON.stringify({ partner_id: chatPartner.id, action: 'dislike' })
                                      });
                                  }
                                  setShowEvaluation(false);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-700 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                              >
                                <ThumbsDown size={24} className="text-red-500 mb-1" />
                                <span>Dislike</span>
                              </button>
                              <button 
                                onClick={async () => {
                                  if (chatPartner) {
                                      await fetch(`https://todo-mini-app-cwkd.onrender.com/api/rate_partner`, {
                                          method: 'POST',
                                          headers: {'Content-Type': 'application/json'},
                                          body: JSON.stringify({ partner_id: chatPartner.id, action: 'like' })
                                      });
                                  }
                                  setShowEvaluation(false);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white flex flex-col items-center gap-1 active:scale-95 transition-transform shadow-md shadow-indigo-200"
                              >
                                <ThumbsUp size={24} className="mb-1" />
                                <span>Like</span>
                              </button>
                            </div>"""

content2 = content2.replace(old_rate, new_rate)

# Add partner stats display when matched
old_partner_header = """                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-bold">
                          A
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Alex</p>
                          <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                          </p>
                        </div>
                      </div>"""
                      
new_partner_header = """                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-bold text-lg uppercase">
                          {chatPartner?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{chatPartner?.name || 'User'}</p>
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <ThumbsUp size={10} className="text-indigo-500"/> {chatPartner?.likes || 0}
                            <ThumbsDown size={10} className="text-red-500 ml-1"/> {chatPartner?.dislikes || 0}
                          </p>
                        </div>
                      </div>"""
                      
content2 = content2.replace(old_partner_header, new_partner_header)

with open("src/components/ScreenLanguage.tsx", "w", encoding="utf-8") as f:
    f.write(content2)
