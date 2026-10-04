import re
with open("src/english/components/PartnerSpeakingView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Using regex to remove the qoida text
content = re.sub(r'<div className="text-\[10\.5px\].*?</div>', '', content, flags=re.DOTALL)

# Updating the onClick of handleFinishRating
old_btn = """            <button
              onClick={handleFinishRating}"""
new_btn = """            <button
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
content = content.replace(old_btn, new_btn)

with open("src/english/components/PartnerSpeakingView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
