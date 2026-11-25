'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ClipboardPaste,
  Cpu,
  Flag,
  Flame,
  Gamepad2,
  Mic,
  MicOff,
  PhoneCall,
  QrCode,
  Radar,
  ShieldCheck,
  Sparkles,
  Type,
  Video,
  X,
} from 'lucide-react';
import { CunAiSvg } from '@/components/CunAiMascot';
import { compressImageToBase64 } from '@/lib/image-compress';
import { maskSensitiveTarget } from '@/lib/privacy';
import type { AppUserProfile, RadarStats, ScamReport, ScreenId, UiMode } from '@/types';
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
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface HomeScreenProps {
  uiMode: UiMode;
  trustedName: string;
  trustedPhone: string;
  hasCustomContact: boolean;
  hasScannedOnce: boolean;
  currentUser: AppUserProfile | null;
  radarStats: RadarStats;
  recentApproved: ScamReport[];
  onChangeUiMode: (mode: UiMode) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenVideoAt: (index: number) => void;
  onAnalyze: (text: string) => void;
  onAnalyzeImage: (base64: string, mimeType: string, label: string) => void;
  onNotify: (msg: string) => void;
  onOpenLiveVoice: () => void;
  onOpenQrScanner: () => void;
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

const TRENDING_SCAMS = [
  {
    id: 'trend-police',
    tag: 'Cảnh báo ĐỎ',
    tagClass: 'bg-[#FEF2F2] text-[#B91C1C]',
    title: 'Giả Công an gọi video Deepfake',
    subtitle: 'Dọa liên quan vụ án, ép chuyển tiền xác minh vào tài khoản lạ.',
    sampleText:
      'Tôi là cán bộ Công an Đồng Nai, bạn liên quan vụ án rửa tiền, giữ bí mật và chuyển tiền xác minh ngay hôm nay.',
    videoIndex: 0,
  },
  {
    id: 'trend-vneid',
    tag: '35% báo cáo',
    tagClass: 'bg-[#FFFBEB] text-[#92400E]',
    title: 'Link VNeID / BHYT giả (.xyz, .apk)',
    subtitle: 'Dụ cài file .apk ngoài kho ứng dụng để chiếm quyền kiểm soát máy.',
    sampleText:
      'Yêu cầu cập nhật sinh trắc học và BHYT trên http://vneid-capnhat-dn.xyz/app.apk ngay trong 2 giờ.',
    videoIndex: 1,
  },
  {
    id: 'trend-job',
    tag: 'Học sinh THPT',
    tagClass: 'bg-[#EEF2FF] text-[#3730A3]',
    title: 'Tuyển CTV việc nhẹ nạp 200k',
    subtitle: 'Trả hoa hồng nhỏ lần đầu rồi khóa rút tiền để lừa nạp tiền triệu.',
    sampleText:
      'Tuyển CTV việc nhẹ lương cao 300k/ngày tại nhà, nạp trước 200k mở nhiệm vụ nhận hoàn tiền ngay.',
    videoIndex: 0,
  },
  {
    id: 'trend-electric',
    tag: 'Mới rộ tuần này',
    tagClass: 'bg-[#E9FAF5] text-[#0D685E]',
    title: 'Giả Điện lực dọa cắt điện 2 giờ',
    subtitle: 'Gọi hối thúc thanh toán hóa đơn qua STK cá nhân hoặc đường link lạ.',
    sampleText:
      'Thông báo từ Điện lực Đồng Nai: hộ gia đình chưa thanh toán hóa đơn, sẽ cắt điện trong 2 giờ nếu không chuyển tiền ngay.',
    videoIndex: 1,
  },
] as const;

const MODE_OPTIONS: Array<{
  id: UiMode;
  label: string;
  desc: string;
  icon: 'minimal' | 'standard' | 'pro';
}> = [
  { id: 'minimal', label: 'Tối giản', desc: 'Chữ to • 1 chạm', icon: 'minimal' },
  { id: 'standard', label: 'Tiêu chuẩn', desc: 'Cân bằng', icon: 'standard' },
  { id: 'pro', label: 'Chuyên sâu', desc: 'Kỹ thuật AI', icon: 'pro' },
];

export function HomeScreen({
  uiMode,
  trustedName,
  trustedPhone,
  hasCustomContact,
  hasScannedOnce,
  currentUser,
  radarStats,
  recentApproved,
  onChangeUiMode,
  onNavigate,
  onOpenVideoAt,
  onAnalyze,
  onAnalyzeImage,
  onNotify,
  onOpenLiveVoice,
  onOpenQrScanner,
  onSpeakWithCun,
}: HomeScreenProps) {
  const [inputText, setInputText] = useState('');
  const [listening, setListening] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const tickerItems =
    recentApproved.length > 0
      ? recentApproved.map(
          (r) => `${r.area}: ${r.type} (${r.targetMasked})`
        )
      : [
          'P. Trấn Biên: Đường dẫn giả mạo VNeID tích hợp BHYT (.xyz)',
          'P. Tân Phong: Tuyển CTV việc nhẹ lương cao nhắm vào học sinh THPT',
          'TP. Long Khánh: Cuộc gọi giả danh Công an yêu cầu chuyển tiền xác minh',
        ];

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const id = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4500);
    return () => clearInterval(id);
  }, [tickerItems.length]);

  async function handleImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      onNotify('Đang nén ảnh & đọc nội dung tin nhắn/mã QR...');
      const { base64, mimeType } = await compressImageToBase64(file);
      onAnalyzeImage(base64, mimeType, `Ảnh chụp: ${file.name}`);
    } catch {
      onNotify('Không đọc được tệp ảnh này.');
    }
  }

  const hiddenFileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      onChange={(e) => void handleImagePicked(e)}
      className="hidden"
    />
  );

  if (uiMode === 'minimal') {
    return (
      <>
        {hiddenFileInput}
        <ElderlyMode
          trustedName={trustedName}
          trustedPhone={trustedPhone}
          onNavigate={onNavigate}
          onOpenLiveVoice={onOpenLiveVoice}
          onOpenQrScanner={onOpenQrScanner}
          onAnalyzeText={onAnalyze}
          onPickImage={() => fileRef.current?.click()}
          onChangeUiMode={onChangeUiMode}
        />
      </>
    );
  }

  function adjustTextareaHeight(el: HTMLTextAreaElement) {
    el.style.height = '38px';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
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
    const isMobile = /Android|iPhone|iPad|iPod|Zalo|FBAN|FBAV/i.test(navigator.userAgent || '');
    if (isMobile) {
      onOpenLiveVoice();
      return;
    }

    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop error
      }
      recognitionRef.current = null;
      setListening(false);
      onNotify('Đã dừng thu âm.');
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!Recognition) {
      onOpenLiveVoice();
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      setListening(true);
      onNotify('Đang lắng nghe tiếng Việt (bấm lại Micro để dừng)...');
      recognition.onresult = (event) => {
        const spoken = event.results[0]?.[0]?.transcript ?? '';
        if (spoken) setInputText(spoken);
      };
      recognition.onerror = () => {
        recognitionRef.current = null;
        setListening(false);
        onNotify('Không thu được âm thanh từ Micro.');
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }

  const shortContact = trustedName.split('(')[0].trim() || 'Người thân';
  const hasPlayedGame = (currentUser?.gameScore ?? 0) > 0;
  const shieldScore =
    30 + (hasCustomContact ? 25 : 15) + (hasScannedOnce ? 20 : 0) + (hasPlayedGame ? 25 : 0);
  const nextShieldAction = !hasScannedOnce
    ? { label: 'Quét thử 1 tin', action: () => onAnalyze(QUICK_SAMPLES[0].text) }
    : !hasPlayedGame
    ? { label: 'Luyện Bắt bài', action: () => onNavigate('M06') }
    : { label: 'Cập nhật người thân', action: () => onNavigate('M03') };

  const activeTicker = tickerItems[tickerIndex % tickerItems.length];

  return (
    <section className="space-y-4" data-screen="M01">
      {hiddenFileInput}

      {/* Adaptive 3-Mode Interface Bar */}
      <div className="rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.06)]">
        <div className="grid grid-cols-3 gap-1">
          {MODE_OPTIONS.map((opt) => {
            const active = uiMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeUiMode(opt.id)}
                data-screen="M01"
                data-ui={`btn-adaptive-${opt.id}`}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-extrabold transition ${
                  active
                    ? opt.id === 'pro'
                      ? 'bg-[#0F172A] text-[#34D399] shadow-xs'
                      : 'bg-[#0D685E] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F4FBF8]'
                }`}
              >
                {opt.icon === 'minimal' ? (
                  <Type className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : opt.icon === 'pro' ? (
                  <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Command Center */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/20 bg-gradient-to-br from-[#07463F] via-[#0D685E] to-[#0F7B6F] p-4 text-white shadow-[0_14px_32px_rgba(13,104,94,0.24)]">
        <div className="pointer-events-none absolute -top-14 -right-11 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.3)_0%,transparent_70%)]" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-bold text-[#E6FFF8] backdrop-blur sm:text-[11px]">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#34D399]" />
            Lá Chắn AI • Đồng Nai
          </span>
          <button
            type="button"
            onClick={onOpenQrScanner}
            data-screen="M01"
            data-ui="btn-hero-scan-qr"
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#FCD34D] bg-[#F59E0B] px-2.5 py-1 text-[10.5px] font-extrabold text-[#0F172A] shadow-sm transition hover:bg-[#FBBF24]"
          >
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            Quét QR chuyển tiền
          </button>
        </div>

        <div className="relative z-10 mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onSpeakWithCun}
            aria-label="Xem Cún AI dẫn đường"
            className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[18px] bg-white/95 shadow-lg ring-[3px] ring-[#F59E0B]/55 transition hover:scale-105"
          >
            <CunAiSvg size={42} />
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-lexend)] text-[17px] font-extrabold leading-tight">
              Kiểm tra nhanh trước khi chuyển tiền
            </h1>
            <p className="mt-0.5 text-xs leading-snug text-[#C7F3E8]">
              {uiMode === 'pro'
                ? 'Hybrid 2 tầng: Luật tất định + Giải mã URL + Gemini Vision'
                : 'Dán tin nhắn, SĐT, link, STK hoặc chụp ảnh màn hình / mã QR'}
            </p>
          </div>
        </div>

        {/* Spotlight Command Pill — crisp single-line on 390px */}
        <div className="relative z-10 mt-3 flex items-center gap-1 rounded-2xl bg-white/97 p-1.5 pl-3 text-[#0F172A] shadow-[0_8px_22px_rgba(4,38,34,0.26)]">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              adjustTextareaHeight(e.target);
            }}
            rows={1}
            placeholder="Dán tin, SĐT, link..."
            className="h-[38px] min-h-[38px] flex-1 resize-none overflow-hidden bg-transparent py-2 text-[13px] font-medium leading-[22px] text-[#0F172A] outline-none placeholder:truncate placeholder:text-[#64748B]"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText('');
                if (textareaRef.current) textareaRef.current.style.height = '38px';
              }}
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
            title={listening ? 'Bấm để dừng thu âm' : 'Nói tiếng Việt'}
            aria-label={listening ? 'Dừng thu âm' : 'Nhập bằng giọng nói'}
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
            title="Quét ảnh chụp màn hình / QR"
            aria-label="Quét ảnh chụp màn hình hoặc mã QR"
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

        {/* Sample Chips — clean 1-row 4-column layout with zero orphan wrap on 390px */}
        <div className="relative z-10 mt-2.5 grid grid-cols-4 gap-1.5">
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
              className="truncate rounded-full border border-white/20 bg-white/15 px-2 py-1 text-center text-[10.5px] font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Live Đồng Nai Alert Ticker */}
        <button
          type="button"
          onClick={() => onNavigate('M07')}
          data-screen="M01"
          data-ui="btn-live-ticker"
          className="relative z-10 mt-3 flex w-full items-center gap-2 rounded-2xl bg-black/25 px-3 py-2 text-left text-[11px] text-[#E6FFF8] backdrop-blur-xs transition hover:bg-black/35"
        >
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#DC2626] px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase text-white">
            <Flame className="h-3 w-3" aria-hidden="true" />
            Nóng
          </span>
          <span className="flex-1 truncate font-semibold">{activeTicker}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#FCD34D]" aria-hidden="true" />
        </button>
      </div>

      {/* Personal Shield Readiness Bar */}
      <div className="rounded-3xl bg-white p-3.5 shadow-[0_6px_20px_rgba(13,104,94,0.06)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#E9FAF5] text-[#0D685E]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0F172A]">
                <span>Độ an toàn cá nhân</span>
                <span className="tabular-nums rounded-full bg-[#E9FAF5] px-2 py-0.5 text-[11px] text-[#0D685E]">
                  {shieldScore}%
                </span>
              </div>
              <p className="text-[11px] text-[#475569]">
                {shieldScore >= 90
                  ? 'Lá chắn của bạn đã được kích hoạt rất tốt!'
                  : 'Hoàn thành nhanh để tăng lớp bảo vệ cho bạn & gia đình'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={nextShieldAction.action}
            className="shrink-0 rounded-full bg-[#0D685E] px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {nextShieldAction.label}
          </button>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0D685E] to-[#14B8A6] transition-all duration-500"
            style={{ width: `${Math.min(100, shieldScore)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10.5px] font-semibold text-[#475569]">
          <span className="inline-flex items-center gap-1 text-[#059669]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Người thân tin cậy
          </span>
          <span className={`inline-flex items-center gap-1 ${hasScannedOnce ? 'text-[#059669]' : 'text-[#94A3B8]'}`}>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Đã quét kiểm tra
          </span>
          <span className={`inline-flex items-center gap-1 ${hasPlayedGame ? 'text-[#059669]' : 'text-[#94A3B8]'}`}>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Luyện Bắt bài
          </span>
        </div>
      </div>

      {/* 2x2 Creative Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('M03')}
          data-screen="M01"
          data-ui="btn-bento-family"
          className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] p-3.5 text-left text-[#0F172A] shadow-[0_8px_22px_rgba(245,158,11,0.22)] transition active:scale-[0.98]"
        >
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#78350F]">
              <PhoneCall className="h-3 w-3" aria-hidden="true" />
              Phanh khẩn cấp
            </span>
            <div className="mt-1 font-[family-name:var(--font-lexend)] text-[15px] font-extrabold">
              Hỏi người thân
            </div>
            <div className="tabular-nums mt-0.5 truncate text-[11px] font-bold text-[#78350F]">
              {shortContact} • {maskSensitiveTarget(trustedPhone)}
            </div>
          </div>
          <span className="mt-3 inline-flex w-fit rounded-full bg-[#0F172A] px-2.5 py-1 text-[10.5px] font-extrabold text-white">
            Gửi 1 chạm →
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M07')}
          data-screen="M01"
          data-ui="btn-bento-radar"
          className="flex flex-col justify-between rounded-[22px] bg-white p-3.5 text-left shadow-[0_6px_22px_rgba(13,104,94,0.08)] transition active:scale-[0.98]"
        >
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#0D685E]">
              <Radar className="h-3 w-3" aria-hidden="true" />
              Radar Đồng Nai
            </span>
            <div className="tabular-nums mt-1 font-[family-name:var(--font-lexend)] text-[26px] font-extrabold leading-none text-[#0D685E]">
              {radarStats.totalReports}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-[#475569]">báo cáo xác minh</div>
          </div>
          <div className="mt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#B91C1C]"
                style={{ width: `${Math.min(100, Math.max(5, radarStats.fakeLinkPercent))}%` }}
              />
            </div>
            <div className="tabular-nums mt-1 text-[10.5px] font-extrabold text-[#991B1B]">
              {radarStats.fakeLinkPercent}% link giả mạo
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M06')}
          data-screen="M01"
          data-ui="btn-bento-learning"
          className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] p-3.5 text-left text-white shadow-[0_8px_22px_rgba(15,23,42,0.18)] transition active:scale-[0.98]"
        >
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#34D399]">
              <Gamepad2 className="h-3 w-3" aria-hidden="true" />
              Luyện phản xạ
            </span>
            <div className="mt-1 font-[family-name:var(--font-lexend)] text-[15px] font-extrabold">
              Bắt Bài &amp; Học 1p
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-200">
              <Award className="h-3 w-3 text-[#FCD34D]" aria-hidden="true" />
              <span className="truncate">
                {currentUser ? `${currentUser.gameScore}đ • ${currentUser.gameBadge}` : 'Thử thách 10 giây'}
              </span>
            </div>
          </div>
          <span className="mt-3 inline-flex w-fit rounded-full bg-[#34D399]/20 px-2.5 py-1 text-[10.5px] font-extrabold text-[#6EE7B7]">
            Chơi ngay →
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M04')}
          data-screen="M01"
          data-ui="btn-home-quick-report"
          className="flex flex-col justify-between rounded-[22px] border border-[#FECACA] bg-gradient-to-br from-[#FEF2F2] to-white p-3.5 text-left shadow-[0_6px_18px_rgba(185,28,28,0.07)] transition active:scale-[0.98]"
        >
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#B91C1C]">
              <Flag className="h-3 w-3" aria-hidden="true" />
              Hồ sơ Công an
            </span>
            <div className="mt-1 font-[family-name:var(--font-lexend)] text-[15px] font-extrabold text-[#7F1D1D]">
              Báo cáo lừa đảo
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-[#475569]">
              Tự điền từ ảnh • VNeID / 111
            </div>
          </div>
          <span className="mt-3 inline-flex w-fit rounded-full bg-[#DC2626] px-2.5 py-1 text-[10.5px] font-extrabold text-white">
            Gửi tin báo →
          </span>
        </button>
      </div>

      {/* Horizontal Carousel: Trending Scams in Đồng Nai */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0F172A]">
            Thủ đoạn đang rộ tại Đồng Nai
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('M05')}
            className="text-[11px] font-bold text-[#0D685E]"
          >
            Xem Video →
          </button>
        </div>

        <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {TRENDING_SCAMS.map((item) => (
            <div
              key={item.id}
              className="flex w-[228px] shrink-0 flex-col justify-between rounded-3xl bg-white p-3.5 shadow-[0_6px_18px_rgba(13,104,94,0.06)]"
            >
              <div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${item.tagClass}`}>
                  {item.tag}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-lexend)] text-[13px] font-extrabold leading-snug text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#475569]">{item.subtitle}</p>
              </div>
              <div className="mt-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onAnalyze(item.sampleText)}
                  className="flex-1 rounded-xl bg-[#E9FAF5] py-1.5 text-[11px] font-extrabold text-[#0D685E]"
                >
                  Quét thử
                </button>
                <button
                  type="button"
                  onClick={() => onOpenVideoAt(item.videoIndex)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-[#0F172A]"
                >
                  <Video className="h-3 w-3" aria-hidden="true" />
                  1 phút
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
