import re

with open("src/english/components/PartnerSpeakingView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add getTelegramUser import
content = content.replace("import { Play, Square, Mic, BookOpen, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, User, MicOff, Check, X, ThumbsUp, ThumbsDown, StopCircle, Sparkles, AlertTriangle } from 'lucide-react';", "import { Play, Square, Mic, BookOpen, Clock, AlertCircle, RefreshCw, Send, CheckCircle2, User, MicOff, Check, X, ThumbsUp, ThumbsDown, StopCircle, Sparkles, AlertTriangle } from 'lucide-react';\nimport { getTelegramUser } from '../../utils/telegram';")

# 2. Update state to support likes, dislikes, ws
hooks_old = """  const [isSearching, setIsSearching] = useState(false);
  const [partnerFound, setPartnerFound] = useState(false);
  const [matchedPartner, setMatchedPartner] = useState<{name: string, username: string, level: string, profilePic?: string} | null>(null);
  const [myConsent, setMyConsent] = useState(false);
  const [partnerConsented, setPartnerConsented] = useState(false);"""

hooks_new = """  const [isSearching, setIsSearching] = useState(false);
  const [partnerFound, setPartnerFound] = useState(false);
  const [matchedPartner, setMatchedPartner] = useState<{id: string, name: string, username?: string, likes: number, dislikes: number} | null>(null);
  const [myConsent, setMyConsent] = useState(false);
  const [partnerConsented, setPartnerConsented] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);"""

content = content.replace(hooks_old, hooks_new)

# 3. Update startSearch logic
search_old = """  const startSearch = () => {
    setIsSearching(true);
    setPartnerFound(false);
    setShowRatingModal(false);
    setSelectedSticker(null);
    setDislikeReason('');
    setMyConsent(false);
    setPartnerConsented(false);
    triggerHaptic('medium');

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
      setPartnerFound(true);
      setMatchedPartner({
        name: 'Asadbek',
        username: 'asadbek_ielts',
        level: 'B2 / IELTS 6.5',
      });
      triggerHaptic('success');
    }, 3500);
  };"""

search_new = """  const startSearch = () => {
    setIsSearching(true);
    setPartnerFound(false);
    setShowRatingModal(false);
    setSelectedSticker(null);
    setDislikeReason('');
    setMyConsent(false);
    setPartnerConsented(false);
    triggerHaptic('medium');

    const userId = getTelegramUser()?.id || Date.now();
    const socket = new WebSocket(`wss://todo-mini-app-cwkd.onrender.com/ws/matchmake?user_id=${userId}`);
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'match_found') {
            setMatchedPartner(data.partner);
            setIsSearching(false);
            setPartnerFound(true);
            triggerHaptic('success');
        } else if (data.type === 'chat_message') {
            if (data.text === 'CONSENT') {
                setPartnerConsented(true);
            }
        } else if (data.type === 'partner_left') {
            socket.close();
            setWs(null);
            setPartnerFound(false);
            setShowRatingModal(true);
        }
    };
    socket.onclose = () => {
        setWs(null);
        if (isSearching) setIsSearching(false);
    };
    setWs(socket);
  };"""

content = content.replace(search_old, search_new)

# 4. Update End Session logic
end_old = """  const handleEndSession = () => {
    // End session -> open rating modal
    triggerHaptic('medium');
    setPartnerFound(false);
    setShowRatingModal(true);
  };"""

end_new = """  const handleEndSession = () => {
    triggerHaptic('medium');
    if (ws) {
        ws.close();
        setWs(null);
    }
    setPartnerFound(false);
    setShowRatingModal(true);
  };"""
  
content = content.replace(end_old, end_new)

# 5. Update Share Consent
consent_old = """  const handleShareConsent = () => {
    setMyConsent(true);
    triggerHaptic('light');
    
    // Simulate partner consenting after 2 seconds
    setTimeout(() => {
      setPartnerConsented(true);
      triggerHaptic('success');
    }, 2000);
  };"""
  
consent_new = """  const handleShareConsent = () => {
    setMyConsent(true);
    triggerHaptic('light');
    if (ws) {
        ws.send(JSON.stringify({ type: 'chat_message', text: 'CONSENT' }));
    }
  };"""
  
content = content.replace(consent_old, consent_new)

# 6. Update Partner display to show likes/dislikes
partner_disp_old = """              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-[#7052ff]/20 flex items-center justify-center text-[#7052ff] font-black text-xl uppercase">
                  {matchedPartner.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{matchedPartner.name}</h3>
                  <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    <span className="text-slate-300">•</span>
                    {matchedPartner.level}
                  </p>
                </div>
              </div>"""

partner_disp_new = """              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-[#7052ff]/20 flex items-center justify-center text-[#7052ff] font-black text-xl uppercase">
                  {matchedPartner.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{matchedPartner.name}</h3>
                  <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                    <span className="text-slate-300">•</span>
                    <ThumbsUp size={10} className="text-indigo-500"/> {matchedPartner.likes || 0}
                    <ThumbsDown size={10} className="text-rose-500 ml-1"/> {matchedPartner.dislikes || 0}
                  </p>
                </div>
              </div>"""

content = content.replace(partner_disp_old, partner_disp_new)

# 7. Remove penalty texts and update rating submission
rate_end_old = """            <div className="text-[10.5px] text-slate-400 bg-slate-50 p-2.5 rounded-xl text-left border border-slate-100">
              ?' <b>Qoida:</b> 10 ta dislike olgan foydalanuvchi hisobi qulflanadi (qulfni ochish: 6,700 so'm). Har bir Like 1 ta dislike'ni kamaytiradi.
            </div>

            <button
              onClick={handleFinishRating}"""

rate_end_new = """            <button
              onClick={async () => {
                  if (matchedPartner && selectedSticker) {
                      await fetch(`https://todo-mini-app-cwkd.onrender.com/api/rate_partner`, {
                          method: 'POST',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ partner_id: matchedPartner.id, action: selectedSticker })
                      });
                  }
                  handleFinishRating();
              }}"""

content = content.replace(rate_end_old, rate_end_new)

# Remove span penalty texts
span_like_old = """                <span className="mt-2 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  -1 jarima kamayadi
                </span>"""
span_like_new = ""
content = content.replace(span_like_old, span_like_new)

span_dislike_old = """                <span className="mt-2 text-[9px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                  +1 ta shikoyat
                </span>"""
span_dislike_new = ""
content = content.replace(span_dislike_old, span_dislike_new)


with open("src/english/components/PartnerSpeakingView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

