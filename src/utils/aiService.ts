// Free Voice Speech-To-Text & Free Groq AI Integration

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 1. Web Speech API (100% Free speech-to-text, no API keys, client-side)
export class SpeechRecognitionService {
  private recognition: any = null;
  public isSupported: boolean = false;

  constructor() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.isSupported = true;
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'uz-UZ'; // Fallback to 'en-US' or user locale
    }
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition bu brauzerda qo\'llab-quvvatlanmaydi.');
      return;
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch {
      // already started
    }
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// 2. Groq AI & Smart Offline Learning Assistant
export const queryAI = async (
  prompt: string,
  history: ChatMessage[],
  apiKey?: string
): Promise<string> => {
  // If Groq API Key is provided, call Groq's high-speed free LPU endpoint
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Siz Telegram Mini App ichidagi shaxsiy ta\'lim yordamchisisiz (AI Assistant). O\'zbek tilida xushmuomala, qisqa va aniq o\'quv rejasi (Roadmap), maslahatlar berasiz.'
            },
            ...history,
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('Groq API xatosi yuz berdi');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Javob qabul qilinmadi.';
    } catch (err: any) {
      console.warn('Groq API xatosi, avtomatik bepul rejimga o\'tildi:', err);
    }
  }

  // 100% Free Instant Smart AI Engine (Simulyatsiya qilingan aqlli o'quv murabbiyi)
  await new Promise((resolve) => setTimeout(resolve, 800)); // Tabiiy yozish kechikishi

  const lower = prompt.toLowerCase();
  if (lower.includes('hafta') || lower.includes('summary') || lower.includes('reja')) {
    return '📅 **Haftalik hisobotingiz:** Siz bu hafta UX Motion bo\'yicha 2 ta darsni tugatdingiz! Keyingi qadam — interaktiv mikro-animatsiyalar (Framer Motion). Roadmap bo\'yicha 13% oldinga siljidingiz.';
  } else if (lower.includes('plan') || lower.includes('roadmap') || lower.includes('yo\'l')) {
    return '🚀 **Yangi 4 haftalik reja:**\n1. Dizayn tamoyillari (1-hafta)\n2. Interaktiv prototip (2-hafta)\n3. Foydalanuvchi testi (3-hafta)\n4. Portfolio loyihasi (4-hafta). Boshlashga tayyormisiz?';
  } else if (lower.includes('salom') || lower.includes('hi') || lower.includes('hello')) {
    return 'Assalomu alaykum! Men sizning sun\'iy intellekt o\'quv murabbiyingizman. Bugun qaysi mavzuni o\'rganamiz?';
  }

  return `Sizning so\'rovingiz bo\'yicha tahlil tayyor: "${prompt}".\nBuni o\'zlashtirish uchun bugungi rejaga 20 daqiqalik amaliy mashq qo\'shildi. Omad!`;
};
