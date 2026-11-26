'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface LiveVoiceGuardModalProps {
  open: boolean;
  trustedName: string;
  onClose: () => void;
  onAnalyzeText: (text: string) => void;
  onAskFamily: (capturedText: string) => void;
}

const LIVE_DANGER_TRIGGERS = [
  'công an',
  'viện kiểm sát',
  'khởi tố',
  'lệnh bắt',
  'chuyển tiền',
  'xác minh tài khoản',
  'tạm giữ',
  'mã otp',
  'otp',
  'nạp trước',
  'việc nhẹ',
  'mở nhiệm vụ',
  'khóa sim',
  'cắt điện',
  'cài ứng dụng',
  'đừng nói ai',
  'giữ bí mật',
  'chụp căn cước',
  '50 triệu',
];

const DEMO_CALL_SCRIPTS = [
  {
    id: 'police',
    label: 'Thử cuộc gọi giả Công an',
    text: 'Alo tôi là cán bộ Công an Biên Hòa gọi thông báo tài khoản của bác liên quan vụ án rửa tiền. Bác giữ bí mật đừng nói ai và chuyển tiền 50 triệu xác minh ngay hôm nay nếu không sẽ có lệnh bắt.',
  },
  {
    id: 'job',
    label: 'Thử cuộc gọi bẫy Việc nhẹ',
    text: 'Chào bạn bên mình tuyển cộng tác viên việc nhẹ lương cao tại nhà, bạn bấm đường link này rồi nạp trước 200 nghìn mở nhiệm vụ và đọc mã OTP để nhận hoa hồng nhé.',
  },
] as const;

function detectTriggers(text: string): string[] {
  const lower = text.toLowerCase();
  return LIVE_DANGER_TRIGGERS.filter((kw) => lower.includes(kw));
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}

function isIOSOrInAppWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Zalo|FBAN|FBAV|Line|MicroMessenger/i.test(navigator.userAgent || '');
}

function pickSupportedAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
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

async function normalizeAudioForGemini(blob: Blob, fallbackMime: string): Promise<{ blob: Blob; mimeType: string }> {
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

function blobToBase64(blob: Blob): Promise<string> {
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

export function LiveVoiceGuardModal({
  open,
  trustedName,
  onClose,
  onAnalyzeText,
  onAskFamily,
}: LiveVoiceGuardModalProps) {
  const [listening, setListening] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'speech' | 'recorder' | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hits, setHits] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState(
    'Bấm nút Micro để nói hoặc bật loa ngoài cuộc gọi lạ cho Cún nghe.'
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const keepSpeechAliveRef = useRef(false);
  const committedSpeechRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedRef = useRef(false);

  const shortContact = trustedName.split('(')[0].trim() || 'Người thân';

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    keepSpeechAliveRef.current = false;
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setSimulating(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors
    }
    recognitionRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    mediaRecorderRef.current = null;
    stopMediaStream();
    setListening(false);
    setRecordingMode(null);
  }, [stopMediaStream]);

  const triggerEmergencyAlert = useCallback((foundHits: string[]) => {
    if (alertedRef.current || foundHits.length === 0) return;
    alertedRef.current = true;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([220, 100, 220]);
    }
    void speakAlertVietnamese(
      'Cảnh báo khẩn cấp! Cún phát hiện dấu hiệu lừa đảo trong cuộc gọi này. Hãy tắt máy ngay, tuyệt đối không chuyển tiền và bấm Hỏi người thân!',
      'danger'
    );
  }, []);

  const evaluateText = useCallback(
    (fullText: string) => {
      setTranscript(fullText);
      const found = detectTriggers(fullText);
      setHits(found);
      if (found.length > 0) {
        triggerEmergencyAlert(found);
      }
    },
    [triggerEmergencyAlert]
  );

  const startUniversalAudioRecorder = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatusNote(
        'Trình duyệt trong app (Zalo/Messenger) đang khóa Micro. Hãy mở bằng Chrome/Safari hoặc dùng 2 nút Thử mẫu bên dưới!'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = pickSupportedAudioMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) {
          audioChunksRef.current.push(evt.data);
        }
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        stopMediaStream();
        setListening(false);
        setRecordingMode(null);

        if (chunks.length === 0) return;
        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: actualMime });
        if (blob.size < 400) {
          setStatusNote('Đoạn ghi âm quá ngắn — hãy bấm Micro, nói rõ trong 2–5 giây rồi bấm Dừng nhé.');
          return;
        }

        setTranscribing(true);
        setStatusNote('Gemini AI đang chép lời tiếng Việt và kiểm tra từ khóa lừa đảo...');
        try {
          const cleanFallbackMime = actualMime.split(';')[0] || 'audio/webm';
          const normalized = await normalizeAudioForGemini(blob, cleanFallbackMime);
          const base64 = await blobToBase64(normalized.blob);
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType: normalized.mimeType }),
          });
          const data = (await res.json()) as { transcript?: string; error?: string };
          if (!res.ok || !data.transcript) {
            setStatusNote(
              data.error || 'Chưa nghe rõ lời nói — hãy nói gần Micro hơn hoặc thử 2 nút mẫu bên dưới.'
            );
            return;
          }
          evaluateText(data.transcript);
          setStatusNote('Đã nghe xong! Bạn có thể bấm Phân tích sâu AI hoặc Hỏi người thân ngay.');
        } catch {
          setStatusNote('Không gửi được đoạn ghi âm lúc này — hãy thử lại hoặc dùng nút mẫu.');
        } finally {
          setTranscribing(false);
        }
      };

      // Pass 250ms timeslice so mobile browsers reliably flush audio chunks on stop
      recorder.start(250);
      setListening(true);
      setRecordingMode('recorder');
      setStatusNote('Đang ghi âm... Nói xong hãy bấm lại nút ĐỎ để Cún chép lời & phân tích ngay!');
    } catch {
      stopMediaStream();
      setListening(false);
      setRecordingMode(null);
      setStatusNote(
        'Điện thoại chưa cấp quyền Micro (hoặc bạn đang mở trong Zalo). Hãy cấp quyền Micro trong Chrome/Safari hoặc bấm 2 nút Thử mẫu!'
      );
    }
  }, [evaluateText, stopMediaStream]);

  const startNativeSpeechSession = useCallback(
    (Recognition: SpeechRecognitionCtor) => {
      const mobile = isMobileDevice();
      const launch = () => {
        const recognition = new Recognition();
        recognition.lang = 'vi-VN';
        // On Android Chrome, continuous=false + clean restart loop is far more reliable than continuous=true
        recognition.continuous = !mobile;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        let sessionFinal = '';
        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const piece = event.results[i]?.[0]?.transcript ?? '';
            if (event.results[i]?.isFinal) {
              sessionFinal = `${sessionFinal} ${piece}`.trim();
            } else {
              interim = `${interim} ${piece}`.trim();
            }
          }
          const combined = `${committedSpeechRef.current} ${sessionFinal} ${interim}`.trim();
          if (combined) evaluateText(combined);
        };

        recognition.onerror = (evt) => {
          recognitionRef.current = null;
          if (evt.error === 'no-speech' && keepSpeechAliveRef.current) {
            return;
          }
          keepSpeechAliveRef.current = false;
          setListening(false);
          setRecordingMode(null);
          if (evt.error === 'not-allowed') {
            setStatusNote('Bạn chưa cấp quyền Micro cho trình duyệt. Hãy bấm Cho phép Micro rồi thử lại nhé.');
            return;
          }
          // Fallback to MediaRecorder + Gemini Audio if browser speech service fails
          void startUniversalAudioRecorder();
        };

        recognition.onend = () => {
          if (sessionFinal) {
            committedSpeechRef.current = `${committedSpeechRef.current} ${sessionFinal}`.trim();
          }
          recognitionRef.current = null;
          if (keepSpeechAliveRef.current) {
            try {
              launch();
              return;
            } catch {
              // Fall through to stop
            }
          }
          setListening(false);
          setRecordingMode(null);
        };

        recognition.start();
      };

      launch();
    },
    [evaluateText, startUniversalAudioRecorder]
  );

  const handleToggleMic = useCallback(() => {
    if (listening) {
      if (recordingMode === 'recorder' && mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        return;
      }
      stopAll();
      setStatusNote('Đã dừng lắng nghe.');
      return;
    }

    if (typeof window === 'undefined') return;
    stopAll();
    stopVietnameseSpeech();
    alertedRef.current = false;
    committedSpeechRef.current = '';
    setTranscript('');
    setHits([]);

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    // Prefer native real-time SpeechRecognition on Desktop & Android Chrome;
    // use MediaRecorder + Gemini Audio on iPhone Safari / Zalo WebView / unsupported browsers.
    if (!Recognition || isIOSOrInAppWebView()) {
      void startUniversalAudioRecorder();
      return;
    }

    try {
      keepSpeechAliveRef.current = true;
      startNativeSpeechSession(Recognition);
      setListening(true);
      setRecordingMode('speech');
      setStatusNote('Đang lắng nghe tiếng Việt trực tiếp... Cún sẽ báo động ngay khi có từ khóa lừa đảo!');
    } catch {
      keepSpeechAliveRef.current = false;
      void startUniversalAudioRecorder();
    }
  }, [listening, recordingMode, startNativeSpeechSession, startUniversalAudioRecorder, stopAll]);

  function startDemoStream(scriptText: string) {
    stopAll();
    stopVietnameseSpeech();
    alertedRef.current = false;
    setTranscript('');
    setHits([]);
    setSimulating(true);
    setStatusNote('Đang giả lập luồng âm thanh cuộc gọi đến theo thời gian thực...');

    const words = scriptText.split(' ');
    let idx = 0;
    simTimerRef.current = setInterval(() => {
      idx += 2;
      const partial = words.slice(0, idx).join(' ');
      evaluateText(partial);
      if (idx >= words.length) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        setSimulating(false);
        setStatusNote('Đã hoàn tất lắng nghe — bạn có thể bấm Phân tích sâu AI hoặc Hỏi người thân ngay.');
      }
    }, 240);
  }

  useEffect(() => {
    return () => {
      keepSpeechAliveRef.current = false;
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      try {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignore
      }
      stopMediaStream();
      stopVietnameseSpeech();
    };
  }, [stopMediaStream]);

  if (!open) return null;

  const isDanger = hits.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-xs sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Lá chắn Nghe Trực Tiếp"
    >
      <div
        className={`w-full max-w-[430px] overflow-hidden rounded-[28px] border-2 bg-white shadow-2xl transition-colors ${
          isDanger ? 'border-[#DC2626]' : 'border-[#0D685E]'
        }`}
      >
        <div
          className={`flex items-center justify-between gap-2.5 px-4 py-3.5 text-white transition-colors ${
            isDanger
              ? 'bg-gradient-to-r from-[#991B1B] to-[#DC2626]'
              : 'bg-gradient-to-r from-[#07463F] to-[#0D685E]'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/15">
              {isDanger ? (
                <ShieldAlert className="h-5 w-5 animate-bounce" aria-hidden="true" />
              ) : (
                <Radio className={`h-5 w-5 ${listening || simulating ? 'animate-pulse' : ''}`} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate font-[family-name:var(--font-lexend)] text-sm font-extrabold">
                {isDanger ? 'BÁO ĐỘNG: PHÁT HIỆN LỪA ĐẢO!' : 'Lá Chắn Nghe Trực Tiếp'}
              </div>
              <div className="text-[11px] leading-snug text-white/85">
                {isDanger
                  ? 'Cúp máy ngay • Không chuyển tiền • Không đọc OTP'
                  : 'Hỗ trợ Micro iPhone, Android & Máy tính'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopAll();
              stopVietnameseSpeech();
              onClose();
            }}
            aria-label="Đóng lá chắn nghe trực tiếp"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3.5 p-4">
          <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-[#F4FBF8] p-4 text-center">
            <button
              type="button"
              disabled={transcribing}
              onClick={handleToggleMic}
              data-ui="btn-live-mic-toggle"
              className={`relative grid h-20 w-20 place-items-center rounded-full text-white shadow-lg transition active:scale-95 ${
                listening
                  ? 'bg-[#DC2626] ring-8 ring-[#DC2626]/25'
                  : isDanger
                  ? 'bg-[#B91C1C]'
                  : 'bg-[#0D685E] hover:bg-[#09524A]'
              }`}
            >
              {transcribing ? (
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              ) : listening ? (
                <MicOff className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Mic className="h-8 w-8" aria-hidden="true" />
              )}
            </button>

            {(listening || simulating) && (
              <div className="flex h-6 items-center gap-1" aria-hidden="true">
                <span className={`h-5 w-1.5 rounded-full animate-wave-1 ${isDanger ? 'bg-[#DC2626]' : 'bg-[#14B8A6]'}`} />
                <span className={`h-6 w-1.5 rounded-full animate-wave-2 ${isDanger ? 'bg-[#DC2626]' : 'bg-[#0D685E]'}`} />
                <span className={`h-4 w-1.5 rounded-full animate-wave-3 ${isDanger ? 'bg-[#DC2626]' : 'bg-[#14B8A6]'}`} />
                <span className={`h-6 w-1.5 rounded-full animate-wave-1 ${isDanger ? 'bg-[#DC2626]' : 'bg-[#0D685E]'}`} />
                <span className={`h-5 w-1.5 rounded-full animate-wave-2 ${isDanger ? 'bg-[#DC2626]' : 'bg-[#14B8A6]'}`} />
              </div>
            )}

            <p className="text-xs font-semibold text-[#475569]">{statusNote}</p>
          </div>

          <div
            className={`min-h-[82px] rounded-2xl border p-3 text-xs leading-relaxed ${
              isDanger
                ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#7F1D1D]'
                : 'border-[#CBE4DC] bg-white text-[#0F172A]'
            }`}
          >
            <div className="mb-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wide text-[#64748B]">
              <span>Nội dung Cún đang nghe</span>
              {hits.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-white">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  {hits.length} từ khóa đỏ
                </span>
              )}
            </div>
            {transcript ? (
              <p className="font-medium break-words">{transcript}</p>
            ) : (
              <p className="italic text-[#94A3B8]">
                Chưa có âm thanh... Bấm nút Micro phía trên để nói hoặc bật loa ngoài cuộc gọi lạ.
              </p>
            )}
            {hits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {hits.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-md bg-[#DC2626] px-2 py-0.5 text-[10px] font-extrabold text-white"
                  >
                    ⚠ {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DEMO_CALL_SCRIPTS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => startDemoStream(demo.text)}
                data-ui={`btn-demo-voice-${demo.id}`}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#CBE4DC] bg-[#E9FAF5] px-2.5 py-2 text-[11px] font-bold text-[#0D685E] hover:bg-[#D5F5EB]"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{demo.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                stopAll();
                onAskFamily(
                  transcript ||
                    'Cuộc gọi lạ có dấu hiệu dọa nạt yêu cầu chuyển tiền, nhờ người thân xác minh gấp.'
                );
              }}
              data-ui="btn-live-ask-family"
              className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl bg-[#F59E0B] px-3 text-xs font-extrabold text-[#0F172A] shadow-sm"
            >
              <PhoneCall className="h-4 w-4 shrink-0" aria-hidden="true" />
              Hỏi {shortContact}
            </button>
            <button
              type="button"
              disabled={!transcript.trim()}
              onClick={() => {
                stopAll();
                stopVietnameseSpeech();
                onAnalyzeText(transcript.trim());
              }}
              data-ui="btn-live-deep-scan"
              className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] px-3 text-xs font-extrabold text-white shadow-sm disabled:opacity-45"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              Phân tích sâu AI
            </button>
          </div>

          {isDanger && (
            <button
              type="button"
              onClick={() =>
                void speakAlertVietnamese(
                  'Cảnh báo khẩn cấp! Công an và ngân hàng không bao giờ yêu cầu chuyển tiền xác minh qua điện thoại. Hãy tắt máy ngay!',
                  'danger'
                )
              }
              className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#FEF2F2] text-xs font-extrabold text-[#991B1B]"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              Đọc lại cảnh báo khẩn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
