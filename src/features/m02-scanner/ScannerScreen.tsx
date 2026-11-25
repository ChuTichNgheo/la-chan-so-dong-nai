'use client';

import { Volume2, PhoneCall, Flag } from 'lucide-react';
import { AlertBadge } from '@/components/AlertBadge';
import { speakAlertVietnamese } from '@/lib/speech';
import type { AnalyzeResult, ScreenId } from '@/types';

interface ScannerScreenProps {
  result: AnalyzeResult | null;
  loading: boolean;
  onNavigate: (screen: ScreenId) => void;
}

export function ScannerScreen({ result, loading, onNavigate }: ScannerScreenProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-[#CBE4DC] bg-white p-4" data-screen="M02">
        <h1 className="font-[family-name:var(--font-lexend)] text-base font-bold text-[#0D685E]">
          Đang đối chiếu 2 tầng bảo vệ...
        </h1>
        <p className="mt-2 text-xs text-[#475569]">
          • Tầng 1: Luật tất định &amp; DB cộng đồng Đồng Nai → Tầng 2: Gemini AI
        </p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="rounded-2xl border border-[#CBE4DC] bg-white p-4 text-center" data-screen="M02">
        <p className="text-sm font-bold text-[#0F172A]">Chưa có nội dung kiểm tra</p>
        <p className="mt-1 text-xs text-[#475569]">
          Quay lại Trang chủ (M01) để dán tin nhắn, SĐT hoặc đường link nghi vấn.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('M01')}
          data-screen="M02"
          data-ui="btn-back-home"
          className="mt-3 rounded-xl bg-[#0D685E] px-4 py-2 text-xs font-bold text-white"
        >
          Về Trang chủ
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3" data-screen="M02">
      <div className="rounded-2xl border border-[#CBE4DC] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <AlertBadge level={result.level} customLabel={result.badge} />
          <span className="text-[11px] font-semibold text-[#475569]">Nguồn: {result.source}</span>
        </div>
        <h1 className="mt-2.5 font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0F172A]">
          {result.title}
        </h1>
        <ul className="mt-2.5 space-y-1.5 text-xs text-[#1E293B]">
          {result.reasons.map((reason, idx) => (
            <li key={idx} className="rounded-lg bg-[#F4FBF8] p-2">
              {idx + 1}. {reason}
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void speakAlertVietnamese(result.speech)}
            data-screen="M02"
            data-ui="btn-speak-alert"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#E9FAF5] px-3 text-xs font-bold text-[#0D685E]"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            Nghe đọc to
          </button>
          <button
            type="button"
            onClick={() => onNavigate('M04')}
            data-screen="M02"
            data-ui="btn-goto-report"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#DC2626] bg-[#FEF2F2] px-3 text-xs font-bold text-[#991B1B]"
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            Báo cáo ngay
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate('M03')}
        data-screen="M02"
        data-ui="btn-ask-family-cta"
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#B45309] bg-[#F59E0B] font-extrabold text-[#0F172A]"
      >
        <PhoneCall className="h-4 w-4" aria-hidden="true" />
        Hỏi người thân ngay
      </button>
    </section>
  );
}
