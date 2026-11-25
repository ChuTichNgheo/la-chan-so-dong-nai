'use client';

import { useState } from 'react';
import { ClipboardPaste, Mic, PhoneCall, Search, Video } from 'lucide-react';
import type { ScreenId } from '@/types';

interface ElderlyModeProps {
  onNavigate: (screen: ScreenId) => void;
  onSpeakWithCun: () => void;
  onAnalyzeText: (text: string) => void;
}

export function ElderlyMode({
  onNavigate,
  onSpeakWithCun,
  onAnalyzeText,
}: ElderlyModeProps) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  return (
    <div className="space-y-3" data-screen="M01b">
      <p className="text-sm font-extrabold uppercase tracking-wide text-[#0D685E]">
        Chế độ Người cao tuổi 65+ • Dễ nhìn • 1 chạm
      </p>

      <button
        type="button"
        onClick={onSpeakWithCun}
        data-screen="M01b"
        data-ui="btn-noi-cun-ai"
        className="flex min-h-[96px] w-full items-center gap-3.5 rounded-2xl border-2 border-[#14B8A6] bg-gradient-to-br from-[#0D685E] to-[#09524A] p-4 text-left text-white shadow-md active:scale-[0.99]"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[#0D685E]">
          <Mic className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <div className="font-[family-name:var(--font-lexend)] text-xl font-extrabold leading-tight">
            BẤM ĐỂ NÓI VỚI CÚN AI
          </div>
          <div className="mt-1 text-sm text-[#D1FAE5]">
            Kể lại cuộc gọi lạ — Cún tự kiểm tra &amp; đọc to
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('M03')}
        data-screen="M01b"
        data-ui="btn-hoi-con-gai"
        className="flex min-h-[82px] w-full items-center gap-3.5 rounded-2xl border-2 border-[#B45309] bg-[#F59E0B] p-4 text-left text-[#0F172A] shadow-sm active:scale-[0.99]"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#0F172A] text-[#FCD34D]">
          <PhoneCall className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <div className="font-[family-name:var(--font-lexend)] text-xl font-extrabold leading-tight">
            HỎI CON GÁI NGAY
          </div>
          <div className="tabular-nums mt-0.5 text-base font-bold">Chị Lan • 0912 *** 678</div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('M05')}
          data-screen="M01b"
          data-ui="btn-xem-video"
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#0D685E] bg-white p-3 text-base font-bold text-[#0D685E]"
        >
          <Video className="h-6 w-6" aria-hidden="true" />
          <span>Xem Video</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPaste((prev) => !prev)}
          data-screen="M01b"
          data-ui="btn-toggle-paste-senior"
          className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-[#0D685E] bg-white p-3 text-base font-bold text-[#0D685E]"
        >
          <ClipboardPaste className="h-6 w-6" aria-hidden="true" />
          <span>Dán tin nhắn</span>
        </button>
      </div>

      {showPaste && (
        <div className="rounded-2xl border border-[#CBE4DC] bg-white p-3 shadow-sm">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={3}
            placeholder="Dán tin nhắn hoặc số điện thoại vào đây..."
            className="w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-base outline-none focus:border-[#0D685E]"
          />
          <button
            type="button"
            onClick={() => onAnalyzeText(pasteText)}
            data-screen="M01b"
            data-ui="btn-senior-analyze-paste"
            className="mt-2 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0D685E] font-bold text-white"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Kiểm tra tin nhắn này
          </button>
        </div>
      )}
    </div>
  );
}
