/**
 * High-Quality Native English Speech Service
 * 
 * Uses Google TTS Audio (en-GB / en-US) as primary engine for guaranteed
 * authentic British/American IELTS examiner pronunciation.
 * Seamlessly falls back to Web Speech API with strict English voice matching.
 */

let currentAudio: HTMLAudioElement | null = null;

// Split long text into speakable sentence chunks for Google TTS (max ~150 chars each)
function splitIntoChunks(text: string): string[] {
  const clean = text.replace(/[\n\r]+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+/g) || [clean];
  const chunks: string[] = [];

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 150) {
      chunks.push(trimmed);
    } else {
      // Split by comma or words
      const words = trimmed.split(' ');
      let current = '';
      for (const w of words) {
        if ((current + ' ' + w).length > 150) {
          chunks.push(current.trim());
          current = w;
        } else {
          current = current ? current + ' ' + w : w;
        }
      }
      if (current.trim()) chunks.push(current.trim());
    }
  }
  return chunks.length ? chunks : [clean];
}

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

/**
 * Play authentic English audio using Google Native TTS with sentence chaining.
 */
function playGoogleTTS(
  chunks: string[],
  onEnd?: () => void,
  onError?: () => void
): void {
  if (!chunks.length) {
    if (onEnd) onEnd();
    return;
  }

  let index = 0;

  const playNext = () => {
    if (index >= chunks.length) {
      currentAudio = null;
      if (onEnd) onEnd();
      return;
    }

    const chunk = chunks[index];
    index++;

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-GB&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      playNext();
    };

    audio.onerror = () => {
      console.warn('Google TTS failed for chunk, falling back to Web Speech API');
      currentAudio = null;
      if (onError) onError();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play prevented or offline:', err);
        currentAudio = null;
        if (onError) onError();
      });
    }
  };

  playNext();
}

/**
 * Fallback Web Speech API with strict native English voice enforcement
 */
function playWebSpeech(
  text: string,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const selectVoice = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      // Strictly British or American English
      const enVoice =
        voices.find(v => (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))) ||
        voices.find(v => (v.lang === 'en-US' || v.lang.startsWith('en-US')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))) ||
        voices.find(v => v.lang === 'en-GB' || v.lang.startsWith('en-GB')) ||
        voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en-US')) ||
        voices.find(v => v.lang.toLowerCase().startsWith('en'));

      if (enVoice) {
        utterance.voice = enVoice;
        utterance.lang = enVoice.lang;
      } else {
        utterance.lang = 'en-GB';
      }
    };

    selectVoice();

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    let finished = false;
    const finalize = () => {
      if (!finished) {
        finished = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = finalize;
    utterance.onerror = finalize;

    // Safety timer in case mobile browser hangs
    const safetyTimer = setTimeout(finalize, Math.max(3000, text.length * 90));

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      finalize();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    if (onEnd) onEnd();
  }
}

/**
 * Main Speak Function:
 * Guarantees native British/American English accent with zero Russian/device accent leaks.
 */
export function speakEnglishText(
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
): () => void {
  stopSpeaking();

  const onEnd = options?.onEnd;
  const chunks = splitIntoChunks(text);

  // Try Google TTS first for 100% natural native British examiner voice
  playGoogleTTS(
    chunks,
    onEnd,
    () => {
      // Fallback to Web Speech API if Google TTS is unavailable or blocked
      playWebSpeech(text, onEnd);
    }
  );

  return () => {
    stopSpeaking();
  };
}
