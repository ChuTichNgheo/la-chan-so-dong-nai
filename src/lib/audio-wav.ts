/**
 * Lightweight browser audio normalization helper for Gemini Audio transcription.
 * Converts any MediaRecorder blob (MP4 on Safari, WebM/OGG on Android/Desktop)
 * into 16kHz mono PCM WAV, which is universally supported by Gemini models.
 */

export function pickSupportedAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob'));
    reader.readAsDataURL(blob);
  });
}

function encodeWavFromFloat32(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export async function normalizeAudioForGemini(
  blob: Blob,
  fallbackMime: string
): Promise<{ blob: Blob; mimeType: string }> {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return { blob, mimeType: fallbackMime };
    const ctx = new AudioCtx();
    try {
      const arrayBuf = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
      const targetRate = 16000;
      const ratio = decoded.sampleRate / targetRate;
      const src = decoded.getChannelData(0);
      const outLen = Math.max(1, Math.floor(src.length / ratio));
      const downsampled = new Float32Array(outLen);
      for (let i = 0; i < outLen; i += 1) {
        downsampled[i] = src[Math.min(src.length - 1, Math.floor(i * ratio))];
      }
      return { blob: encodeWavFromFloat32(downsampled, targetRate), mimeType: 'audio/wav' };
    } finally {
      void ctx.close();
    }
  } catch {
    return { blob, mimeType: fallbackMime };
  }
}
