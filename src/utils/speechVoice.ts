/**
 * Speech Synthesis Helper that guarantees authentic native English pronunciation
 * and prevents fallback to Russian/device default accents on localized systems.
 */
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch {
      cachedVoices = [];
    }
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const getEnglishVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : (window.speechSynthesis.getVoices() || []);
  if (!voices || voices.length === 0) return null;

  // 1. Natural / Online / Google / Neural English (UK or US)
  const premium = voices.find(
    (v) =>
      (v.lang.toLowerCase().startsWith('en') || v.lang === 'en-GB' || v.lang === 'en-US') &&
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online') || v.name.includes('Neural'))
  );
  if (premium) return premium;

  // 2. High-quality British English (ideal for IELTS / CEFR)
  const british = voices.find((v) => v.lang === 'en-GB' || v.lang.startsWith('en-GB') || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('british'));
  if (british) return british;

  // 3. Clear US English
  const us = voices.find((v) => v.lang === 'en-US' || v.lang.startsWith('en-US') || v.name.toLowerCase().includes('us') || v.name.toLowerCase().includes('english'));
  if (us) return us;

  // 4. Any English voice
  const anyEnglish = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  if (anyEnglish) return anyEnglish;

  return null;
};

export const speakEnglishText = (
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
): (() => void) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options?.onEnd) options.onEnd();
    return () => {};
  }

  let ended = false;
  const safeEnd = () => {
    if (!ended) {
      ended = true;
      if (options?.onEnd) options.onEnd();
    }
  };

  const safetyTimer = setTimeout(() => {
    safeEnd();
  }, Math.max(2500, Math.min(12000, text.length * 85)));

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getEnglishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1.0;

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      safeEnd();
    };
    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      safeEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    clearTimeout(safetyTimer);
    safeEnd();
  }

  return () => {
    clearTimeout(safetyTimer);
    try { window.speechSynthesis.cancel(); } catch {}
  };
};
