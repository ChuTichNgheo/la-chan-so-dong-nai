'use client';

import { useState } from 'react';
import { PhoneCall, Radar, Search, ShieldAlert } from 'lucide-react';
import type { ScreenId } from '@/types';
import { ElderlyMode } from './ElderlyMode';

interface HomeScreenProps {
  seniorMode: boolean;
  onNavigate: (screen: ScreenId) => void;
  onAnalyze: (text: string) => void;
}

export function HomeScreen({ seniorMode, onNavigate, onAnalyze }: HomeScreenProps) {
  const [inputText, setInputText] = useState('');

  if (seniorMode) {
    return (
      <ElderlyMode
        onNavigate={onNavigate}
        onQuickAnalyzePolice={() =>
          onAnalyze(
            'Tôi là cán bộ công an Biên Hòa. Hãy chuyển 50.000.000đ để xác minh ngay hôm nay nếu không sẽ bị khởi tố.'
          )
        }
      />
    );
  }

  return (
    <section className="space-y-3" data-screen="M01">
      <div className="rounded-2xl border border-[#CBE4DC] bg-white p-4 shadow-sm">
        <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
          Kiểm tra trước khi chuyển tiền
        </h1>
        <p className="mt-1 text-xs text-[#475569]">
          Dán tin nhắn, số điện thoại, đường link hoặc số tài khoản nghi vấn.
        </p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          placeholder="VD: Tôi là công an Biên Hòa, chuyển 50 triệu xác minh..."
          className="mt-2.5 w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm outline-none focus:border-[#0D685E]"
        />
        <button
          type="button"
          onClick={() => onAnalyze(inputText)}
          data-screen="M01"
          data-ui="btn-kiem-tra-ngay"
          className="mt-2.5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0D685E] px-4 font-bold text-white transition hover:bg-[#09524A]"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Kiểm tra ngay (Hybrid Luật + AI)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('M03')}
          data-screen="M01"
          data-ui="btn-bento-family"
          className="flex flex-col items-start gap-1 rounded-2xl border-2 border-[#B45309] bg-[#F59E0B] p-3 text-left text-[#0F172A]"
        >
          <PhoneCall className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-extrabold">Hỏi người thân</span>
          <span className="tabular-nums text-[11px] font-semibold">Chị Lan • 0912 *** 678</span>
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
      </div>

      <button
        type="button"
        onClick={() => onNavigate('M08')}
        data-screen="M01"
        data-ui="btn-open-m08"
        className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#CBE4DC] bg-[#E9FAF5] px-3 text-xs font-bold text-[#0D685E]"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Xem Trạng thái Hệ thống &amp; Offline (M08)
        </span>
        <span>Mở →</span>
      </button>
    </section>
  );
}
