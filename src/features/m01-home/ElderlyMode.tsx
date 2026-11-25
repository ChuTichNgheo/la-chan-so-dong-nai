'use client';

import { Mic, PhoneCall, Video } from 'lucide-react';
import type { ScreenId } from '@/types';

interface ElderlyModeProps {
  onNavigate: (screen: ScreenId) => void;
  onQuickAnalyzePolice: () => void;
}

export function ElderlyMode({ onNavigate, onQuickAnalyzePolice }: ElderlyModeProps) {
  return (
    <div className="space-y-3" data-screen="M01b">
      <p className="text-xs font-extrabold uppercase tracking-wide text-[#0D685E]">
        Chế độ Người cao tuổi 65+ • Dễ nhìn • 1 chạm
      </p>

      <button
        type="button"
        onClick={onQuickAnalyzePolice}
        data-screen="M01b"
        data-ui="btn-noi-cun-ai"
        className="flex min-h-[92px] w-full items-center gap-3 rounded-2xl border-2 border-[#14B8A6] bg-[#0D685E] p-4 text-left text-white shadow-md"
      >
        <Mic className="h-8 w-8 shrink-0" aria-hidden="true" />
        <div>
          <div className="font-[family-name:var(--font-lexend)] text-lg font-extrabold">
            BẤM ĐỂ NÓI VỚI CÚN AI
          </div>
          <div className="text-sm text-[#D1FAE5]">Kể cuộc gọi lạ — Cún kiểm tra &amp; đọc to</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('M03')}
        data-screen="M01b"
        data-ui="btn-hoi-con-gai"
        className="flex min-h-[78px] w-full items-center gap-3 rounded-2xl border-2 border-[#B45309] bg-[#F59E0B] p-4 text-left text-[#0F172A] shadow-sm"
      >
        <PhoneCall className="h-7 w-7 shrink-0" aria-hidden="true" />
        <div>
          <div className="font-[family-name:var(--font-lexend)] text-lg font-extrabold">
            HỎI CON GÁI NGAY
          </div>
          <div className="tabular-nums text-sm font-bold">Chị Lan • 0912 *** 678</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('M05')}
        data-screen="M01b"
        data-ui="btn-xem-video"
        className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#0D685E] bg-white p-3 font-bold text-[#0D685E]"
      >
        <Video className="h-6 w-6" aria-hidden="true" />
        <span>Xem Video cảnh báo</span>
      </button>
    </div>
  );
}
