/**
 * Exam microphone recorder.
 *
 * Why this exists: in Telegram's Android WebView every `SpeechRecognition.start()`
 * triggers a fresh "allow microphone?" prompt (and Android auto-stops recognition
 * after a few seconds of silence, causing more restarts and more prompts).
 *
 * Instead we call getUserMedia exactly ONCE per exam part, keep that stream open
 * until the part ends, and record each answer with MediaRecorder on the same
 * stream (no new permission needed). Audio is transcribed server-side.
 */

export interface ExamRecorder {
  /** Opens the microphone once. Returns false if denied / unsupported. */
  ensureMic: () => Promise<boolean>;
  /** Starts recording one answer on the already-open stream. */
  startTurn: () => boolean;
  /** Stops the current answer and resolves with its audio (or null). */
  stopTurn: () => Promise<Blob | null>;
  isRecording: () => boolean;
  /** Closes the microphone (call when the part / full test ends). */
  release: () => void;
}

const pickMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
};

export const isRecordingSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof MediaRecorder !== 'undefined';

export const createExamRecorder = (): ExamRecorder => {
  let stream: MediaStream | null = null;
  let pendingStream: Promise<MediaStream | null> | null = null;
  let recorder: MediaRecorder | null = null;
  const turnChunks = new WeakMap<MediaRecorder, Blob[]>();

  const streamIsLive = () => !!stream && stream.getAudioTracks().some((t) => t.readyState === 'live');

  const ensureMic = async (): Promise<boolean> => {
    if (streamIsLive()) return true;
    if (!isRecordingSupported()) return false;
    if (!pendingStream) {
      pendingStream = navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
        .catch((err) => {
          console.warn('Microphone permission failed:', err);
          return null;
        });
    }
    stream = await pendingStream;
    pendingStream = null;
    return streamIsLive();
  };

  const startTurn = (): boolean => {
    if (!streamIsLive() || !stream) return false;
    if (recorder && recorder.state === 'recording') return true;
    try {
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32000 } : undefined);
      const chunks: Blob[] = [];
      turnChunks.set(rec, chunks);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.start(1000);
      recorder = rec;
      return true;
    } catch (err) {
      console.warn('MediaRecorder start failed:', err);
      recorder = null;
      return false;
    }
  };

  const stopTurn = (): Promise<Blob | null> => {
    const active = recorder;
    recorder = null;
    if (!active || active.state === 'inactive') return Promise.resolve(null);
    return new Promise((resolve) => {
      active.onstop = () => {
        const chunks = turnChunks.get(active) || [];
        const blob = chunks.length ? new Blob(chunks, { type: active.mimeType || 'audio/webm' }) : null;
        resolve(blob && blob.size > 1500 ? blob : null);
      };
      try {
        active.stop();
      } catch {
        resolve(null);
      }
    });
  };

  const release = () => {
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {}
    recorder = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  return {
    ensureMic,
    startTurn,
    stopTurn,
    isRecording: () => !!recorder && recorder.state === 'recording',
    release,
  };
};

/** Sends one recorded answer to the server and returns the English transcript. */
export const transcribeAudio = async (blob: Blob): Promise<string> => {
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'audio/webm' },
    body: blob,
  });
  if (!res.ok) {
    throw new Error(`Transcription failed: ${res.status}`);
  }
  const data = await res.json();
  return String(data.text || '').trim();
};

/** Resolves pending transcriptions into the answer history (keeps placeholders on failure). */
export const resolvePendingAnswers = async (
  history: { question: string; answer: string }[],
  pending: Map<number, Promise<string>>,
  timeoutMs = 60000
): Promise<{ history: { question: string; answer: string }[]; failed: number }> => {
  let failed = 0;
  const withTimeout = (p: Promise<string>) =>
    Promise.race([p, new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))]);

  const filled = await Promise.all(
    history.map(async (item, idx) => {
      const p = pending.get(idx);
      if (!p) return item;
      try {
        const text = (await withTimeout(p)).trim();
        return text ? { ...item, answer: text } : item;
      } catch (err) {
        console.warn('Answer transcription error:', err);
        failed += 1;
        return item;
      }
    })
  );
  pending.clear();
  return { history: filled, failed };
};
