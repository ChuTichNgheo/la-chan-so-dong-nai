'use client';

import { useState } from 'react';
import { ArrowRight, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { ScreenId } from '@/types';
import { CunAiSvg } from './CunAiMascot';

export type CunFlowId = 'police-family' | 'report-prefill' | 'senior-video' | 'radar-zalo';

interface CunAiSheetProps {
  open: boolean;
  offlineMode: boolean;
  onClose: () => void;
  onRunFlow: (flow: CunFlowId) => void;
  onNavigate: (screen: ScreenId) => void;
  onAnalyzeText: (text: string) => void;
}

interface ChatReply {
  question: string;
  reply: string;
  suggestedScreen?: Extract<ScreenId, 'M02' | 'M03' | 'M04' | 'M07'>;
  suggestedActionLabel?: string;
  scanText?: string;
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
    desc: 'Xem báo cáo thực tế & xuất ảnh thẻ cảnh báo khu phố',
  },
];

export function CunAiSheet({
  open,
  offlineMode,
  onClose,
  onRunFlow,
  onNavigate,
  onAnalyzeText,
}: CunAiSheetProps) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [lastChat, setLastChat] = useState<ChatReply | null>(null);

  if (!open) return null;

  async function handleAskCun(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    try {
      const res = await fetch('/api/cun-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, offline: offlineMode }),
      });
      if (res.ok) {
        const data = (await res.json()) as Omit<ChatReply, 'question'>;
        setLastChat({ question: q, ...data });
        setQuestion('');
      }
    } finally {
      setAsking(false);
    }
  }

  function handleSuggestedAction() {
    if (!lastChat?.suggestedScreen) return;
    onClose();
    if (lastChat.suggestedScreen === 'M02' && lastChat.scanText) {
      onAnalyzeText(lastChat.scanText);
      return;
    }
    onNavigate(lastChat.suggestedScreen);
  }

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
        className="max-h-[88dvh] w-full max-w-[420px] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CunAiSvg size={44} mood="listening" />
            <div>
              <h2 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0D685E]">
                Cún INFINITY nghe bác đây!
              </h2>
              <p className="text-xs text-[#475569]">
                Hỏi Cún bất kỳ tình huống nào hoặc chọn việc cần làm bên dưới.
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

        <form onSubmit={handleAskCun} className="mt-3 flex gap-1.5 rounded-2xl bg-[#F4FBF8] p-1.5">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Hỏi Cún: Số lạ gọi khóa SIM có thật không?..."
            data-screen="Shell"
            data-ui="input-cun-chat"
            className="flex-1 bg-transparent px-2.5 text-xs font-medium text-[#0F172A] outline-none placeholder:text-[#64748B]"
          />
          <button
            type="submit"
            disabled={asking}
            data-screen="Shell"
            data-ui="btn-cun-chat-send"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#0D685E] px-3 text-xs font-bold text-white"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {asking ? 'Đang hỏi...' : 'Hỏi Cún'}
          </button>
        </form>

        {lastChat && (
          <div className="mt-2.5 space-y-2 rounded-2xl bg-[#E9FAF5] p-3 text-xs">
            <div className="text-[11px] font-bold text-[#475569]">Bạn hỏi: &ldquo;{lastChat.question}&rdquo;</div>
            <div className="flex items-start gap-1.5 font-medium leading-relaxed text-[#0F172A]">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D685E]" aria-hidden="true" />
              <span>{lastChat.reply}</span>
            </div>
            {lastChat.suggestedScreen && (
              <button
                type="button"
                onClick={handleSuggestedAction}
                className="inline-flex items-center gap-1 rounded-xl bg-[#0D685E] px-3 py-1.5 text-[11px] font-extrabold text-white"
              >
                {lastChat.suggestedActionLabel || 'Mở chức năng liên quan'}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

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
              className={`w-full rounded-2xl p-2.5 text-left transition ${
                flow.highlight
                  ? 'bg-[#F59E0B] text-[#0F172A] shadow-sm'
                  : 'bg-[#F4FBF8] text-[#0F172A] hover:bg-[#E9FAF5]'
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
