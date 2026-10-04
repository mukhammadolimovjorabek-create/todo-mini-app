with open('src/english/components/IeltsDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [activeView, setActiveView] = useState<ActiveView>(initialView);", "const [activeView, setActiveView] = useState<ActiveView>(initialView);\n  const [showSpeakingModal, setShowSpeakingModal] = useState(false);")
content = content.replace("triggerHaptic('success')", "triggerHaptic('heavy')")

with open('src/english/components/IeltsDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
