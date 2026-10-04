with open("src/english/components/IeltsDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add showSpeakingModal state
hooks_old = """  export const IeltsDashboard: React.FC<Props> = ({ onBack, userName, userGender, initialView = 'menu' }) => {
    const [activeView, setActiveView] = useState<ActiveView>(initialView);"""

hooks_new = """  export const IeltsDashboard: React.FC<Props> = ({ onBack, userName, userGender, initialView = 'menu' }) => {
    const [activeView, setActiveView] = useState<ActiveView>(initialView);
    const [showSpeakingModal, setShowSpeakingModal] = useState(false);"""
content = content.replace(hooks_old, hooks_new)

# Add Modal at the end before final closing div
modal_code = """
        {/* Speaking Mode Modal */}
        {showSpeakingModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0a0818]/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#181630] border border-white/10 w-full max-w-sm rounded-[2rem] p-6 space-y-5 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              
              <button 
                onClick={() => setShowSpeakingModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>

              <div className="text-center space-y-1 pr-8">
                <h3 className="text-xl font-black text-white tracking-tight">Speaking Tartibi</h3>
                <p className="text-xs text-slate-400 font-medium">Kim bilan shug'ullanishni tanlang:</p>
              </div>

              <div className="space-y-3">
                {/* 1. AI Examiner */}
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    setShowSpeakingModal(false);
                    setActiveView('ai_speaking');
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#c4f82a]/20 flex items-center justify-center text-[#c4f82a] shrink-0">
                    <SpeakingWaveform width={24} height={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-[#c4f82a] transition-colors">AI Examiner</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Xatosiz, aqlli sun'iy intellekt (9.0 daraja)</p>
                  </div>
                  <div className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-[#c4f82a] group-hover:text-black transition-all">
                    <ArrowRight size={12} />
                  </div>
                </button>

                {/* 2. Global Match */}
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    setShowSpeakingModal(false);
                    setActiveView('partner_speaking');
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 active:scale-[0.98] transition-all flex items-center gap-4 group shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">Global Match (Jonli)</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Haqiqiy insonlar bilan jonli suhbat</p>
                  </div>
                  <div className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <ArrowRight size={12} />
                  </div>
                </button>
              </div>

            </div>
          </div>
        )}
"""

content = content.replace("      </div>\n    );\n  };\n", modal_code + "      </div>\n    );\n  };\n")

with open("src/english/components/IeltsDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
