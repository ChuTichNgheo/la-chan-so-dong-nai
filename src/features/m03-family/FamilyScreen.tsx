'use client';

import { useState } from 'react';
import { PhoneCall, Send } from 'lucide-react';
import { maskSensitiveTarget } from '@/lib/privacy';

export function FamilyScreen() {
  const [view, setView] = useState<'sender' | 'receiver'>('sender');
  const [sent, setSent] = useState(false);

  return (
    <section className="space-y-3" data-screen="M03">
      <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
        Hỏi người thân xác minh
      </h1>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1 border border-[#CBE4DC]">
        <button
          type="button"
          onClick={() => setView('sender')}
          data-screen="M03"
          data-ui="tab-family-sender"
          className={`rounded-lg py-2 text-xs font-bold ${
            view === 'sender' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Góc nhìn Bác Tư (Gửi)
        </button>
        <button
          type="button"
          onClick={() => setView('receiver')}
          data-screen="M03"
          data-ui="tab-family-receiver"
          className={`rounded-lg py-2 text-xs font-bold ${
            view === 'receiver' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Góc nhìn Chị Lan (Nhận)
        </button>
      </div>

      {view === 'sender' ? (
        <div className="space-y-2.5 rounded-2xl border border-[#CBE4DC] bg-white p-4">
          <div className="text-xs text-[#475569]">
            Người thân ưu tiên: <strong>Chị Lan (Con gái)</strong> —{' '}
            <span className="tabular-nums font-bold">{maskSensitiveTarget('0912345678')}</span>
          </div>
          <button
            type="button"
            onClick={() => setSent(true)}
            data-screen="M03"
            data-ui="btn-confirm-send-family"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#B45309] bg-[#F59E0B] font-extrabold text-[#0F172A]"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {sent ? 'Đã gửi thẻ cảnh báo cho Chị Lan' : 'Xác nhận gửi cho Chị Lan ngay'}
          </button>
          <a
            href="tel:0912000678"
            data-screen="M03"
            data-ui="btn-call-family"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#0D685E] text-xs font-bold text-[#0D685E]"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            Gọi điện thẳng cho Chị Lan
          </a>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-[#DC2626] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
          <strong>[Cảnh báo từ Ba — Bác Tư]:</strong> Ba vừa nhận cuộc gọi giả danh công an đòi
          chuyển 50 triệu. Cần con gọi xác minh ngay!
        </div>
      )}
    </section>
  );
}
