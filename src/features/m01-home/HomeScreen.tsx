'use client';

import { useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  ClipboardPaste,
  Flag,
  Mic,
  MicOff,
  PhoneCall,
  X,
} from 'lucide-react';
import { CunAiSvg } from '@/components/CunAiMascot';
import { compressImageToBase64 } from '@/lib/image-compress';
import type { ScreenId } from '@/types';
import { ElderlyMode } from './ElderlyMode';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike>>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface HomeScreenProps {
  seniorMode: boolean;
  onNavigate: (screen: ScreenId) => void;
  onAnalyze: (text: string) => void;
  onAnalyzeImage: (base64: string, mimeType: string, label: string) => void;
  onNotify: (msg: string) => void;
  onSpeakWithCun: () => void;
}

const QUICK_SAMPLES = [
  {
    id: 'police',
    label: 'Giả công an',
    text: 'Tôi là cán bộ công an Biên Hòa. Tài khoản bác liên quan vụ án, hãy chuyển 50.000.000đ để xác minh ngay hôm nay nếu không sẽ bị khởi tố.',
  },
  {
    id: 'job',
    label: 'Việc nhẹ',
    text: 'Tuyển CTV việc nhẹ lương cao 300k/ngày, bấm link http://nhanqua-shopee-vn.xyz và nạp trước 200k mở nhiệm vụ.',
  },
  { id: 'unknown', label: 'Số lạ mới', text: '0384-991-882' },
  { id: 'safe', label: '.gov.vn', text: 'https://canhbao.ncsc.gov.vn' },
] as const;

export function HomeScreen({
  seniorMode,
  onNavigate,
  onAnalyze,
  onAnalyzeImage,
  onNotify,
  onSpeakWithCun,
}: HomeScreenProps) {
  const [inputText, setInputText] = useState('');
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (seniorMode) {
    return (
      <ElderlyMode
        onNavigate={onNavigate}
        onSpeakWithCun={onSpeakWithCun}
        onAnalyzeText={onAnalyze}
      />
    );
  }

  async function handlePasteAndAnalyze() {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        onNotify('Bộ nhớ tạm đang trống — bạn hãy copy tin nhắn trước hoặc chọn mẫu thử.');
        return;
      }
      setInputText(clip.trim());
      onAnalyze(clip.trim());
    } catch {
      onNotify('Trình duyệt chưa cấp quyền đọc bộ nhớ tạm — bạn hãy chạm vào ô chữ để dán.');
    }
  }

  function handleVoiceInput() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!Recognition) {
      setInputText(QUICK_SAMPLES[0].text);
      onNotify('Trình duyệt chưa hỗ trợ Micro — đã điền mẫu giọng nói giả công an để bạn thử.');
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setListening(true);
      onNotify('Đang lắng nghe tiếng Việt...');
      recognition.onresult = (event) => {
        const spoken = event.results[0]?.[0]?.transcript ?? '';
        if (spoken) setInputText(spoken);
      };
      recognition.onerror = () => {
        setListening(false);
        onNotify('Không thu được âm thanh từ Micro.');
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  async function handleImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      onNotify('Đang nén ảnh & gửi Gemini Vision đọc tin nhắn...');
      const { base64, mimeType } = await compressImageToBase64(file);
      onAnalyzeImage(base64, mimeType, `Ảnh chụp: ${file.name}`);
    } catch {
      onNotify('Không đọc được tệp ảnh này.');
    }
  }

  return (
    <section className="space-y-4" data-screen="M01">
      {/* Vòng 1 Signature Emerald Agentic Hero Card */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-gradient-to-br from-[#07463F] via-[#0D685E] to-[#0F7B6F] p-4 text-white shadow-[0_14px_32px_rgba(13,104,94,0.24)]">
        <div className="pointer-events-none absolute -top-14 -right-11 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.28)_0%,transparent_70%)]" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-[#E6FFF8] backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#34D399]" />
            Lá chắn AI đang bảo vệ • Đồng Nai
          </span>
          <button
            type="button"
            onClick={onSpeakWithCun}
            data-screen="M01"
            data-ui="btn-hero-call-cun"
            className="rounded-full border border-[#FCD34D] bg-[#F59E0B]/25 px-2.5 py-1 text-[10.5px] font-bold text-white transition hover:bg-[#F59E0B]/40"
          >
            Gọi Cún AI
          </button>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onSpeakWithCun}
            aria-label="Mở Cún INFINITY AI"
            className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[18px] bg-white/95 shadow-lg ring-[3px] ring-[#F59E0B]/55 transition hover:scale-105"
          >
            <CunAiSvg size={42} />
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-lexend)] text-[17px] font-extrabold leading-tight">
              Dán tin lạ hoặc nói với Cún AI
            </h1>
            <p className="mt-0.5 text-xs leading-snug text-[#C7F3E8]">
              Kiểm tra SĐT, đường link, STK &amp; bẫy tâm lý trong 3 giây
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => void handleImagePicked(e)}
          className="hidden"
        />

        {/* Spotlight 2026 Command Pill */}
        <div className="relative z-10 mt-3 flex items-center gap-1 rounded-2xl bg-white/97 p-1.5 pl-3 text-[#0F172A] shadow-[0_8px_22px_rgba(4,38,34,0.26)]">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={1}
            placeholder="Dán tin, SĐT, link, STK..."
            className="h-9 flex-1 resize-none bg-transparent py-2 text-[13.5px] font-medium text-[#0F172A] outline-none placeholder:text-[#64748B]"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              aria-label="Xóa nội dung"
              className="rounded-full p-1 text-[#64748B] hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => void handlePasteAndAnalyze()}
            data-screen="M01"
            data-ui="btn-paste-clipboard"
            title="Dán nhanh từ bộ nhớ tạm"
            aria-label="Dán nhanh"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E9FAF5] text-[#0D685E] transition hover:bg-[#CCF3E7]"
          >
            <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleVoiceInput}
            data-screen="M01"
            data-ui="btn-voice-mic"
            title="Nói tiếng Việt"
            aria-label="Nhập bằng giọng nói"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
              listening
                ? 'bg-[#B91C1C] text-white'
                : 'bg-[#E9FAF5] text-[#0D685E] hover:bg-[#CCF3E7]'
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-screen="M01"
            data-ui="btn-scan-image"
            title="Quét ảnh chụp màn hình"
            aria-label="Quét ảnh chụp màn hình"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E9FAF5] text-[#0D685E] transition hover:bg-[#CCF3E7]"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onAnalyze(inputText)}
            data-screen="M01"
            data-ui="btn-kiem-tra-ngay"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#F59E0B] px-3 text-xs font-extrabold text-[#0F172A] shadow-sm transition hover:bg-[#D97706]"
          >
            Quét
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* 1-row Horizontal Glass Test Chips */}
        <div className="no-scrollbar relative z-10 mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {QUICK_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setInputText(sample.text);
                onAnalyze(sample.text);
              }}
              data-screen="M01"
              data-ui={`chip-sample-${sample.id}`}
              className="shrink-0 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vòng 1 Asymmetric Bento Row: Emergency Family Shield + Live Radar KPI */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('M03')}
          data-screen="M01"
          data-ui="btn-bento-family"
          className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] p-4 text-left text-[#0F172A] shadow-[0_8px_24px_rgba(245,158,11,0.22)] transition active:scale-[0.98]"
        >
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#78350F]">
              <PhoneCall className="h-3 w-3" aria-hidden="true" />
              Phanh khẩn cấp
            </span>
            <div className="mt-1 font-[family-name:var(--font-lexend)] text-base font-extrabold">
              Hỏi người thân
            </div>
            <div className="tabular-nums mt-0.5 text-[11px] font-bold text-[#78350F]">
              Chị Lan • 0912 *** 678
            </div>
          </div>
          <span className="mt-3 inline-flex w-fit rounded-full bg-[#0F172A] px-2.5 py-1 text-[11px] font-extrabold text-white">
            Gửi 1 chạm →
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M07')}
          data-screen="M01"
          data-ui="btn-bento-radar"
          className="flex flex-col justify-between rounded-[22px] bg-white p-4 text-left shadow-[0_6px_22px_rgba(13,104,94,0.08)] transition active:scale-[0.98]"
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0D685E]">
              Radar Đồng Nai
            </span>
            <div className="tabular-nums mt-1 font-[family-name:var(--font-lexend)] text-[28px] font-extrabold leading-none text-[#0D685E]">
              120
            </div>
            <div className="mt-1 text-[11px] font-semibold text-[#475569]">báo cáo tháng 11</div>
          </div>
          <div className="mt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[35%] rounded-full bg-[#B91C1C]" />
            </div>
            <div className="tabular-nums mt-1 text-[11px] font-extrabold text-[#991B1B]">
              35% link giả mạo
            </div>
          </div>
        </button>
      </div>

      {/* Compact Quick Report Strip (clean access to M04 without cluttering Header) */}
      <button
        type="button"
        onClick={() => onNavigate('M04')}
        data-screen="M01"
        data-ui="btn-home-quick-report"
        className="flex min-h-[46px] w-full items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-left text-xs shadow-[0_4px_16px_rgba(13,104,94,0.05)] transition active:scale-[0.99]"
      >
        <span className="inline-flex items-center gap-2 font-extrabold text-[#991B1B]">
          <Flag className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
          Báo cáo lừa đảo &amp; Kênh Công an / NCSC / 111
        </span>
        <ArrowRight className="h-4 w-4 text-[#64748B]" aria-hidden="true" />
      </button>
    </section>
  );
}
