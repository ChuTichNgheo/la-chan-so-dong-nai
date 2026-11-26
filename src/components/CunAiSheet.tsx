'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from 'lucide-react';
import type { CunAgentAction, CunChatResponse, CunHistoryItem } from '@/app/api/cun-chat/route';
import { blobToBase64, normalizeAudioForGemini, pickSupportedAudioMime } from '@/lib/audio-wav';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';
import type { ScreenId, UiMode } from '@/types';
import { CunAiSvg } from './CunAiMascot';

export type CunFlowId = 'police-family' | 'report-prefill' | 'senior-video' | 'radar-zalo';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
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

interface CunAiSheetProps {
  open: boolean;
  offlineMode: boolean;
  uiMode: UiMode;
  activeScreen: ScreenId;
  onClose: () => void;
  onRunFlow: (flow: CunFlowId) => void;
  onExecuteAction: (action: CunAgentAction) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: CunAgentAction;
  executed?: boolean;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Chào bác! Cún INFINITY có thể trò chuyện giải đáp thắc mắc VÀ tự thao tác dùm trong ứng dụng (bật chữ to, quét tin nhắn, mở camera QR, điền sẵn phiếu báo cáo...). Bác cứ nhắn hoặc bấm Micro nói với Cún nhé!',
};

const QUICK_PROMPTS = [
  'Bật chữ to giúp bác',
  'Quét giúp: Công an gọi đòi chuyển 50 triệu',
  'Mở camera quét mã QR',
  'Giúp bác báo cáo số lừa đảo',
];

const FLOWS: Array<{ id: CunFlowId; label: string; desc: string; highlight?: boolean }> = [
  {
    id: 'police-family',
    label: '1. "Công an gọi đòi 50 triệu — Quét & dẫn hỏi người thân"',
    desc: 'Tự quét → Đọc cảnh báo → Dừng trước nút Gửi người thân',
    highlight: true,
  },
  {
    id: 'report-prefill',
    label: '2. "Dẫn sang lập Phiếu báo cáo Công an"',
    desc: 'Mở form báo cáo & kênh Công an / NCSC / Tổng đài 111',
  },
  {
    id: 'senior-video',
    label: '3. "Bật Chữ lớn & mở Video cảnh báo"',
    desc: 'Tăng cỡ chữ người cao tuổi và mở video hướng dẫn',
  },
  {
    id: 'radar-zalo',
    label: '4. "Mở Radar Đồng Nai & xem thẻ Zalo khu phố"',
    desc: 'Xem báo cáo thực tế & xuất ảnh thẻ cảnh báo khu phố',
  },
];

function isIOSOrInAppWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Zalo|FBAN|FBAV|Line|MicroMessenger/i.test(navigator.userAgent || '');
}

export function CunAiSheet({
  open,
  offlineMode,
  uiMode,
  activeScreen,
  onClose,
  onRunFlow,
  onExecuteAction,
}: CunAiSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [autoAct, setAutoAct] = useState(true);
  const [voiceSpeak, setVoiceSpeak] = useState(true);
  const [showFlows, setShowFlows] = useState(false);
  const [inputError, setInputError] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (open) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, asking]);

  const stopVoiceCapture = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
    recognitionRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      stopVoiceCapture();
      stopVietnameseSpeech();
    };
  }, [stopVoiceCapture]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const q = rawText.trim();
      if (!q) {
        setInputError('Bác hãy nhập hoặc bấm Micro nói với Cún nhé.');
        return;
      }
      if (asking) return;

      setInputError('');
      setQuestion('');
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: q,
      };
      const historyPayload: CunHistoryItem[] = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((prev) => [...prev, userMsg]);
      setAsking(true);

      try {
        const res = await fetch('/api/cun-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: q,
            history: historyPayload,
            uiMode,
            activeScreen,
            offline: offlineMode,
          }),
        });
        if (!res.ok) {
          setInputError('Cún chưa kết nối được máy chủ, bác thử lại nhé.');
          return;
        }
        const data = (await res.json()) as CunChatResponse;
        const action = data.action?.type && data.action.type !== 'none' ? data.action : undefined;
        const shouldAutoRun = Boolean(autoAct && action?.autoExecute);

        const botMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          action,
          executed: shouldAutoRun,
        };
        setMessages((prev) => [...prev, botMsg]);

        if (voiceSpeak && data.reply) {
          void speakAlertVietnamese(data.reply, 'intro');
        }

        if (shouldAutoRun && action) {
          const delay = action.type === 'set_ui_mode' ? 150 : 650;
          setTimeout(() => {
            onExecuteAction(action);
          }, delay);
        }
      } catch {
        setInputError('Không thể gửi câu hỏi lúc này, bác thử lại nhé.');
      } finally {
        setAsking(false);
      }
    },
    [activeScreen, asking, autoAct, messages, offlineMode, onExecuteAction, uiMode, voiceSpeak]
  );

  const startFallbackRecorder = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setInputError('Trình duyệt này chưa hỗ trợ Micro — bác nhập chữ giúp Cún nhé.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = pickSupportedAudioMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
      };

      recorder.onstop = async () => {
        const chunks = chunksRef.current;
        chunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);

        if (chunks.length === 0) return;
        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: actualMime });
        if (blob.size < 400) {
          setInputError('Đoạn nói quá ngắn — bác bấm Micro nói rõ 2–4 giây rồi bấm dừng nhé.');
          return;
        }
        setTranscribing(true);
        try {
          const normalized = await normalizeAudioForGemini(
            blob,
            actualMime.split(';')[0] || 'audio/webm'
          );
          const base64 = await blobToBase64(normalized.blob);
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType: normalized.mimeType }),
          });
          const data = (await res.json()) as { transcript?: string; error?: string };
          if (res.ok && data.transcript) {
            void sendMessage(data.transcript);
          } else {
            setInputError(data.error || 'Chưa nghe rõ lời bác nói — thử nói gần Micro hơn nhé.');
          }
        } catch {
          setInputError('Không xử lý được âm thanh lúc này.');
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start(250);
      setRecording(true);
      setInputError('');
    } catch {
      setInputError('Chưa cấp quyền Micro cho trình duyệt. Bác bật quyền Micro rồi thử lại nhé.');
    }
  }, [sendMessage]);

  const handleToggleVoice = useCallback(() => {
    if (recording) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        return;
      }
      stopVoiceCapture();
      return;
    }

    if (typeof window === 'undefined') return;
    stopVietnameseSpeech();
    setInputError('');

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!Recognition || isIOSOrInAppWebView()) {
      void startFallbackRecorder();
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;

      let captured = '';
      recognition.onresult = (event) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i += 1) {
          combined += `${event.results[i]?.[0]?.transcript ?? ''} `;
        }
        captured = combined.trim();
        if (captured) setQuestion(captured);
      };
      recognition.onerror = (evt) => {
        recognitionRef.current = null;
        setRecording(false);
        if (evt.error === 'not-allowed') {
          setInputError('Bạn chưa cấp quyền Micro cho trình duyệt.');
          return;
        }
        void startFallbackRecorder();
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setRecording(false);
        if (captured.trim()) {
          void sendMessage(captured.trim());
        }
      };

      recognition.start();
      setRecording(true);
    } catch {
      void startFallbackRecorder();
    }
  }, [recording, sendMessage, startFallbackRecorder, stopVoiceCapture]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(question);
  }

  function handleManualRunAction(msgId: string, action: CunAgentAction) {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, executed: true } : m)));
    onExecuteAction(action);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/55 p-2 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopVoiceCapture();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trợ lý Cún INFINITY AI"
        className="flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#0D685E] to-[#118477] px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <CunAiSvg size={40} mood={recording || asking ? 'listening' : 'idle'} />
            <div>
              <h2 className="font-[family-name:var(--font-lexend)] text-sm font-extrabold leading-tight">
                Trò chuyện &amp; Nhờ Cún AI làm dùm
              </h2>
              <p className="text-[11px] text-emerald-100">
                Hỏi tự nhiên hoặc ra lệnh • Luôn an toàn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const next = !voiceSpeak;
                setVoiceSpeak(next);
                if (!next) stopVietnameseSpeech();
              }}
              aria-label={voiceSpeak ? 'Tắt đọc giọng nói' : 'Bật đọc giọng nói'}
              title={voiceSpeak ? 'Đang bật đọc giọng Việt' : 'Đang tắt tiếng'}
              className="rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
            >
              {voiceSpeak ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                stopVietnameseSpeech();
                setMessages([INITIAL_MESSAGE]);
                setInputError('');
              }}
              aria-label="Cuộc trò chuyện mới"
              title="Làm mới hội thoại"
              className="rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                stopVoiceCapture();
                onClose();
              }}
              aria-label="Đóng trợ lý"
              className="shrink-0 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Auto-Act Toggle Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-emerald-100 bg-[#F4FBF8] px-3.5 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D685E]">
            <Wand2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Cún tự thao tác dùm (an toàn)</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoAct}
            onClick={() => setAutoAct((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold transition ${
              autoAct
                ? 'bg-[#0D685E] text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {autoAct ? 'Đang BẬT' : 'Chỉ gợi ý'}
          </button>
        </div>

        {/* Chat Messages Scroll Area */}
        <div className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    isUser
                      ? 'rounded-br-sm bg-[#0D685E] font-medium text-white'
                      : 'rounded-bl-sm bg-[#E9FAF5] font-medium text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    {!isUser && (
                      <Sparkles
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D685E]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="whitespace-pre-line">{msg.text}</span>
                  </div>

                  {!isUser && msg.id !== 'welcome' && (
                    <div className="mt-1.5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => void speakAlertVietnamese(msg.text, 'intro')}
                        className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#0D685E] hover:bg-white"
                      >
                        <Volume2 className="h-3 w-3" aria-hidden="true" />
                        Nghe Cún đọc
                      </button>
                    </div>
                  )}

                  {!isUser && msg.action && msg.action.type !== 'none' && (
                    <div className="mt-2 border-t border-emerald-200/70 pt-2">
                      {msg.executed ? (
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0D685E]">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            Cún đã thao tác: {msg.action.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleManualRunAction(msg.id, msg.action!)}
                            className="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold text-[#0D685E] shadow-xs hover:bg-emerald-50"
                          >
                            Mở lại
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleManualRunAction(msg.id, msg.action!)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F59E0B] px-3 py-2 text-[11px] font-extrabold text-[#0F172A] shadow-xs transition hover:brightness-95"
                        >
                          <Wand2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>Cho Cún làm ngay: {msg.action.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {asking && (
            <div className="flex items-start">
              <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm bg-[#E9FAF5] px-3 py-2 text-xs font-semibold text-[#0D685E]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Cún đang suy nghĩ &amp; chuẩn bị thao tác...
              </div>
            </div>
          )}

          {/* Quick Command Chips when fresh */}
          {messages.length <= 2 && !asking && (
            <div className="pt-1">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                Thử nói hoặc bấm nhanh để Cún làm dùm:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void sendMessage(chip)}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-[#0D685E] transition hover:bg-[#E9FAF5]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={listEndRef} />
        </div>

        {/* Collapsible 4 Stage Demo Flows */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-1.5">
          <button
            type="button"
            onClick={() => setShowFlows((prev) => !prev)}
            className="flex w-full items-center justify-between text-[11px] font-extrabold text-[#475569]"
          >
            <span>4 Kịch bản Cún dẫn tay mẫu</span>
            {showFlows ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
          {showFlows && (
            <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pb-1">
              {FLOWS.map((flow) => (
                <button
                  key={flow.id}
                  type="button"
                  onClick={() => {
                    stopVoiceCapture();
                    onClose();
                    onRunFlow(flow.id);
                  }}
                  data-screen="Shell"
                  data-ui={`btn-cun-flow-${flow.id}`}
                  className={`w-full rounded-xl p-2 text-left transition ${
                    flow.highlight
                      ? 'bg-[#F59E0B] text-[#0F172A]'
                      : 'bg-white text-[#0F172A] hover:bg-[#E9FAF5]'
                  }`}
                >
                  <div className="text-[11px] font-extrabold">{flow.label}</div>
                  <div className="text-[10px] opacity-80">{flow.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input & Voice Bar */}
        <div className="border-t border-emerald-100 bg-white p-3">
          {inputError && (
            <p className="mb-1.5 px-1 text-[11px] font-bold text-[#B91C1C]">{inputError}</p>
          )}
          {recording && (
            <p className="mb-1.5 px-1 text-[11px] font-bold text-[#B91C1C]">
              Đang nghe bác nói... Nói xong bấm lại nút Micro ĐỎ để gửi Cún nhé!
            </p>
          )}
          {transcribing && (
            <p className="mb-1.5 px-1 text-[11px] font-bold text-[#0D685E]">
              Gemini AI đang chép lời bác nói...
            </p>
          )}
          <form
            onSubmit={handleFormSubmit}
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-[#F4FBF8] p-1.5"
          >
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={asking || transcribing}
              aria-label={recording ? 'Dừng nói' : 'Nói chuyện với Cún'}
              title="Bấm để nói tiếng Việt với Cún"
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                recording
                  ? 'animate-pulse bg-[#DC2626] text-white'
                  : 'bg-white text-[#0D685E] shadow-xs hover:bg-emerald-50'
              }`}
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : recording ? (
                <MicOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <input
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder="Nhắn hoặc nói: Bật chữ to, quét tin nhắn..."
              data-screen="Shell"
              data-ui="input-cun-chat"
              className="min-w-0 flex-1 bg-transparent px-1.5 text-xs font-medium text-[#0F172A] outline-none placeholder:text-[#64748B]"
            />
            <button
              type="submit"
              disabled={asking || transcribing}
              data-screen="Shell"
              data-ui="btn-cun-chat-send"
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#0D685E] px-3 text-xs font-bold text-white disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Gửi
            </button>
          </form>

          <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#475569]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#0D685E]" aria-hidden="true" />
            <span>
              {uiMode === 'pro'
                ? 'Agentic Tool-Calling • Human-in-the-Loop • Gemini 3.5 Hybrid'
                : 'Cún chuẩn bị sẵn — Bạn luôn bấm xác nhận cuối cùng khi gửi tin/báo cáo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
