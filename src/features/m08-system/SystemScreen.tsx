'use client';

import { WifiOff } from 'lucide-react';
import { AlertBadge } from '@/components/AlertBadge';

interface SystemScreenProps {
  offlineMode: boolean;
  onToggleOffline: () => void;
}

export function SystemScreen({ offlineMode, onToggleOffline }: SystemScreenProps) {
  return (
    <section className="space-y-3" data-screen="M08">
      <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
        Trạng thái Hệ thống &amp; An toàn
      </h1>

      <div className="rounded-2xl border border-[#CBE4DC] bg-white p-3.5 text-xs">
        <div className="font-extrabold text-[#92400E]">OFFLINE FALLBACK</div>
        <p className="mt-1 text-[#475569]">
          Khi mất mạng hoặc API quá tải, hệ thống tự chuyển về Tầng 1 luật tất định (&lt;50ms).
        </p>
        <button
          type="button"
          onClick={onToggleOffline}
          data-screen="M08"
          data-ui="btn-toggle-offline"
          className="mt-2.5 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#0D685E] font-bold text-[#0D685E]"
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          {offlineMode ? 'Tắt giả lập mất mạng' : 'Bật giả lập mất mạng toàn app'}
        </button>
      </div>

      <div className="rounded-2xl border border-[#CBE4DC] bg-white p-3.5 text-xs space-y-2">
        <div className="font-extrabold text-[#1E293B]">ANTI-FALSE-NEGATIVE (4 MỨC)</div>
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
