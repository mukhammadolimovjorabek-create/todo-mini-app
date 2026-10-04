/**
 * Band 9.0 British Council IELTS Examiner Audio Service
 * Uses Edge Neural British examiner voice via backend /api/tts.
 * Strictly NEVER falls back to Russian or non-English voices.
 */

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function speakEnglishText(
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
): () => void {
  stopSpeaking();

  const onEnd = options?.onEnd;
  let ended = false;
  const finish = () => {
    if (!ended) {
      ended = true;
      currentAudio = null;
      if (onEnd) onEnd();
    }
  };

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = isLocal ? 'http://localhost:8000' : 'https://todo-mini-app-cwkd.onrender.com';
  const ttsUrl = `${baseUrl}/api/tts?text=${encodeURIComponent(text)}&voice=en-GB-RyanNeural`;

  const audio = new Audio(ttsUrl);
  currentAudio = audio;

  // Safety timer in case audio stalls
  const safetyTimer = setTimeout(() => {
    finish();
  }, Math.max(3000, text.length * 90));

  audio.onended = () => {
    clearTimeout(safetyTimer);
    finish();
  };

  audio.onerror = () => {
    clearTimeout(safetyTimer);
    console.warn('Backend TTS failed, checking device native English voice...');
    playStrictEnglishWebSpeech(text, finish);
  };

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('Audio play interrupted or waiting for gesture:', err);
      clearTimeout(safetyTimer);
      playStrictEnglishWebSpeech(text, finish);
    });
  }

  return () => {
    clearTimeout(safetyTimer);
    stopSpeaking();
  };
}

function playStrictEnglishWebSpeech(text: string, onEnd: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd();
    return;
  }

  const voices = window.speechSynthesis.getVoices() || [];
  // Strictly British or American English
  const enVoice = voices.find(
    (v) =>
      (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) ||
      (v.lang === 'en-US' || v.lang.startsWith('en-US')) ||
      v.lang.toLowerCase().startsWith('en')
  );

  // CRITICAL: If no English voice is installed on device, NEVER speak in Russian!
  if (!enVoice) {
    console.warn('No English voice available in OS, skipping speech to avoid Russian accent');
    onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = enVoice;
    utterance.lang = enVoice.lang;
    utterance.rate = 0.95;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd();
  }
}
