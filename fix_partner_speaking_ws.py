import re

with open("src/english/components/PartnerSpeakingView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add WS state
if "const [ws, setWs] = useState<WebSocket | null>(null);" not in content:
    content = content.replace("const [copiedInvite, setCopiedInvite] = useState(false);", "const [copiedInvite, setCopiedInvite] = useState(false);\n  const [ws, setWs] = useState<WebSocket | null>(null);")
    
# Add matchedPartner any type since it now comes from WS
content = content.replace("const [matchedPartner, setMatchedPartner] = useState<MatchedPartner | null>(null);", "const [matchedPartner, setMatchedPartner] = useState<any>(null);")

# 2. Find and replace the search interval useEffect
old_search = r"  // Search interval\s*useEffect\(\(\) => \{\s*let interval: any;\s*if \(matchStatus === 'searching'\) \{.*?\}\s*\}, \[matchStatus, filterGender\]\);"
new_search = r"""  // WebSocket Search logic
  useEffect(() => {
    let interval: any;
    if (matchStatus === 'searching') {
      interval = setInterval(() => {
        setSearchTimer((prev: number) => {
          if (prev >= 60) {
            handleCancelSearch();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      
      const socket = new WebSocket(`wss://todo-mini-app-cwkd.onrender.com/ws/matchmake?user_id=${userId}`);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'match_found') {
          setMatchedPartner(data.partner);
          setMatchStatus('matched');
          triggerHaptic('heavy');
        } else if (data.type === 'chat_message') {
          if (data.text === 'CONSENT') {
            setPartnerConsented(true);
            triggerHaptic('success');
          } else if (data.text === 'TURN_SWITCH') {
            setSpeakerTurn(prev => prev === 'me' ? 'partner' : 'me');
            triggerHaptic('light');
          } else if (data.text.startsWith('PART_')) {
            setActivePart(data.text.replace('PART_', '').toLowerCase() as any);
            triggerHaptic('light');
          }
        } else if (data.type === 'partner_left') {
          handleEndSession();
        }
      };
      socket.onclose = () => {
        setWs(null);
      };
      setWs(socket);
      
      return () => {
        clearInterval(interval);
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    }
  }, [matchStatus, userId]);"""
content = re.sub(old_search, new_search, content, flags=re.DOTALL)

# 3. Update handlers
content = content.replace("const handleCancelSearch = () => {\n    triggerHaptic('light');\n    setMatchStatus('idle');", "const handleCancelSearch = () => {\n    triggerHaptic('light');\n    if (ws) ws.close();\n    setMatchStatus('idle');")
content = content.replace("const handleEndSession = () => {\n    triggerHaptic('medium');\n    setMatchStatus('idle');", "const handleEndSession = () => {\n    triggerHaptic('medium');\n    if (ws) ws.close();\n    setMatchStatus('idle');")

content = content.replace("const handleShareConsent = () => {\n    triggerHaptic('medium');\n    setHasSharedConsent(true);\n    // Partner consents shortly after\n    setTimeout(() => {\n      setPartnerConsented(true);\n      triggerHaptic('heavy');\n    }, 900);\n  };", "const handleShareConsent = () => {\n    triggerHaptic('medium');\n    setHasSharedConsent(true);\n    if (ws) ws.send(JSON.stringify({ type: 'chat_message', text: 'CONSENT' }));\n  };")

# 4. Turn switch
content = content.replace("setSpeakerTurn((prev: 'me' | 'partner') => (prev === 'me' ? 'partner' : 'me'));\n                  }", "setSpeakerTurn((prev: 'me' | 'partner') => (prev === 'me' ? 'partner' : 'me'));\n                    if (ws) ws.send(JSON.stringify({ type: 'chat_message', text: 'TURN_SWITCH' }));\n                  }")

# 5. Parts sync
content = content.replace("setActivePart('part1');\n                  }", "setActivePart('part1');\n                    if (ws) ws.send(JSON.stringify({ type: 'chat_message', text: 'PART_1' }));\n                  }")
content = content.replace("setActivePart('part2');\n                  }", "setActivePart('part2');\n                    if (ws) ws.send(JSON.stringify({ type: 'chat_message', text: 'PART_2' }));\n                  }")
content = content.replace("setActivePart('part3');\n                  }", "setActivePart('part3');\n                    if (ws) ws.send(JSON.stringify({ type: 'chat_message', text: 'PART_3' }));\n                  }")

# 6. Show stats
content = content.replace("<span className=\"w-1.5 h-1.5 rounded-full bg-emerald-500\"></span> Online\n                    <span className=\"text-slate-300\">•</span>\n                    {matchedPartner.level}", "<span className=\"w-1.5 h-1.5 rounded-full bg-emerald-500\"></span> Online\n                    <span className=\"text-slate-300\">•</span>\n                    <span className=\"text-indigo-500\">👍 {matchedPartner.likes || 0}</span>\n                    <span className=\"text-rose-500 ml-1\">👎 {matchedPartner.dislikes || 0}</span>")

with open("src/english/components/PartnerSpeakingView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
