'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import type { DynamicRule, RiskLevel, ScamReport, UrlInspectionReport } from '@/types';

interface LookupResponse {
  query: string;
  matches: ScamReport[];
  pendingMatches: number;
  dynamicRules: DynamicRule[];
  urlReports: UrlInspectionReport[];
  layerOneLevel: RiskLevel;
  areaSummary: Array<{ area: string; count: number }>;
}

export function RadarLookupCard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [result, setResult] = useState<LookupResponse | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setLookupError('Vui lòng nhập SĐT, STK hoặc đường link cần tra cứu.');
      return;
    }
    setLookupError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/lookup?q=${encodeURIComponent(trimmed)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        setResult((await res.json()) as LookupResponse);
      }
    } finally {
      setLoading(false);
    }
  }

  const totalHits = (result?.matches.length ?? 0) + (result?.dynamicRules.length ?? 0);
  const urlDanger = result?.urlReports.some((u) => u.risk === 'danger');

  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.07)]">
      <div>
        <div className="text-[11px] font-extrabold uppercase text-[#0D685E]">
          Tra cứu trước khi chuyển tiền
        </div>
        <h2 className="font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0F172A]">
          Kiểm tra SĐT, STK ngân hàng hoặc Đường link
        </h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (lookupError) setLookupError('');
          }}
          placeholder="Nhập SĐT, STK hoặc link..."
          data-screen="M07"
          data-ui="input-radar-lookup"
          className="min-w-0 flex-1 rounded-2xl bg-[#F4FBF8] px-3.5 py-2.5 text-xs font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0D685E]"
        />
        <button
          type="submit"
          disabled={loading}
          data-screen="M07"
          data-ui="btn-radar-lookup"
          className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-[#0D685E] px-4 py-2.5 text-xs font-extrabold text-white"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          {loading ? 'Đang tìm...' : 'Tra cứu'}
        </button>
      </form>

      {lookupError && <p className="text-[11px] font-bold text-[#B91C1C]">{lookupError}</p>}

      {result && (
        <div className="space-y-2 text-xs">
          {totalHits > 0 || urlDanger || result.layerOneLevel === 'danger' ? (
            <div className="rounded-2xl bg-[#FEF2F2] p-3 text-[#991B1B]">
              <div className="flex items-center gap-1.5 font-extrabold">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                CẢNH BÁO: Đã có {result.matches.length} tố cáo xác minh &amp; {result.dynamicRules.length} luật chặn!
              </div>
              {result.matches.map((m) => (
                <div key={m.id} className="mt-1.5 rounded-xl bg-white p-2 text-[11px] text-[#0F172A]">
                  <strong>{m.type}</strong> ({m.area}) • {m.description}
                </div>
              ))}
              {result.dynamicRules.map((r) => (
                <div key={r.id} className="mt-1.5 rounded-xl bg-white p-2 text-[11px] text-[#991B1B]">
                  <strong>Luật nóng ({r.pattern}):</strong> {r.note}
                </div>
              ))}
            </div>
          ) : result.pendingMatches > 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-[#FFFBEB] p-3 font-bold text-[#92400E]">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Đang có {result.pendingMatches} báo cáo chờ Đội TNTN xác minh khớp từ khóa này — hãy cẩn trọng!
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl bg-[#ECFDF5] p-3 font-bold text-[#065F46]">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Chưa có báo cáo lừa đảo trùng khớp. Lưu ý: KHÔNG đồng nghĩa an toàn 100%, vẫn cần kiểm tra kỹ!
            </div>
          )}

          {result.areaSummary.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="font-bold text-[#475569]">Địa bàn ghi nhận thực tế:</span>
              {result.areaSummary.map((a) => (
                <span key={a.area} className="rounded-full bg-[#E9FAF5] px-2.5 py-0.5 font-bold text-[#0D685E]">
                  {a.area}: {a.count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
