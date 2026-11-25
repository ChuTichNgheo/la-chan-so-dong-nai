'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
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

export function LiveVoiceGuardModal({
  open,
  trustedName,
  onClose,
  onAnalyzeText,
  onAskFamily,
}: LiveVoiceGuardModalProps) {
  const [listening, setListening] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hits, setHits] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState('Bấm Micro để nói hoặc bật loa ngoài cuộc gọi lạ cho Cún nghe.');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedRef = useRef(false);

  const shortContact = trustedName.split('(')[0].trim() || 'Người thân';

  const stopAll = useCallback(() => {
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
    setListening(false);
  }, []);

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

  const startLiveMic = useCallback(() => {
    if (typeof window === 'undefined') return;
    stopAll();
    stopVietnameseSpeech();
    alertedRef.current = false;
    setTranscript('');
    setHits([]);

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!Recognition) {
      setStatusNote(
        'Trình duyệt này chưa hỗ trợ Micro trực tiếp — bạn hãy bấm 1 nút "Thử cuộc gọi mẫu" bên dưới để xem Cún bắt bài Live!'
      );
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      let committedText = '';
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const piece = event.results[i]?.[0]?.transcript ?? '';
          if (event.results[i]?.isFinal) {
            committedText = `${committedText} ${piece}`.trim();
          } else {
            interim = `${interim} ${piece}`.trim();
          }
        }
        const combined = `${committedText} ${interim}`.trim();
        evaluateText(combined);
      };

      recognition.onerror = (evt) => {
        setListening(false);
        recognitionRef.current = null;
        if (evt.error === 'not-allowed') {
          setStatusNote('Bạn chưa cấp quyền Micro cho trình duyệt. Hãy bật quyền hoặc dùng nút Thử mẫu bên dưới.');
        } else {
          setStatusNote('Micro tạm dừng. Bấm lại Micro để nghe tiếp hoặc chọn Thử cuộc gọi mẫu.');
        }
      };

      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognition.start();
      setListening(true);
      setStatusNote('Đang lắng nghe tiếng Việt trực tiếp... Cún sẽ báo động ngay khi có từ khóa lừa đảo!');
    } catch {
      setListening(false);
      setStatusNote('Không thể khởi động Micro. Hãy thử lại hoặc dùng nút Thử cuộc gọi mẫu.');
    }
  }, [evaluateText, stopAll]);

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
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
      stopVietnameseSpeech();
    };
  }, []);

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
        {/* Top Banner */}
        <div
          className={`flex items-center justify-between gap-2 px-4 py-3.5 text-white transition-colors ${
            isDanger
              ? 'bg-gradient-to-r from-[#991B1B] to-[#DC2626]'
              : 'bg-gradient-to-r from-[#07463F] to-[#0D685E]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/15">
              {isDanger ? (
                <ShieldAlert className="h-5 w-5 animate-bounce" aria-hidden="true" />
              ) : (
                <Radio className={`h-5 w-5 ${listening || simulating ? 'animate-pulse' : ''}`} aria-hidden="true" />
              )}
            </span>
            <div>
              <div className="font-[family-name:var(--font-lexend)] text-sm font-extrabold">
                {isDanger ? 'BÁO ĐỘNG: PHÁT HIỆN LỪA ĐẢO!' : 'Lá Chắn Nghe Trực Tiếp'}
              </div>
              <div className="text-[11px] text-white/85">
                {isDanger
                  ? 'Cúp máy ngay • Không chuyển tiền • Không đọc OTP'
                  : 'Bật loa ngoài cuộc gọi lạ hoặc kể lại cho Cún nghe'}
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
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3.5 p-4">
          {/* Mic Trigger + Live Audio Waves */}
          <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-[#F4FBF8] p-4 text-center">
            <button
              type="button"
              onClick={() => (listening ? stopAll() : startLiveMic())}
              data-ui="btn-live-mic-toggle"
              className={`relative grid h-20 w-20 place-items-center rounded-full text-white shadow-lg transition active:scale-95 ${
                listening
                  ? 'bg-[#DC2626] ring-8 ring-[#DC2626]/25'
                  : isDanger
                  ? 'bg-[#B91C1C]'
                  : 'bg-[#0D685E] hover:bg-[#09524A]'
              }`}
            >
              {listening ? (
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

          {/* Live Transcript Box */}
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
                Chưa có âm thanh... Hãy bấm Micro phía trên và nói thử (VD: &ldquo;Alo công an yêu cầu chuyển tiền xác minh&rdquo;).
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

          {/* Quick Demo Buttons for Stage / Noisy Hall Fallback */}
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

          {/* Emergency / Next Actions */}
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
