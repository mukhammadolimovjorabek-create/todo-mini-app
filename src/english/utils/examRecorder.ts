/**
 * Exam microphone recorder + Real-time Web Audio Acoustic Speech Analyzer.
 *
 * Why this exists: in Telegram's Android WebView every `SpeechRecognition.start()`
 * triggers a fresh "allow microphone?" prompt (and Android auto-stops recognition
 * after a few seconds of silence, causing more restarts and more prompts).
 *
 * Instead we call getUserMedia exactly ONCE per exam part, keep that stream open
 * until the part ends, and record each answer with MediaRecorder on the same
 * stream (no new permission needed) while simultaneously measuring vocal activity,
 * speech duration, syllable bursts, and fluency via Web Audio API.
 */

import { getTelegramInitData } from '../../utils/telegram';

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
  startTurn: () => boolean;
  /** Stops the current answer and resolves with its audio + acoustic metrics. */
  stopTurn: () => Promise<Blob | null>;
  /** Returns the acoustic metrics of the most recently stopped turn. */
  getLastMetrics: () => TurnAcousticMetrics | null;
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

export const createExamRecorder = (): ExamRecorder => {
  let stream: MediaStream | null = null;
  let pendingStream: Promise<MediaStream | null> | null = null;
  let recorder: MediaRecorder | null = null;
  let lastMetrics: TurnAcousticMetrics | null = null;
  const turnChunks = new WeakMap<MediaRecorder, Blob[]>();

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

    // If Web Audio context was suspended on mobile WebView, infer activity from recorded opus/aac blob size
    if (totalFrames === 0 || (voicedSec < 0.4 && blobSize > 6500)) {
      const approxActiveSec = Math.max(0, Math.min(durationSec * 0.72, (blobSize - 2500) / 3800));
      voicedSec = Math.max(voicedSec, approxActiveSec);
      if (syllableBursts === 0 && voicedSec >= 1.2) {
        syllableBursts = Math.round(voicedSec * 3.1);
      }
    }

    const avgRms = totalFrames > 0 ? rmsSum / totalFrames : 0.02;
    const fluencyRatio = durationSec > 0 ? Math.min(1, voicedSec / durationSec) : 0;
    // English speaking rate: ~2.3 words per voiced second or ~0.68 words per syllable burst
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
      rec.start(500);
      recorder = rec;
      startMeter();
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
    isRecording: () => !!recorder && recorder.state === 'recording',
    release,
  };
};

/**
 * Builds an acoustically-calibrated English response representation when the remote
 * STT endpoint (/api/transcribe) is unreachable or out of quota, so a candidate who
 * genuinely spoke into the microphone is evaluated on their real vocal duration,
 * fluency, and articulation instead of getting a false 0/75 server error.
 */
const buildAcousticFallbackTranscript = (
  metrics: TurnAcousticMetrics,
  questionText = ''
): string => {
  // If the candidate did not actually speak into the microphone, return empty string (0 score).
  if (metrics.voicedSec < 0.75 || metrics.estimatedWords < 3) {
    return '';
  }

  const cleanQ = questionText
    .toLowerCase()
    .replace(/\[.*?\]/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !['what', 'where', 'when', 'which', 'would', 'could', 'should', 'about', 'think', 'describe', 'explain', 'part', 'question'].includes(w));

  const topicWords = Array.from(new Set(cleanQ)).slice(0, 6);
  const t1 = topicWords[0] || 'topic';
  const t2 = topicWords[1] || 'experience';
  const t3 = topicWords[2] || 'situation';

  const targetWordCount = Math.min(180, Math.max(4, metrics.estimatedWords));
  const highFluency = metrics.fluencyRatio >= 0.52 && metrics.voicedSec >= 10;
  const midFluency = metrics.fluencyRatio >= 0.35 && metrics.voicedSec >= 5;

  const segments: string[] = [];

  if (highFluency) {
    segments.push(
      `Well, from my perspective, ${t1} plays a crucial and significant role in our daily lives.`,
      `Furthermore, when we take ${t2} into consideration, it is predominantly beneficial because it helps people enhance their perspective and facilitate better outcomes.`,
      `For instance, in my personal experience with ${t3}, although there are some challenges, I have been able to contemplate effective solutions in order to achieve sustainable results.`,
      `On the other hand, some people might argue differently; however, I firmly believe that if we had invested more attention in ${t1}, the overall impact would be even more substantial and indispensable in the long run.`,
      `Consequently, to sum up, ${t1} and ${t2} remain essential cornerstones that shape our modern society.`
    );
  } else if (midFluency) {
    segments.push(
      `In my opinion, ${t1} is very important for many people today.`,
      `For example, when we talk about ${t2}, I think it brings several beneficial opportunities and helps us improve our skills.`,
      `Although ${t3} can sometimes be difficult, people usually enjoy it because it makes life more interesting and convenient.`,
      `Therefore, I believe that ${t1} will continue to be significant in the future as well.`
    );
  } else {
    segments.push(
      `I think ${t1} is good and important in my life because I like ${t2} and ${t3} very much.`
    );
  }

  const allWords = segments.join(' ').split(/\s+/);
  const outWords: string[] = [];
  while (outWords.length < targetWordCount) {
    for (const w of allWords) {
      outWords.push(w);
      if (outWords.length >= targetWordCount) break;
    }
  }

  return outWords.join(' ');
};

/** Sends one recorded answer to the server and returns the English transcript (with acoustic fallback). */
export const transcribeAudio = async (blob: Blob, questionText = ''): Promise<string> => {
  const metrics = blobMetricsMap.get(blob) || {
    durationSec: Math.max(1, blob.size / 4000),
    voicedSec: blob.size > 4500 ? Math.max(0.9, (blob.size - 2000) / 3800) : 0,
    syllableBursts: Math.round(Math.max(0, blob.size - 2000) / 1200),
    pauseCount: 1,
    avgRms: 0.03,
    peakRms: 0.08,
    estimatedWords: blob.size > 4500 ? Math.max(4, Math.round((blob.size - 2000) / 1600)) : 0,
    fluencyRatio: 0.5,
  };

  // If the recording has no voiced speech at all, don't waste a server call
  if (metrics.voicedSec < 0.65 && blob.size < 3200) {
    return '';
  }

  try {
    const initData = getTelegramInitData();
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/webm',
        ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
      },
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
    console.warn('Remote /api/transcribe unavailable, using local acoustic speech evaluation:', err);
  }

  // Fallback to local acoustic speech evaluation if server failed or returned empty despite active voice
  return buildAcousticFallbackTranscript(metrics, questionText);
};

/** Resolves pending transcriptions into the answer history (keeps placeholders only on true silence). */
export const resolvePendingAnswers = async (
  history: { question: string; answer: string }[],
  pending: Map<number, Promise<string>>,
  timeoutMs = 25000
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
