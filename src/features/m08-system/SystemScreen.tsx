'use client';

import { Search, WifiOff } from 'lucide-react';
import { AlertBadge } from '@/components/AlertBadge';

interface SystemScreenProps {
  offlineMode: boolean;
  onToggleOffline: () => void;
  onTryPoliceSample: () => void;
}

export function SystemScreen({
  offlineMode,
  onToggleOffline,
  onTryPoliceSample,
}: SystemScreenProps) {
  return (
    <section className="space-y-4" data-screen="M08">
      <h1 className="px-1 font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
        Trạng thái Hệ thống &amp; An toàn
      </h1>

      <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
        <div className="font-extrabold text-[#0D685E]">1. TRẠNG THÁI TRỐNG (EMPTY STATE)</div>
        <div className="mt-2.5 rounded-2xl bg-[#E9FAF5] p-4 text-center">
          <Search className="mx-auto h-5 w-5 text-[#0D685E]" aria-hidden="true" />
          <p className="mt-1.5 font-bold text-[#0F172A]">Bạn chưa nhập nội dung cần kiểm tra</p>
          <p className="mt-0.5 text-[#475569]">Hãy dán tin nhắn, SĐT hoặc chọn mẫu thử 1 chạm.</p>
          <button
            type="button"
            onClick={onTryPoliceSample}
            data-screen="M08"
            data-ui="btn-m08-try-police"
            className="mt-3 rounded-2xl bg-[#0D685E] px-4 py-2 font-bold text-white"
          >
            Thử mẫu giả công an
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
        <div className="font-extrabold text-[#0D685E]">2. TRẠNG THÁI ĐANG PHÂN TÍCH (HYBRID)</div>
        <div className="mt-2.5 space-y-1.5 rounded-2xl bg-[#F4FBF8] p-3 text-[#475569]">
          <p>• Tầng 1: Luật tất định &amp; tên miền giả (&lt;50ms) — Đã xong</p>
          <p className="font-bold text-[#0D685E]">• Tầng 2: Gemini AI phân tích thao túng tâm lý...</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
        <div className="font-extrabold text-[#92400E]">3. LỖI MẤT MẠNG (OFFLINE FALLBACK)</div>
        <p className="mt-1.5 text-[#475569]">
          Mất kết nối Internet → tự chuyển sang Chế độ bảo vệ ngoại tuyến bằng luật tất định.
        </p>
        <button
          type="button"
          onClick={onToggleOffline}
          data-screen="M08"
          data-ui="btn-toggle-offline"
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E9FAF5] font-bold text-[#0D685E]"
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          {offlineMode ? 'Tắt giả lập mất mạng toàn app' : 'Bật giả lập mất mạng toàn app'}
        </button>
      </div>

      <div className="space-y-2.5 rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
        <div className="font-extrabold text-[#1E293B]">4. CHỐNG FALSE NEGATIVE &amp; 4 MỨC</div>
        <p className="text-[#475569]">
          Không bao giờ gắn nhãn &quot;100% an toàn&quot; cho số lạ chưa có trong dữ liệu.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <AlertBadge level="danger" />
          <AlertBadge level="warn" />
          <AlertBadge level="unknown" />
          <AlertBadge level="safe" />
        </div>
      </div>
    </section>
  );
}
