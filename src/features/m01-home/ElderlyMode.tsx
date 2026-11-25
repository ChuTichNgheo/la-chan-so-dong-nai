'use client';

import { useState } from 'react';
import {
  Camera,
  ClipboardPaste,
  PhoneCall,
  Radio,
  Search,
  SlidersHorizontal,
  Video,
} from 'lucide-react';
import { maskSensitiveTarget } from '@/lib/privacy';
import type { ScreenId, UiMode } from '@/types';

interface ElderlyModeProps {
  trustedName: string;
  trustedPhone: string;
  onNavigate: (screen: ScreenId) => void;
  onOpenLiveVoice: () => void;
  onAnalyzeText: (text: string) => void;
  onPickImage: () => void;
  onChangeUiMode: (mode: UiMode) => void;
}

/**
 * Chế độ Tối giản (1 chạm — Chữ lớn):
 * Dành cho bất kỳ ai muốn thao tác thật đơn giản (người lớn tuổi, người mới dùng điện thoại,
 * thị lực kém hoặc đang bối rối khi nhận cuộc gọi lạ). Không dán nhãn giới hạn độ tuổi.
 */
export function ElderlyMode({
  trustedName,
  trustedPhone,
  onNavigate,
  onOpenLiveVoice,
  onAnalyzeText,
  onPickImage,
  onChangeUiMode,
}: ElderlyModeProps) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const shortName = trustedName.split('(')[0].trim() || 'Người thân';

  return (
    <div className="space-y-3.5" data-screen="M01b">
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_4px_14px_rgba(13,104,94,0.06)]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#0D685E]">
            Chế độ Tối giản • Chữ to • 1 chạm
          </p>
          <p className="text-[11px] text-[#475569]">
            Thiết kế cho mọi người cần thao tác nhanh, dễ nhìn
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChangeUiMode('standard')}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-full bg-[#E9FAF5] px-3 py-1.5 text-xs font-bold text-[#0D685E]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Đầy đủ
        </button>
      </div>

      {/* Primary Giant Button: Real Live Voice Scam Guard */}
      <button
        type="button"
        onClick={onOpenLiveVoice}
        data-screen="M01b"
        data-ui="btn-noi-cun-ai"
        className="flex min-h-[104px] w-full items-center gap-3.5 rounded-3xl border-2 border-[#14B8A6] bg-gradient-to-br from-[#07463F] via-[#0D685E] to-[#0F7B6F] p-4 text-left text-white shadow-[0_12px_28px_rgba(13,104,94,0.28)] active:scale-[0.99]"
      >
        <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-[#0D685E] shadow-md">
          <Radio className="h-8 w-8 animate-pulse" aria-hidden="true" />
        </span>
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-[#D1FAE5]">
            Nghe trực tiếp • Báo động tức thì
          </span>
          <div className="mt-1 font-[family-name:var(--font-lexend)] text-xl font-extrabold leading-tight">
            BẤM ĐỂ NÓI / NGHE CUỘC GỌI LẠ
          </div>
          <div className="mt-1 text-sm text-[#D1FAE5]">
            Bật loa ngoài hoặc kể lại — Cún nghe và cảnh báo ngay
          </div>
        </div>
      </button>

      {/* Emergency Brake: Ask Family */}
      <button
        type="button"
        onClick={() => onNavigate('M03')}
        data-screen="M01b"
        data-ui="btn-hoi-con-gai"
        className="flex min-h-[88px] w-full items-center gap-3.5 rounded-3xl border-2 border-[#B45309] bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] p-4 text-left text-[#0F172A] shadow-md active:scale-[0.99]"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#0F172A] text-[#FCD34D]">
          <PhoneCall className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <div className="font-[family-name:var(--font-lexend)] text-xl font-extrabold leading-tight">
            HỎI {shortName.toUpperCase()} NGAY
          </div>
          <div className="tabular-nums mt-0.5 text-base font-bold text-[#78350F]">
            {shortName} • {maskSensitiveTarget(trustedPhone)}
          </div>
        </div>
      </button>

      {/* Simple 3-way secondary grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setShowPaste((prev) => !prev)}
          data-screen="M01b"
          data-ui="btn-toggle-paste-senior"
          className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#0D685E] bg-white p-2.5 text-sm font-extrabold text-[#0D685E]"
        >
          <ClipboardPaste className="h-6 w-6" aria-hidden="true" />
          <span>Dán tin</span>
        </button>

        <button
          type="button"
          onClick={onPickImage}
          data-screen="M01b"
          data-ui="btn-minimal-scan-image"
          className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#0D685E] bg-white p-2.5 text-sm font-extrabold text-[#0D685E]"
        >
          <Camera className="h-6 w-6" aria-hidden="true" />
          <span>Quét ảnh</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M05')}
          data-screen="M01b"
          data-ui="btn-xem-video"
          className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#0D685E] bg-white p-2.5 text-sm font-extrabold text-[#0D685E]"
        >
          <Video className="h-6 w-6" aria-hidden="true" />
          <span>Xem Video</span>
        </button>
      </div>

      {showPaste && (
        <div className="rounded-3xl border-2 border-[#CBE4DC] bg-white p-3.5 shadow-sm">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={3}
            placeholder="Dán tin nhắn, đường link hoặc số điện thoại vào đây..."
            className="w-full rounded-2xl border border-[#CBE4DC] bg-[#F4FBF8] p-3 text-base outline-none focus:border-[#0D685E]"
          />
          <button
            type="button"
            onClick={() => onAnalyzeText(pasteText)}
            data-screen="M01b"
            data-ui="btn-senior-analyze-paste"
            className="mt-2.5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0D685E] text-base font-extrabold text-white"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Kiểm tra ngay
          </button>
        </div>
      )}
    </div>
  );
}
