'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, Eye, EyeOff, KeyRound, ShieldAlert, Square } from 'lucide-react';

const SAFEWORD_STORAGE_KEY = 'lacd_family_safeword_v1';

interface SafeWordConfig {
  question: string;
  answer: string;
}

const DEFAULT_SAFEWORD: SafeWordConfig = {
  question: 'Tên cún cưng hoặc món ăn cả nhà thích nhất?',
  answer: 'Bông — Canh chua cá lóc',
};

const DEEPFAKE_STEPS = [
  {
    id: 'wave',
    title: '1. Yêu cầu vẫy tay ngang mặt / nghiêng đầu',
    desc: 'Video ghép mặt AI Deepfake thường bị nhòe viền, méo kính hoặc giật hình khi che mặt.',
  },
  {
    id: 'safeword',
    title: '2. Hỏi ngay Câu Mật Khẩu Bí Mật Gia Đình',
    desc: 'AI giả giọng nói hoàn hảo đến đâu cũng KHÔNG thể biết quy ước bí mật riêng của nhà bạn.',
  },
  {
    id: 'callback',
    title: '3. Cúp máy Zalo → Gọi lại số di động gốc',
    desc: 'Không bao giờ chuyển tiền vào STK tên người lạ khi chưa gọi xác nhận bằng số di động thật.',
  },
] as const;

interface FamilyDeepfakeShieldCardProps {
  onNotify: (msg: string) => void;
}

export function FamilyDeepfakeShieldCard({ onNotify }: FamilyDeepfakeShieldCardProps) {
  const [config, setConfig] = useState<SafeWordConfig>(DEFAULT_SAFEWORD);
  const [draftQ, setDraftQ] = useState(DEFAULT_SAFEWORD.question);
  const [draftA, setDraftA] = useState(DEFAULT_SAFEWORD.answer);
  const [editing, setEditing] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = window.localStorage.getItem(SAFEWORD_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SafeWordConfig>;
          if (parsed.question && parsed.answer) {
            const loaded = { question: parsed.question, answer: parsed.answer };
            setConfig(loaded);
            setDraftQ(loaded.question);
            setDraftA(loaded.answer);
          }
        }
      } catch {
        // Keep default
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function handleSaveSafeWord() {
    const q = draftQ.trim();
    const a = draftA.trim();
    if (q.length < 4 || a.length < 2) {
      onNotify('Vui lòng nhập câu hỏi và đáp án bí mật gia đình.');
      return;
    }
    const next = { question: q, answer: a };
    setConfig(next);
    try {
      window.localStorage.setItem(SAFEWORD_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage error
    }
    setEditing(false);
    onNotify('Đã lưu Mật khẩu Gia đình cục bộ trên máy (không gửi lên máy chủ).');
  }

  function toggleStep(id: string) {
    setCheckedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div className="space-y-3 rounded-3xl border border-[#CBE4DC] bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#EEF2FF] text-[#3730A3]">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0F172A]">
              Mật khẩu Gia đình &amp; Chống Deepfake
            </h2>
            <p className="text-[11px] text-[#475569]">
              Lưu riêng trên máy — chống giả giọng &amp; video AI gọi mượn tiền
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraftQ(config.question);
            setDraftA(config.answer);
            setEditing((p) => !p);
          }}
          data-screen="M03"
          data-ui="btn-edit-safeword"
          className="shrink-0 rounded-full bg-[#E9FAF5] px-3 py-1 text-[11px] font-bold text-[#0D685E]"
        >
          {editing ? 'Đóng' : 'Đặt mật khẩu'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2 rounded-2xl bg-[#F4FBF8] p-3 text-xs">
          <input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Câu hỏi chỉ gia đình biết..."
            className="w-full rounded-xl bg-white p-2.5 outline-none"
          />
          <input
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
            placeholder="Đáp án mật khẩu bí mật..."
            className="w-full rounded-xl bg-white p-2.5 outline-none"
          />
          <button
            type="button"
            onClick={handleSaveSafeWord}
            className="w-full rounded-xl bg-[#0D685E] py-2.5 font-bold text-white"
          >
            Lưu Mật khẩu Gia đình
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#F8FCFA] p-3 text-xs">
          <div className="min-w-0">
            <div className="font-bold text-[#475569]">Hỏi: {config.question}</div>
            <div className="mt-1 font-extrabold text-[#0D685E]">
              Đáp: {revealAnswer ? config.answer : '•••••••••••• (đang ẩn)'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRevealAnswer((p) => !p)}
            aria-label={revealAnswer ? 'Ẩn mật khẩu gia đình' : 'Hiện mật khẩu gia đình'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#475569] shadow-xs"
          >
            {revealAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* 3-Second Deepfake Checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#B91C1C]">
          <span className="inline-flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Kiểm tra Deepfake trong 3 giây:
          </span>
          <span className="tabular-nums text-[#0D685E]">{completedCount}/3 bước</span>
        </div>

        <div className="space-y-1.5">
          {DEEPFAKE_STEPS.map((step) => {
            const done = Boolean(checkedSteps[step.id]);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleStep(step.id)}
                className={`flex w-full items-start gap-2.5 rounded-2xl p-2.5 text-left text-xs transition ${
                  done ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#F4FBF8] text-[#0F172A]'
                }`}
              >
                {done ? (
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
                ) : (
                  <Square className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" aria-hidden="true" />
                )}
                <div>
                  <div className="font-extrabold">{step.title}</div>
                  <div className="mt-0.5 text-[11px] opacity-85">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
