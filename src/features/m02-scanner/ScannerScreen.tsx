'use client';

import { useState } from 'react';
import { Flag, PhoneCall, Square, Volume2 } from 'lucide-react';
import { AlertBadge } from '@/components/AlertBadge';
import { RISK_LEVEL_META } from '@/config/theme';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';
import type { AnalyzeResult, RiskLevel, ScreenId } from '@/types';

interface ScannerScreenProps {
  scannedText: string;
  result: AnalyzeResult | null;
  loading: boolean;
  onNavigate: (screen: ScreenId) => void;
  onPreviewPreset: (level: RiskLevel) => void;
}

const SOURCE_LABELS: Record<AnalyzeResult['source'], string> = {
  hybrid: 'Hybrid: Luật + Gemini AI',
  db: 'Cơ sở dữ liệu Đồng Nai',
  offline: 'Ngoại tuyến: Tầng 1 Luật tất định',
};

function renderHighlightedSnippet(text: string, highlights: string[]) {
  if (!text) return null;
  const cleanTerms = highlights.map((t) => t.trim()).filter(Boolean);
  if (cleanTerms.length === 0) return <span>{text}</span>;

  const escaped = cleanTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isHit = cleanTerms.some((term) => term.toLowerCase() === part.toLowerCase());
        return isHit ? (
          <mark
            key={i}
            className="rounded bg-[#FECACA] px-1 font-extrabold text-[#991B1B]"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

export function ScannerScreen({
  scannedText,
  result,
  loading,
  onNavigate,
  onPreviewPreset,
}: ScannerScreenProps) {
  const [speaking, setSpeaking] = useState(false);

  async function handleSpeakToggle(speechText: string, level: RiskLevel) {
    if (speaking) {
      stopVietnameseSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await speakAlertVietnamese(speechText, level);
    setTimeout(() => setSpeaking(false), 6000);
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#CBE4DC] bg-white p-4 shadow-sm" data-screen="M02">
        <h1 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0D685E]">
          Đang đối chiếu 2 tầng bảo vệ...
        </h1>
        <div className="mt-2.5 space-y-1.5 text-xs text-[#475569]">
          <p>• Tầng 1: Luật tất định &amp; danh sách báo cáo đã duyệt (&lt;50ms) — Đang kiểm</p>
          <p className="font-semibold text-[#0D685E]">
            • Tầng 2: Gemini AI phân tích dấu hiệu thao túng tâm lý...
          </p>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="space-y-3" data-screen="M02">
        <div className="rounded-2xl border border-[#CBE4DC] bg-white p-4 text-center">
          <p className="text-sm font-extrabold text-[#0F172A]">Chưa có nội dung kiểm tra</p>
          <p className="mt-1 text-xs text-[#475569]">
            Quay lại Trang chủ (M01) để dán tin nhắn, SĐT hoặc chọn xem thử 4 mức cảnh báo bên dưới.
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
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['danger', 'warn', 'unknown', 'safe'] as RiskLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onPreviewPreset(lvl)}
              className="rounded-xl border border-[#CBE4DC] bg-white px-3 py-2 text-xs font-bold text-[#0F172A]"
            >
              Thử mức: {RISK_LEVEL_META[lvl].label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  const meta = RISK_LEVEL_META[result.level];

  return (
    <section className="space-y-3" data-screen="M02">
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-[#CBE4DC] bg-white p-1">
        {(['danger', 'warn', 'unknown', 'safe'] as RiskLevel[]).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onPreviewPreset(lvl)}
            data-screen="M02"
            data-ui={`tab-level-${lvl}`}
            className={`rounded-lg py-1.5 text-[11px] font-bold transition ${
              result.level === lvl ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
            }`}
          >
            {lvl === 'danger'
              ? 'Nguy hiểm'
              : lvl === 'warn'
              ? 'Nghi ngờ'
              : lvl === 'unknown'
              ? 'Chưa rõ'
              : 'Xác thực'}
          </button>
        ))}
      </div>

      <div className={`rounded-2xl border-2 p-4 shadow-sm ${meta.bgClass} ${meta.borderClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AlertBadge level={result.level} customLabel={result.badge} />
          <span className="text-[11px] font-bold text-[#475569]">{SOURCE_LABELS[result.source]}</span>
        </div>

        <h1 className={`mt-2.5 font-[family-name:var(--font-lexend)] text-base font-extrabold ${meta.textClass}`}>
          {result.title}
        </h1>

        {scannedText && (
          <div className="mt-2.5 rounded-xl border border-[#CBE4DC] bg-white p-2.5 text-xs leading-relaxed text-[#0F172A]">
            {renderHighlightedSnippet(scannedText, result.highlights)}
          </div>
        )}

        <ul className="mt-2.5 space-y-1.5 text-xs text-[#1E293B]">
          {result.reasons.map((reason, idx) => (
            <li key={idx} className="rounded-xl border border-[#CBE4DC] bg-white p-2.5">
              <strong className="text-[#0D685E]">{idx + 1}.</strong> {reason}
            </li>
          ))}
        </ul>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleSpeakToggle(result.speech, result.level)}
            data-screen="M02"
            data-ui="btn-speak-alert"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#0D685E] bg-white px-3 text-xs font-extrabold text-[#0D685E]"
          >
            {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {speaking ? 'Dừng đọc' : 'Nghe đọc cảnh báo'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('M04')}
            data-screen="M02"
            data-ui="btn-goto-report"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#DC2626] bg-white px-3 text-xs font-extrabold text-[#991B1B]"
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
        className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#B45309] bg-[#F59E0B] text-sm font-extrabold text-[#0F172A] shadow-sm"
      >
        <PhoneCall className="h-4 w-4" aria-hidden="true" />
        Hỏi người thân ngay (Cún AI dừng chờ bạn bấm)
      </button>
    </section>
  );
}
