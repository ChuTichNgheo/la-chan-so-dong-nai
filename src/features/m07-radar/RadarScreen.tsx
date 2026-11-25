'use client';

import { useEffect, useState } from 'react';
import { Check, Share2, X } from 'lucide-react';
import { INITIAL_MODERATION_QUEUE, INITIAL_RADAR_STATS } from '@/data/mock-radar';
import { fetchRadarReports, moderateReportStatus } from '@/lib/report-store';
import { renderZaloAlertCardDataUrl } from '@/lib/zalo-card-canvas';
import type { RadarStats, ScamReport } from '@/types';

interface RadarScreenProps {
  wideRadar: boolean;
  onToggleWide: () => void;
}

export function RadarScreen({ wideRadar, onToggleWide }: RadarScreenProps) {
  const [stats, setStats] = useState<RadarStats>(INITIAL_RADAR_STATS);
  const [queue, setQueue] = useState<ScamReport[]>(INITIAL_MODERATION_QUEUE);
  const [sourceLabel, setSourceLabel] = useState<'supabase' | 'fallback'>('fallback');
  const [zaloPreview, setZaloPreview] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchRadarReports().then((data) => {
      if (!active) return;
      setStats(data.stats);
      setQueue(data.queue);
      setSourceLabel(data.source);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleModerate(id: string, status: 'approved' | 'rejected') {
    const res = await moderateReportStatus(id, status);
    if (!res.ok) return;
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setStats((prev) => ({
      ...prev,
      totalReports: status === 'approved' ? prev.totalReports + 1 : prev.totalReports,
      pendingCount: Math.max(0, prev.pendingCount - 1),
    }));
  }

  return (
    <section className="space-y-3" data-screen="M07">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
            Radar Đội Tình nguyện
          </h1>
          <p className="text-[11px] text-[#475569]">Nguồn dữ liệu: {sourceLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleWide}
            data-screen="M07"
            data-ui="btn-toggle-desktop-radar"
            className="rounded-lg border border-[#CBE4DC] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0D685E]"
          >
            {wideRadar ? 'Thu gọn' : 'Bản rộng'}
          </button>
          <button
            type="button"
            onClick={() => setZaloPreview(renderZaloAlertCardDataUrl(stats))}
            data-screen="M07"
            data-ui="btn-zalo-export"
            className="inline-flex items-center gap-1 rounded-lg border border-[#B45309] bg-[#F59E0B] px-2.5 py-1.5 text-xs font-extrabold text-[#0F172A]"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Xuất Zalo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
        <div className="rounded-xl border border-[#CBE4DC] bg-white p-2.5">
          <div className="text-xl font-extrabold text-[#0D685E]">{stats.totalReports}</div>
          <div className="text-[11px] text-[#475569]">Báo cáo</div>
        </div>
        <div className="rounded-xl border border-[#CBE4DC] bg-white p-2.5">
          <div className="text-xl font-extrabold text-[#B91C1C]">{stats.fakeLinkPercent}%</div>
          <div className="text-[11px] text-[#475569]">Link giả</div>
        </div>
        <div className="rounded-xl border border-[#CBE4DC] bg-white p-2.5">
          <div className="text-xl font-extrabold text-[#92400E]">{stats.pendingCount}</div>
          <div className="text-[11px] text-[#475569]">Chờ duyệt</div>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-[#CBE4DC] bg-white p-3.5">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Hàng chờ xác minh (Chống vu khống)</h2>
        {queue.length === 0 ? (
          <p className="text-xs text-[#475569]">Đã duyệt hết báo cáo chờ.</p>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-xs">
              <div className="font-extrabold text-[#0D685E]">
                {item.id} • {item.type} ({item.area})
              </div>
              <div className="mt-0.5 tabular-nums font-semibold">{item.targetMasked}</div>
              <div className="mt-1 text-[#475569]">{item.description}</div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleModerate(item.id, 'approved')}
                  data-screen="M07"
                  data-ui={`btn-approve-${item.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0D685E] px-2.5 py-1 font-bold text-white"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Duyệt
                </button>
                <button
                  type="button"
                  onClick={() => void handleModerate(item.id, 'rejected')}
                  data-screen="M07"
                  data-ui={`btn-reject-${item.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#DC2626] px-2.5 py-1 font-bold text-[#991B1B]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Từ chối
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {zaloPreview && (
        <div className="rounded-2xl border border-[#CBE4DC] bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span>Ảnh thẻ cảnh báo Zalo (.png)</span>
            <button type="button" onClick={() => setZaloPreview(null)} className="text-[#475569]">
              Đóng
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zaloPreview} alt="Thẻ cảnh báo Zalo khu phố" className="w-full rounded-xl" />
        </div>
      )}
    </section>
  );
}
