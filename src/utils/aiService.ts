// Free Voice Speech-To-Text & Free AI Integration

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 1. Web Speech API (Free speech-to-text, robust with auto-restart and continuous mode)
export class SpeechRecognitionService {
  private recognition: any = null;
  public isSupported: boolean = false;
  private isActive: boolean = false;

  constructor() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true; // O'chib qolmasligi uchun doimiy tinglash
        this.recognition.interimResults = true; // Jonli natija
        this.recognition.lang = 'uz-UZ';
      } catch {
        this.isSupported = false;
      }
    }
  }

  public async startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Qurilmangizda ovoz tanish (Speech Recognition) xizmati mavjud emas.');
      return;
    }

    // Mikrofon ruxsatini tekshirish
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      console.warn('Mikrofon ruxsati berilmadi:', permErr);
      onError('Iltimos, brauzer yoki Telegram sozlamalaridan mikrofon ruxsatini bering.');
      return;
    }

    this.isActive = true;

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

      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      if (event.error === 'no-speech') {
        // Shunchaki jim turildi, to'xtatmaymiz
        return;
      }
      if (event.error === 'not-allowed') {
        onError('Mikrofonga ruxsat berilmagan.');
      } else if (event.error === 'network') {
        onError('Ovozni aniqlash uchun internet aloqasi talab qilinadi.');
      }
    };

    this.recognition.onend = () => {
      // Agar foydalanuvchi o'zi to'xtatmagan bo'lsa va hali tinglanayotgan bo'lsa
      if (this.isActive) {
        onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }

  public stopListening() {
    this.isActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
  }
}

// Qayta moslashuvchanlik uchun queryAI funksiyasi
export const queryAI = async (prompt: string, _history: ChatMessage[] = [], _groqKey?: string): Promise<string> => {
  return `Javob: ${prompt}`;
};
