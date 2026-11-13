/**
 * Band 9.0 British Council IELTS Examiner Audio Service
 * Supports multi-chunk British & American voices, playback speed control,
 * Render neural voice fallback, and sequential multi-speaker dialogue playback.
 * Strictly NEVER falls back to Russian or non-English voices.
 */

import { API_BASE_URL } from '../config';

let currentAudio: HTMLAudioElement | null = null;
let currentSafetyTimer: ReturnType<typeof setTimeout> | null = null;
let dialogueCancelled = false;

export function stopSpeaking(): void {
  dialogueCancelled = true;
  if (currentSafetyTimer) {
    clearTimeout(currentSafetyTimer);
    currentSafetyTimer = null;
  }
  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch {}
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  lang?: string;
  preferNeural?: boolean;
  onEnd?: () => void;
}

export function speakEnglishText(
  text: string,
  options?: SpeakOptions
): () => void {
  stopSpeaking();
  dialogueCancelled = false;

  const onEnd = options?.onEnd;
  const rate = options?.rate ?? 1;
  const voice = options?.voice || 'en-GB-RyanNeural';
  const lang = options?.lang || (voice.startsWith('en-US') ? 'en-US' : 'en-GB');
  let ended = false;

  const finish = () => {
    if (!ended) {
      ended = true;
      if (currentSafetyTimer) {
        clearTimeout(currentSafetyTimer);
        currentSafetyTimer = null;
      }
      currentAudio = null;
      if (onEnd) onEnd();
    }
  };

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const processedText = text.replace(/\bIELTS\b/gi, 'Eye-elts');
  const query = `text=${encodeURIComponent(processedText)}&lang=${encodeURIComponent(lang)}&voice=${encodeURIComponent(voice)}`;
  const primaryBase = isLocal
    ? 'http://localhost:8000'
    : options?.preferNeural && API_BASE_URL
    ? API_BASE_URL
    : '';
  const fallbackBase = primaryBase === API_BASE_URL ? '' : API_BASE_URL;

  const playFromUrl = (url: string, onFail: () => void) => {
    const audio = new Audio(url);
    audio.playbackRate = rate;
    currentAudio = audio;

    currentSafetyTimer = setTimeout(() => {
      finish();
    }, Math.max(4000, Math.round((text.length * 100) / Math.max(0.6, rate))));

    audio.onended = () => {
      if (currentSafetyTimer) {
        clearTimeout(currentSafetyTimer);
        currentSafetyTimer = null;
      }
      finish();
    };

    audio.onerror = () => {
      if (currentSafetyTimer) {
        clearTimeout(currentSafetyTimer);
        currentSafetyTimer = null;
      }
      onFail();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (currentSafetyTimer) {
          clearTimeout(currentSafetyTimer);
          currentSafetyTimer = null;
        }
        onFail();
      });
    }
  };

  const primaryUrl = `${primaryBase}/api/tts?${query}`;
  playFromUrl(primaryUrl, () => {
    if (ended || dialogueCancelled) return;
    if (fallbackBase && fallbackBase !== primaryBase) {
      playFromUrl(`${fallbackBase}/api/tts?${query}`, () => {
        playStrictEnglishWebSpeech(text, rate, finish);
      });
    } else {
      playStrictEnglishWebSpeech(text, rate, finish);
    }
  });

  return () => {
    stopSpeaking();
  };
}

export interface DialogueTurn {
  speaker: string;
  voice?: string;
  text: string;
}

/**
 * Plays a multi-turn Listening script sequentially across speakers.
 * Returns a cancellation function.
 */
export function speakDialogue(
  turns: DialogueTurn[],
  callbacks?: {
    startIndex?: number;
    rate?: number;
    onTurnChange?: (index: number) => void;
    onComplete?: () => void;
  }
): () => void {
  stopSpeaking();
  dialogueCancelled = false;

  const startIdx = Math.max(0, callbacks?.startIndex ?? 0);
  const rate = callbacks?.rate ?? 1;

  const playIndex = (idx: number) => {
    if (dialogueCancelled) return;
    if (idx >= turns.length) {
      callbacks?.onComplete?.();
      return;
    }
    const turn = turns[idx];
    callbacks?.onTurnChange?.(idx);
    speakEnglishText(turn.text, {
      voice: turn.voice || 'en-GB-RyanNeural',
      rate,
      preferNeural: true,
      onEnd: () => {
        if (dialogueCancelled) return;
        setTimeout(() => {
          if (!dialogueCancelled) playIndex(idx + 1);
        }, 450);
      },
    });
  };

  playIndex(startIdx);
  return () => {
    stopSpeaking();
  };
}

function playStrictEnglishWebSpeech(text: string, rate: number, onEnd: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd();
    return;
  }

  const voices = window.speechSynthesis.getVoices() || [];
  const enVoice = voices.find(
    (v) =>
      v.lang === 'en-GB' ||
      v.lang.startsWith('en-GB') ||
      v.lang === 'en-US' ||
      v.lang.startsWith('en-US') ||
      v.lang.toLowerCase().startsWith('en')
  );

  // CRITICAL: If no English voice is installed on device, NEVER speak in Russian!
  if (!enVoice) {
    onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const processedText = text.replace(/\bIELTS\b/gi, 'Eye-elts');
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.voice = enVoice;
    utterance.lang = enVoice.lang;
    utterance.rate = rate;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd();
  }
}
