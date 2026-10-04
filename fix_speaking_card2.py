import re

with open("src/english/components/IeltsDashboard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the paragraph text
content = re.sub(r'AI bilan jonli suhbat yoki sherik topib mashq qiling\.', r"AI bilan shug'ullaning yoki haqiqiy inson bilan muloqot qiling.", content)

# Replace the Sherik bilan button with Global Match div
sherik_btn = r'<button[^>]*onClick=\{\(\) => \{\s*triggerHaptic\(\'light\'\);\s*setActiveView\(\'partner_speaking\'\);\s*\}\}[^>]*>\s*<Users[^>]*/>\s*<span>Sherik bilan</span>\s*</button>'
global_match_div = r"""<div className="text-[11px] font-extrabold text-indigo-100 bg-gradient-to-r from-indigo-500/30 to-purple-500/25 px-3 py-1.5 rounded-xl border border-indigo-400/40 shadow-xs flex items-center space-x-1.5">
                  <Users size={12} className="text-indigo-300 shrink-0" />
                  <span>Global Match</span>
                </div>"""
content = re.sub(sherik_btn, global_match_div, content)

# Change Boshlash button onClick to open modal instead of ai_speaking
boshlash_old = r"triggerHaptic\('medium'\);\s*setActiveView\('ai_speaking'\);"
boshlash_new = r"triggerHaptic('medium'); setShowSpeakingModal(true);"
content = re.sub(boshlash_old, boshlash_new, content)

with open("src/english/components/IeltsDashboard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
