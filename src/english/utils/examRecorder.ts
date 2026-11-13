/**
 * Exam microphone recorder + Real-time Web Audio Acoustic Speech Analyzer
 * + Live Web Speech API listener + Remote STT (/api/transcribe).
 *
 * CRITICAL GUARANTEE:
 * Never fabricates or injects fake pre-written sentences! Every word returned
 * comes strictly from the candidate's actual spoken voice (or manual text if typed).
 */

import { getTelegramInitData } from '../../utils/telegram';
import { API_BASE_URL } from '../../config';

export interface TurnAcousticMetrics {
  durationSec: number;
  voicedSec: number;
  syllableBursts: number;
  pauseCount: number;
  avgRms: number;
  peakRms: number;
  estimatedWords: number;
  fluencyRatio: number;
}

export interface RecordedTurn {
  blob: Blob | null;
  metrics: TurnAcousticMetrics;
}

export interface ExamRecorder {
  /** Opens the microphone once. Returns false if denied / unsupported. */
  ensureMic: () => Promise<boolean>;
  /** Starts recording one answer on the already-open stream. */
  startTurn: (onLiveSpeech?: (liveText: string) => void) => boolean;
  /** Stops the current answer and resolves with its audio + acoustic metrics. */
  stopTurn: () => Promise<Blob | null>;
  /** Returns the acoustic metrics of the most recently stopped turn. */
  getLastMetrics: () => TurnAcousticMetrics | null;
  /** Returns live Web Speech API transcript captured during the turn (if browser supported it). */
  getLastLiveTranscript: () => string;
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

const blobMetricsMap = new WeakMap<Blob, TurnAcousticMetrics>();
const blobLiveTextMap = new WeakMap<Blob, string>();
const turnIndexMetricsMap = new Map<number, TurnAcousticMetrics>();

export const getBlobAcousticMetrics = (blob: Blob | null): TurnAcousticMetrics | null => {
  if (!blob) return null;
  return blobMetricsMap.get(blob) || null;
};

export const createExamRecorder = (): ExamRecorder => {
  let stream: MediaStream | null = null;
  let pendingStream: Promise<MediaStream | null> | null = null;
  let recorder: MediaRecorder | null = null;
  let lastMetrics: TurnAcousticMetrics | null = null;
  let lastLiveTranscript = '';
  const turnChunks = new WeakMap<MediaRecorder, Blob[]>();

  // Optional parallel Web Speech API recognition for instant live text + zero-latency transcript
  let recognition: any = null;
  let currentTurnFinalText = '';
  let currentTurnInterimText = '';

  // Web Audio API analyzer state (shares the same MediaStream -> 0 extra permission prompts)
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let meterInterval: ReturnType<typeof setInterval> | null = null;

  let turnStartMs = 0;
  let voicedFrames = 0;
  let totalFrames = 0;
  let syllableBursts = 0;
  let pauseCount = 0;
  let rmsSum = 0;
  let peakRms = 0;
  let wasVoiced = false;
  let lastPeakMs = 0;
  let silenceRunFrames = 0;

  const streamIsLive = () => !!stream && stream.getAudioTracks().some((t) => t.readyState === 'live');

  const stopMeter = () => {
    if (meterInterval) {
      clearInterval(meterInterval);
      meterInterval = null;
    }
  };

  const stopBrowserSpeechRec = () => {
    if (recognition) {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch {
        // ignore
      }
      recognition = null;
    }
  };

  const startBrowserSpeechRec = (onLiveSpeech?: (liveText: string) => void) => {
    stopBrowserSpeechRec();
    currentTurnFinalText = '';
    currentTurnInterimText = '';

    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) return;

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            currentTurnFinalText = `${currentTurnFinalText} ${piece}`.trim();
          } else {
            interim += piece;
          }
        }
        currentTurnInterimText = interim.trim();
        const combined = `${currentTurnFinalText} ${currentTurnInterimText}`.trim();
        if (combined) {
          lastLiveTranscript = combined;
          onLiveSpeech?.(combined);
        }
      };

      rec.onerror = () => {
        // Ignore browser STT errors silently; MediaRecorder is still recording the raw audio.
      };

      rec.start();
      recognition = rec;
    } catch {
      // Ignore if WebView does not support SpeechRecognition alongside MediaRecorder
    }
  };

  const startMeter = () => {
    stopMeter();
    turnStartMs = Date.now();
    voicedFrames = 0;
    totalFrames = 0;
    syllableBursts = 0;
    pauseCount = 0;
    rmsSum = 0;
    peakRms = 0;
    wasVoiced = false;
    lastPeakMs = 0;
    silenceRunFrames = 0;

    if (!stream) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      if (!sourceNode) {
        sourceNode = audioCtx.createMediaStreamSource(stream);
      }
      if (!analyser) {
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        sourceNode.connect(analyser);
      }

      const buf = new Float32Array(analyser.fftSize);
      meterInterval = setInterval(() => {
        if (!analyser) return;
        analyser.getFloatTimeDomainData(buf);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i++) {
          sumSq += buf[i] * buf[i];
        }
        const rms = Math.sqrt(sumSq / buf.length);
        totalFrames += 1;
        rmsSum += rms;
        if (rms > peakRms) peakRms = rms;

        // Speech activity threshold (typical mic noise floor is < 0.008)
        const isSpeech = rms >= 0.014;
        const now = Date.now();
        if (isSpeech) {
          voicedFrames += 1;
          if (!wasVoiced && now - lastPeakMs > 155) {
            syllableBursts += 1;
            lastPeakMs = now;
          }
          if (silenceRunFrames >= 12 && voicedFrames > 6) {
            pauseCount += 1;
          }
          silenceRunFrames = 0;
          wasVoiced = true;
        } else {
          silenceRunFrames += 1;
          wasVoiced = false;
        }
      }, 50); // 20 Hz sampling (every 50ms)
    } catch (e) {
      console.warn('Web Audio meter setup skipped:', e);
    }
  };

  const computeTurnMetrics = (blobSize: number): TurnAcousticMetrics => {
    const durationSec = Math.max(0.5, (Date.now() - turnStartMs) / 1000);
    let voicedSec = (voicedFrames * 50) / 1000;

    if (totalFrames === 0 || (voicedSec < 0.4 && blobSize > 6500)) {
      const approxActiveSec = Math.max(0, Math.min(durationSec * 0.72, (blobSize - 2500) / 3800));
      voicedSec = Math.max(voicedSec, approxActiveSec);
      if (syllableBursts === 0 && voicedSec >= 1.2) {
        syllableBursts = Math.round(voicedSec * 3.1);
      }
    }

    const avgRms = totalFrames > 0 ? rmsSum / totalFrames : 0.02;
    const fluencyRatio = durationSec > 0 ? Math.min(1, voicedSec / durationSec) : 0;
    const rawEstWords = Math.round(voicedSec * 1.9 + syllableBursts * 0.42);
    const estimatedWords = voicedSec < 0.65 ? 0 : Math.max(3, rawEstWords);

    return {
      durationSec,
      voicedSec,
      syllableBursts,
      pauseCount,
      avgRms,
      peakRms,
      estimatedWords,
      fluencyRatio,
    };
  };

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

  const startTurn = (onLiveSpeech?: (liveText: string) => void): boolean => {
    if (!streamIsLive() || !stream) return false;
    if (recorder && recorder.state === 'recording') return true;
    lastLiveTranscript = '';
    try {
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32000 } : undefined);
      const chunks: Blob[] = [];
      turnChunks.set(rec, chunks);
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.start(500);
      recorder = rec;
      startMeter();
      startBrowserSpeechRec(onLiveSpeech);
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
    stopMeter();
    stopBrowserSpeechRec();
    const capturedLive = `${currentTurnFinalText} ${currentTurnInterimText}`.trim() || lastLiveTranscript;

    if (!active || active.state === 'inactive') {
      lastMetrics = computeTurnMetrics(0);
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      active.onstop = () => {
        const chunks = turnChunks.get(active) || [];
        const rawBlob = chunks.length ? new Blob(chunks, { type: active.mimeType || 'audio/webm' }) : null;
        const size = rawBlob ? rawBlob.size : 0;
        const metrics = computeTurnMetrics(size);
        lastMetrics = metrics;
        if (rawBlob && size > 1200) {
          blobMetricsMap.set(rawBlob, metrics);
          if (capturedLive) {
            blobLiveTextMap.set(rawBlob, capturedLive);
          }
          resolve(rawBlob);
        } else {
          resolve(null);
        }
      };
      try {
        active.stop();
      } catch {
        lastMetrics = computeTurnMetrics(0);
        resolve(null);
      }
    });
  };

  const release = () => {
    stopMeter();
    stopBrowserSpeechRec();
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {}
    recorder = null;
    try {
      sourceNode?.disconnect();
    } catch {}
    sourceNode = null;
    analyser = null;
    try {
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    } catch {}
    audioCtx = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  return {
    ensureMic,
    startTurn,
    stopTurn,
    getLastMetrics: () => lastMetrics,
    getLastLiveTranscript: () => lastLiveTranscript,
    isRecording: () => !!recorder && recorder.state === 'recording',
    release,
  };
};

/**
 * Sends one recorded answer to the server (/api/transcribe on Vercel, or Render backend fallback)
 * and returns the REAL English transcript spoken by the candidate.
 * NEVER fabricates fake sentences!
 */
export const transcribeAudio = async (blob: Blob, _questionText = '', turnIndex?: number): Promise<string> => {
  const metrics = blobMetricsMap.get(blob);
  if (turnIndex !== undefined && metrics) {
    turnIndexMetricsMap.set(turnIndex, metrics);
  }
  const browserLiveText = (blobLiveTextMap.get(blob) || '').trim();

  // If the recording has no voiced speech at all and no live transcript, don't waste a server call
  if (metrics && metrics.voicedSec < 0.55 && blob.size < 2800 && !browserLiveText) {
    return '';
  }

  const initData = getTelegramInitData();
  const headers: Record<string, string> = {
    'Content-Type': blob.type || 'audio/webm',
    ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
  };

  // 1. Try same-origin /api/transcribe (Vercel Serverless Function)
  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers,
      body: blob,
    });
    if (res.ok) {
      const data = await res.json();
      const serverText = String(data.text || '').trim();
      if (serverText.length > 0) {
        return serverText;
      }
    }
  } catch (err) {
    console.warn('Primary /api/transcribe error:', err);
  }

  // 2. Try Render backend /api/transcribe if different from current origin
  if (API_BASE_URL) {
    try {
      const res2 = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers,
        body: blob,
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const serverText2 = String(data2.text || '').trim();
        if (serverText2.length > 0) {
          return serverText2;
        }
      }
    } catch (err2) {
      console.warn('Secondary backend /api/transcribe error:', err2);
    }
  }

  // 3. If remote STT failed, use the real browser SpeechRecognition transcript if captured
  if (browserLiveText.length > 0) {
    return browserLiveText;
  }

  // Never invent fake words! Return empty string if nothing was transcribed.
  return '';
};

/** Resolves pending transcriptions into the answer history (keeps placeholders only on true silence). */
export const resolvePendingAnswers = async (
  history: { question: string; answer: string; metrics?: TurnAcousticMetrics | null }[],
  pending: Map<number, Promise<string>>,
  timeoutMs = 25000
): Promise<{ history: { question: string; answer: string; metrics?: TurnAcousticMetrics | null }[]; failed: number }> => {
  let failed = 0;
  const withTimeout = (p: Promise<string>) =>
    Promise.race([p, new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))]);

  const filled = await Promise.all(
    history.map(async (item, idx) => {
      const p = pending.get(idx);
      if (!p) {
        const savedMetrics = turnIndexMetricsMap.get(idx) || item.metrics || null;
        return savedMetrics ? { ...item, metrics: savedMetrics } : item;
      }
      try {
        const text = (await withTimeout(p)).trim();
        const savedMetrics = turnIndexMetricsMap.get(idx) || item.metrics || null;
        return {
          ...item,
          answer: text ? text : item.answer,
          ...(savedMetrics ? { metrics: savedMetrics } : {}),
        };
      } catch (err) {
        console.warn('Answer transcription error:', err);
        failed += 1;
        return item;
      }
    })
  );
  pending.clear();
  turnIndexMetricsMap.clear();
  return { history: filled, failed };
};
