import re
with open('src/english/components/PartnerSpeakingView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove MALE_PARTNERS and FEMALE_PARTNERS
content = re.sub(r'const MALE_PARTNERS: MatchedPartner\[\] = \[.*?\];', '', content, flags=re.DOTALL)
content = re.sub(r'const FEMALE_PARTNERS: MatchedPartner\[\] = \[.*?\];', '', content, flags=re.DOTALL)

# 2. Fix triggerHaptic('success')
content = content.replace("triggerHaptic('success')", "triggerHaptic('heavy')")

# 3. Fix handleEndSession (move it up)
# Let's find handleEndSession
end_session_pattern = r'  const handleEndSession = \(\) => \{.*?  \};'
end_session_match = re.search(end_session_pattern, content, flags=re.DOTALL)
if end_session_match:
    end_session_str = end_session_match.group(0)
    # Remove it from current place
    content = content.replace(end_session_str, '')
    # Put it before useEffect
    use_effect_pos = content.find('  // WebSocket Search logic')
    if use_effect_pos != -1:
        content = content[:use_effect_pos] + end_session_str + '\n\n' + content[use_effect_pos:]

with open('src/english/components/PartnerSpeakingView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
