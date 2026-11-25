'use client';

import { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Copy,
  Flag,
  Globe,
  Loader2,
  MessageSquareQuote,
  PhoneCall,
  Send,
  ShieldAlert,
  Square,
  Volume2,
} from 'lucide-react';
import { AlertBadge } from '@/components/AlertBadge';
import { RISK_LEVEL_META } from '@/config/theme';
import { computePsychologyAndEscape } from '@/data/local-rules';
import { extractReportPrefill } from '@/lib/report-prefill';
import { submitNewReport } from '@/lib/report-store';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';
import type { AnalyzeResult, RiskLevel, ScreenId, UiMode } from '@/types';

interface ScannerScreenProps {
  scannedText: string;
  result: AnalyzeResult | null;
  loading: boolean;
  uiMode: UiMode;
  onNavigate: (screen: ScreenId) => void;
  onPreviewPreset: (level: RiskLevel) => void;
  onNotify: (msg: string) => void;
  onReportSubmitted?: () => void;
}

const SOURCE_LABELS: Record<AnalyzeResult['source'], string> = {
  hybrid: 'Hybrid: Luật + Gemini 3 AI',
  db: 'Cơ sở dữ liệu Đồng Nai',
  offline: 'Ngoại tuyến: Luật trên máy',
};

const HIGHLIGHT_CLASSES: Record<RiskLevel, string> = {
  danger: 'rounded bg-[#FECACA] px-1 font-extrabold text-[#991B1B]',
  warn: 'rounded bg-[#FEF3C7] px-1 font-extrabold text-[#92400E]',
  unknown: 'rounded bg-[#E2E8F0] px-1 font-bold text-[#0F172A]',
  safe: 'rounded bg-[#D1FAE5] px-1 font-extrabold text-[#065F46]',
};

function renderHighlightedSnippet(text: string, highlights: string[], level: RiskLevel) {
  if (!text) return null;
  const cleanTerms = highlights.map((t) => t.trim()).filter(Boolean);
  if (cleanTerms.length === 0) return <span>{text}</span>;

  const escaped = cleanTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  const markClass = HIGHLIGHT_CLASSES[level];

  return (
    <>
      {parts.map((part, i) => {
        const isHit = cleanTerms.some((term) => term.toLowerCase() === part.toLowerCase());
        return isHit ? (
          <mark key={i} className={markClass}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

function getBarColor(score: number): string {
  if (score >= 70) return 'bg-[#DC2626]';
  if (score >= 40) return 'bg-[#F59E0B]';
  return 'bg-[#14B8A6]';
}

export function ScannerScreen({
  scannedText,
  result,
  loading,
  uiMode,
  onNavigate,
  onPreviewPreset,
  onNotify,
  onReportSubmitted,
}: ScannerScreenProps) {
  const [speaking, setSpeaking] = useState(false);
  const [quickSending, setQuickSending] = useState(false);
  const [quickSentFor, setQuickSentFor] = useState<{ text: string; id: string } | null>(null);

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

  async function handleCopyEscape(script: string) {
    try {
      await navigator.clipboard.writeText(script);
      onNotify('Đã sao chép câu nói thoát thân an toàn!');
    } catch {
      onNotify('Hãy đọc to câu mẫu để đáp lại và cúp máy ngay!');
    }
  }

  async function handleQuickSendToAdmin() {
    if (!scannedText.trim() || quickSending) return;
    setQuickSending(true);
    try {
      const prefill = extractReportPrefill(scannedText);
      const target =
        prefill.target.trim() ||
        result?.highlights?.[0] ||
        scannedText.trim().slice(0, 60);
      const res = await submitNewReport({
        type: prefill.type,
        target,
        area: 'Đồng Nai (Tự gửi từ M02)',
        description: prefill.description || scannedText.trim().slice(0, 220),
      });
      setQuickSentFor({ text: scannedText, id: res.report.id });
      onReportSubmitted?.();
      onNotify(`Đã đẩy ${res.report.id} vào hàng chờ duyệt của Quản trị viên Đội TNTN!`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Không thể đẩy nhanh về hàng chờ duyệt.');
    } finally {
      setQuickSending(false);
    }
  }

  if (loading) {
    return (
      <section
        className="space-y-3 rounded-3xl bg-white p-5 shadow-[0_8px_28px_rgba(13,104,94,0.08)]"
        data-screen="M02"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#E9FAF5] text-[#0D685E]">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0F172A]">
              Đang kiểm tra mức độ an toàn
            </h1>
            <p className="text-[11px] text-[#64748B]">Vui lòng chờ 1–2 giây...</p>
          </div>
        </div>
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center gap-2 rounded-2xl bg-[#ECFDF5] p-3 font-bold text-[#065F46]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
            <span>Bước 1: Đối chiếu danh sách cảnh báo &amp; đường link Đồng Nai</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#F4FBF8] p-3 font-bold text-[#0D685E]">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            <span>Bước 2: AI phân tích 3 đòn tâm lý thao túng &amp; gợi ý thoát thân...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="space-y-4" data-screen="M02">
        <div className="rounded-3xl bg-white p-5 text-center shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
          <p className="text-base font-extrabold text-[#0F172A]">Chưa có nội dung kiểm tra</p>
          <p className="mt-1.5 text-xs text-[#475569]">
            Quay lại Trang chủ để dán tin nhắn hoặc chọn nhanh 1 trong 4 tình huống mẫu bên dưới.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('M01')}
            data-screen="M02"
            data-ui="btn-back-home"
            className="mt-4 rounded-2xl bg-[#0D685E] px-5 py-2.5 text-xs font-bold text-white"
          >
            Về Trang chủ
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {(['danger', 'warn', 'unknown', 'safe'] as RiskLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onPreviewPreset(lvl)}
              className="rounded-2xl bg-white px-3 py-3 text-xs font-bold text-[#0F172A] shadow-[0_4px_14px_rgba(13,104,94,0.05)]"
            >
              Thử mức: {RISK_LEVEL_META[lvl].label}
            </button>
          ))}
        </div>
      </section>
    );
  }

  const meta = RISK_LEVEL_META[result.level];
  const fallbackExtra = computePsychologyAndEscape(scannedText || result.title, result.level);
  const psych = result.psychologyMetrics ?? fallbackExtra.psychologyMetrics;
  const escapeScript = result.escapeScript ?? fallbackExtra.escapeScript;
  const showPsychCard = result.level === 'danger' || result.level === 'warn' || uiMode === 'pro';
  const showQuickAdminPush = result.level === 'danger' || result.level === 'warn';
  const alreadyPushedId = quickSentFor?.text === scannedText ? quickSentFor.id : null;

  const psychRows = [
    { label: 'Gây hoảng loạn / Đe dọa', value: psych.panic },
    { label: 'Ép chuyển tiền / Hành động gấp', value: psych.urgency },
    { label: 'Cô lập nạn nhân / Giữ bí mật', value: psych.isolation },
  ];

  return (
    <section className="space-y-4" data-screen="M02">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.05)]">
        {(['danger', 'warn', 'unknown', 'safe'] as RiskLevel[]).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onPreviewPreset(lvl)}
            data-screen="M02"
            data-ui={`tab-level-${lvl}`}
            className={`rounded-xl py-1.5 text-[11px] font-bold transition ${
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

      {/* Main Verdict Card */}
      <div className={`rounded-3xl border-2 p-4 shadow-sm ${meta.bgClass} ${meta.borderClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AlertBadge level={result.level} customLabel={result.badge} />
          {uiMode === 'pro' && (
            <span className="text-[11px] font-bold text-[#475569]">{SOURCE_LABELS[result.source]}</span>
          )}
        </div>

        <h1 className={`mt-3 font-[family-name:var(--font-lexend)] text-base font-extrabold ${meta.textClass}`}>
          {result.title}
        </h1>

        {scannedText && (
          <div className="mt-3 rounded-2xl bg-white p-3 text-xs leading-relaxed text-[#0F172A] break-words">
            {renderHighlightedSnippet(scannedText, result.highlights, result.level)}
          </div>
        )}

        {typeof result.communityMatches === 'number' && result.communityMatches > 0 && (
          <div className="mt-3 flex items-center gap-1.5 rounded-2xl bg-[#FEF2F2] p-3 text-xs font-bold text-[#991B1B]">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            Trùng {result.communityMatches} báo cáo đã được cộng đồng Đồng Nai xác minh
          </div>
        )}

        {uiMode === 'pro' && result.urlReports && result.urlReports.length > 0 && (
          <div className="mt-3 space-y-2 rounded-2xl bg-white/90 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-[#0D685E]">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              Phân tích kỹ thuật đường link (Chế độ Chuyên sâu)
            </div>
            {result.urlReports.map((u, idx) => (
              <div key={idx} className="rounded-xl bg-[#F4FBF8] p-2.5 text-[11px]">
                <div className="font-bold text-[#0F172A] break-all">
                  Tên miền: <span className="text-[#0D685E]">{u.hostname}</span>
                </div>
                {u.resolvedUrl && u.resolvedUrl !== u.originalUrl && (
                  <div className="mt-0.5 text-[#92400E] break-all">
                    Chuyển hướng thật: {u.resolvedUrl}
                  </div>
                )}
                <ul className="mt-1 space-y-0.5 text-[#475569]">
                  {u.flags.map((f, fi) => (
                    <li key={fi}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <ul className="mt-3 space-y-2 text-xs text-[#1E293B]">
          {result.reasons.map((reason, idx) => (
            <li key={idx} className="rounded-2xl bg-white p-3">
              <strong className="text-[#0D685E]">{idx + 1}.</strong> {reason}
            </li>
          ))}
        </ul>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => void handleSpeakToggle(result.speech, result.level)}
            data-screen="M02"
            data-ui="btn-speak-alert"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-extrabold text-[#0D685E] shadow-sm"
          >
            {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {speaking ? 'Dừng đọc' : 'Nghe đọc cảnh báo'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('M04')}
            data-screen="M02"
            data-ui="btn-goto-report"
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-extrabold text-[#991B1B] shadow-sm"
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            Hồ sơ Công an
          </button>
        </div>
      </div>

      {/* 3 Psychology Manipulation Bars */}
      {showPsychCard && (
        <div className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0F172A]">
              <Brain className="h-4 w-4 text-[#0D685E]" aria-hidden="true" />
              Phân tích 3 Đòn Tâm Lý Thao Túng
            </div>
            <span className="rounded-full bg-[#F4FBF8] px-2.5 py-0.5 text-[10px] font-bold text-[#0D685E]">
              AI Radar
            </span>
          </div>
          <div className="space-y-2.5">
            {psychRows.map((row) => (
              <div key={row.label} className="text-xs">
                <div className="mb-1 flex items-center justify-between font-bold">
                  <span className="text-[#334155]">{row.label}</span>
                  <span className="tabular-nums text-[#0F172A]">{row.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(row.value)}`}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safe Escape Script Card */}
      <div className="space-y-2.5 rounded-3xl border border-[#CBE4DC] bg-white p-4 shadow-[0_6px_20px_rgba(13,104,94,0.05)]">
        <div className="flex items-center gap-1.5 font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0D685E]">
          <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
          Câu nói mẫu để thoát thân an toàn
        </div>
        <blockquote className="rounded-2xl bg-[#F4FBF8] p-3 text-xs font-medium italic leading-relaxed text-[#0F172A]">
          &ldquo;{escapeScript}&rdquo;
        </blockquote>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void speakAlertVietnamese(escapeScript, 'safe')}
            data-screen="M02"
            data-ui="btn-speak-escape"
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-2xl bg-[#E9FAF5] text-xs font-extrabold text-[#0D685E]"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            Đọc to câu mẫu
          </button>
          <button
            type="button"
            onClick={() => void handleCopyEscape(escapeScript)}
            data-screen="M02"
            data-ui="btn-copy-escape"
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 text-xs font-bold text-[#0F172A]"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Sao chép câu mẫu
          </button>
        </div>
      </div>

      {/* 1-Tap Push to Admin Moderation Queue */}
      {showQuickAdminPush && (
        <button
          type="button"
          disabled={quickSending || Boolean(alreadyPushedId)}
          onClick={() => void handleQuickSendToAdmin()}
          data-screen="M02"
          data-ui="btn-quick-push-admin"
          className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-extrabold transition ${
            alreadyPushedId
              ? 'bg-[#ECFDF5] text-[#065F46]'
              : 'bg-[#0D685E] text-white shadow-[0_6px_18px_rgba(13,104,94,0.22)] hover:bg-[#09524A]'
          }`}
        >
          {alreadyPushedId ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Đã đẩy {alreadyPushedId} về hàng chờ duyệt Đội TNTN
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              {quickSending ? 'Đang gửi về Đội TNTN...' : 'Đẩy nhanh về hàng chờ duyệt Đội TNTN (1 chạm)'}
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={() => onNavigate('M03')}
        data-screen="M02"
        data-ui="btn-ask-family-cta"
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] text-sm font-extrabold text-[#0F172A] shadow-[0_6px_20px_rgba(245,158,11,0.28)]"
      >
        <PhoneCall className="h-4 w-4" aria-hidden="true" />
        Hỏi người thân ngay
      </button>
    </section>
  );
}
