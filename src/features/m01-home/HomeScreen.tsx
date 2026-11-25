'use client';

import { useState } from 'react';
import { Gamepad2, Mic, MicOff, PhoneCall, Radar, Search, ShieldAlert, Video, X } from 'lucide-react';
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
  onNotify: (msg: string) => void;
  onSpeakWithCun: () => void;
}

const QUICK_SAMPLES = [
  {
    id: 'police',
    label: 'Giả Công an',
    text: 'Tôi là cán bộ công an Biên Hòa. Tài khoản bác liên quan vụ án, hãy chuyển 50.000.000đ để xác minh ngay hôm nay nếu không sẽ bị khởi tố.',
  },
  {
    id: 'job',
    label: 'Link CTV .xyz',
    text: 'Tuyển CTV việc nhẹ lương cao 300k/ngày, bấm link http://nhanqua-shopee-vn.xyz và nạp trước 200k mở nhiệm vụ.',
  },
  {
    id: 'unknown',
    label: 'Số lạ mới',
    text: '0384-991-882',
  },
  {
    id: 'safe',
    label: 'Cổng NCSC',
    text: 'https://canhbao.ncsc.gov.vn',
  },
] as const;

export function HomeScreen({
  seniorMode,
  onNavigate,
  onAnalyze,
  onNotify,
  onSpeakWithCun,
}: HomeScreenProps) {
  const [inputText, setInputText] = useState('');
  const [listening, setListening] = useState(false);

  if (seniorMode) {
    return (
      <ElderlyMode
        onNavigate={onNavigate}
        onSpeakWithCun={onSpeakWithCun}
        onAnalyzeText={onAnalyze}
      />
    );
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
      onNotify('Trình duyệt chưa hỗ trợ Micro trực tiếp — đã điền mẫu giọng nói giả công an để bạn thử.');
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setListening(true);
      onNotify('Đang lắng nghe tiếng Việt... Hãy nói nội dung cuộc gọi hoặc tin nhắn.');

      recognition.onresult = (event) => {
        const spoken = event.results[0]?.[0]?.transcript ?? '';
        if (spoken) {
          setInputText(spoken);
          onNotify('Đã nhận diện giọng nói! Bấm Kiểm tra ngay để phân tích.');
        }
      };
      recognition.onerror = () => {
        setListening(false);
        onNotify('Không thu được âm thanh từ Micro. Bạn có thể dán chữ hoặc chọn mẫu thử nhanh.');
      };
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  return (
    <section className="space-y-3" data-screen="M01">
      <div className="rounded-2xl border border-[#CBE4DC] bg-gradient-to-br from-[#07463F] via-[#0D685E] to-[#0F7B6F] p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-[#D1FAE5]">
            <span className="h-2 w-2 rounded-full bg-[#34D399]" />
            Lá chắn AI bảo vệ • Đồng Nai
          </span>
          <span className="text-[11px] font-semibold text-[#A7F3D0]">Hybrid 2 tầng</span>
        </div>

        <h1 className="mt-2 font-[family-name:var(--font-lexend)] text-lg font-extrabold">
          Dán tin lạ hoặc nói với Cún AI
        </h1>

        <div className="relative mt-2.5">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="Dán tin nhắn, SĐT, link hoặc STK nghi vấn..."
            className="w-full rounded-xl border border-[#CBE4DC] bg-white p-2.5 pr-9 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-[#F59E0B]"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              aria-label="Xóa nội dung"
              className="absolute top-2 right-2 rounded-full bg-slate-100 p-1 text-[#475569]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
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
              className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-white/25"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleVoiceInput}
            data-screen="M01"
            data-ui="btn-voice-mic"
            className={`inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
              listening
                ? 'border-[#F59E0B] bg-[#F59E0B] text-[#0F172A]'
                : 'border-white/30 bg-white/15 text-white'
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? 'Đang nghe' : 'Nói'}
          </button>
          <button
            type="button"
            onClick={() => onAnalyze(inputText)}
            data-screen="M01"
            data-ui="btn-kiem-tra-ngay"
            className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-extrabold text-[#0F172A] shadow transition hover:bg-[#D97706]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Kiểm tra ngay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('M03')}
          data-screen="M01"
          data-ui="btn-bento-family"
          className="flex flex-col items-start gap-1 rounded-2xl border-2 border-[#B45309] bg-[#FFFBEB] p-3 text-left text-[#0F172A]"
        >
          <PhoneCall className="h-5 w-5 text-[#B45309]" aria-hidden="true" />
          <span className="text-sm font-extrabold">Hỏi người thân</span>
          <span className="tabular-nums text-[11px] font-semibold text-[#92400E]">
            Chị Lan • 0912 *** 678
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M07')}
          data-screen="M01"
          data-ui="btn-bento-radar"
          className="flex flex-col items-start gap-1 rounded-2xl border border-[#CBE4DC] bg-white p-3 text-left text-[#0F172A]"
        >
          <Radar className="h-5 w-5 text-[#0D685E]" aria-hidden="true" />
          <span className="text-sm font-extrabold">Radar Đồng Nai</span>
          <span className="tabular-nums text-[11px] text-[#475569]">120 báo cáo • 35% link giả</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M05')}
          data-screen="M01"
          data-ui="btn-bento-video"
          className="flex flex-col items-start gap-1 rounded-2xl border border-[#CBE4DC] bg-white p-3 text-left text-[#0F172A]"
        >
          <Video className="h-5 w-5 text-[#0D685E]" aria-hidden="true" />
          <span className="text-sm font-extrabold">Video 1 phút</span>
          <span className="text-[11px] text-[#475569]">10 thủ đoạn phổ biến</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M06')}
          data-screen="M01"
          data-ui="btn-bento-game"
          className="flex flex-col items-start gap-1 rounded-2xl border border-[#CBE4DC] bg-white p-3 text-left text-[#0F172A]"
        >
          <Gamepad2 className="h-5 w-5 text-[#0D685E]" aria-hidden="true" />
          <span className="text-sm font-extrabold">Bắt bài lừa đảo</span>
          <span className="text-[11px] text-[#475569]">Mini Game 5 màn</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('M08')}
        data-screen="M01"
        data-ui="btn-open-m08"
        className="flex min-h-[42px] w-full items-center justify-between rounded-xl border border-[#CBE4DC] bg-[#E9FAF5] px-3 text-xs font-bold text-[#0D685E]"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Trạng thái Hệ thống &amp; Chế độ Ngoại tuyến (M08)
        </span>
        <span>Mở →</span>
      </button>
    </section>
  );
}
