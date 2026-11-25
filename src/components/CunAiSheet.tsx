'use client';

import { ShieldCheck, X } from 'lucide-react';
import { CunAiSvg } from './CunAiMascot';

export type CunFlowId = 'police-family' | 'report-prefill' | 'senior-video' | 'radar-zalo';

interface CunAiSheetProps {
  open: boolean;
  onClose: () => void;
  onRunFlow: (flow: CunFlowId) => void;
}

const FLOWS: Array<{ id: CunFlowId; label: string; desc: string; highlight?: boolean }> = [
  {
    id: 'police-family',
    label: '1. "Công an gọi đòi 50 triệu — Quét & dẫn hỏi Chị Lan"',
    desc: 'Tự quét → Đọc cảnh báo → Dừng trước nút Gửi Chị Lan',
    highlight: true,
  },
  {
    id: 'report-prefill',
    label: '2. "Dẫn sang lập Phiếu báo cáo Công an (M04)"',
    desc: 'Mở form báo cáo & kênh Công an / NCSC / Tổng đài 111',
  },
  {
    id: 'senior-video',
    label: '3. "Bật Chữ lớn 65+ & mở Video cảnh báo (M05)"',
    desc: 'Tăng cỡ chữ người cao tuổi và mở video hướng dẫn',
  },
  {
    id: 'radar-zalo',
    label: '4. "Mở Radar Đồng Nai & xem thẻ Zalo khu phố (M07)"',
    desc: 'Xem 120 báo cáo & xuất ảnh thẻ cảnh báo khu phố',
  },
];

export function CunAiSheet({ open, onClose, onRunFlow }: CunAiSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-2 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Trợ lý Cún INFINITY AI"
        className="w-full max-w-[420px] rounded-2xl border border-[#CBE4DC] bg-white p-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CunAiSvg size={44} mood="listening" />
            <div>
              <h2 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0D685E]">
                Cún INFINITY nghe bác đây!
              </h2>
              <p className="text-xs text-[#475569]">
                Chọn việc cần làm — Cún sẽ dẫn đường &amp; dừng trước bước xác nhận cuối.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trợ lý"
            className="rounded-full bg-[#F1F5F9] p-1.5 text-[#0F172A]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {FLOWS.map((flow) => (
            <button
              key={flow.id}
              type="button"
              onClick={() => {
                onClose();
                onRunFlow(flow.id);
              }}
              data-screen="Shell"
              data-ui={`btn-cun-flow-${flow.id}`}
              className={`w-full rounded-xl border p-2.5 text-left transition ${
                flow.highlight
                  ? 'border-[#B45309] bg-[#F59E0B] text-[#0F172A]'
                  : 'border-[#CBE4DC] bg-[#E9FAF5] text-[#0F172A] hover:bg-[#d7f5ec]'
              }`}
            >
              <div className="text-xs font-extrabold">{flow.label}</div>
              <div className="mt-0.5 text-[11px] opacity-85">{flow.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#475569]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0D685E]" aria-hidden="true" />
          <span>Human-in-the-Loop: Bạn luôn là người bấm xác nhận cuối</span>
        </div>
      </div>
    </div>
  );
}
