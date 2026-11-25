'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Download, KeyRound, RefreshCw, Share2, X } from 'lucide-react';
import { INITIAL_MODERATION_QUEUE, INITIAL_RADAR_STATS } from '@/data/mock-radar';
import { fetchRadarReports, moderateReportStatus } from '@/lib/report-store';
import { renderZaloAlertCardDataUrl } from '@/lib/zalo-card-canvas';
import type { RadarBreakdownItem, RadarStats, ScamReport } from '@/types';

interface RadarScreenProps {
  wideRadar: boolean;
  onToggleWide: () => void;
  onNotify: (msg: string) => void;
}

const TONE_CLASSES: Record<RadarBreakdownItem['tone'], string> = {
  danger: 'bg-[#B91C1C]',
  primary: 'bg-[#0D685E]',
  amber: 'bg-[#F59E0B]',
  muted: 'bg-[#475569]',
};

export function RadarScreen({ wideRadar, onToggleWide, onNotify }: RadarScreenProps) {
  const [stats, setStats] = useState<RadarStats>(INITIAL_RADAR_STATS);
  const [queue, setQueue] = useState<ScamReport[]>(INITIAL_MODERATION_QUEUE);
  const [recentApproved, setRecentApproved] = useState<ScamReport[]>([]);
  const [sourceLabel, setSourceLabel] = useState<'supabase' | 'fallback'>('fallback');
  const [tableView, setTableView] = useState(false);
  const [pin, setPin] = useState('1234');
  const [zaloPreview, setZaloPreview] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const applyRadarData = useCallback(
    (data: Awaited<ReturnType<typeof fetchRadarReports>>) => {
      setStats(data.stats);
      setQueue(data.queue);
      setRecentApproved(data.recentApproved);
      setSourceLabel(data.source);
    },
    []
  );

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchRadarReports();
    applyRadarData(data);
    setRefreshing(false);
  }, [applyRadarData]);

  useEffect(() => {
    let active = true;
    void fetchRadarReports().then((data) => {
      if (!active) return;
      applyRadarData(data);
    });
    return () => {
      active = false;
    };
  }, [applyRadarData]);

  async function handleModerate(id: string, status: 'approved' | 'rejected') {
    const res = await moderateReportStatus(id, status, pin);
    if (!res.ok) {
      onNotify('Sai mã PIN Đoàn viên! Kiểm tra lại mã PIN (mặc định 1234).');
      return;
    }
    onNotify(
      status === 'approved'
        ? `Đã duyệt ${id} — Cập nhật số liệu công khai!`
        : `Đã từ chối báo cáo ${id}.`
    );
    await loadData();
  }

  return (
    <section className="space-y-3" data-screen="M07">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-extrabold uppercase text-[#0D685E]">
            Đội TNTN Đồng Nai • Nguồn: {sourceLabel}
          </div>
          <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0F172A]">
            Radar Cảnh báo Địa phương
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void loadData()}
            aria-label="Làm mới số liệu"
            className="rounded-lg border border-[#CBE4DC] bg-white p-1.5 text-[#0D685E]"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
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
          <div className="text-2xl font-extrabold text-[#0D685E]">{stats.totalReports}</div>
          <div className="text-[11px] text-[#475569]">Báo cáo tháng 11</div>
        </div>
        <div className="rounded-xl border border-[#CBE4DC] bg-white p-2.5">
          <div className="text-2xl font-extrabold text-[#B91C1C]">{stats.fakeLinkPercent}%</div>
          <div className="text-[11px] text-[#475569]">Đường dẫn giả</div>
        </div>
        <div className="rounded-xl border border-[#CBE4DC] bg-white p-2.5">
          <div className="text-2xl font-extrabold text-[#92400E]">{stats.pendingCount}</div>
          <div className="text-[11px] text-[#475569]">Chờ xác minh</div>
        </div>
      </div>

      <div className={wideRadar ? 'grid grid-cols-2 gap-3 items-start' : 'space-y-3'}>
        <div className="rounded-2xl border border-[#CBE4DC] bg-white p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0F172A]">Phân bố thủ đoạn</h2>
            <button
              type="button"
              onClick={() => setTableView((v) => !v)}
              className="rounded-full bg-[#E9FAF5] px-2.5 py-1 text-[11px] font-bold text-[#0D685E]"
            >
              {tableView ? 'Xem biểu đồ' : 'Xem dạng bảng'}
            </button>
          </div>

          {!tableView ? (
            <div className="space-y-2.5">
              {stats.breakdown.map((row) => (
                <div key={row.label} className="text-xs">
                  <div className="mb-1 flex justify-between gap-2 font-semibold">
                    <span>{row.label}</span>
                    <span className="tabular-nums font-bold">
                      {row.percent}% ({row.count})
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className={`h-full rounded-full ${TONE_CLASSES[row.tone]}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-xs tabular-nums">
              <thead>
                <tr className="border-b-2 border-[#CBE4DC] text-left">
                  <th className="py-1.5">Thủ đoạn</th>
                  <th className="py-1.5">Số lượt</th>
                  <th className="py-1.5">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {stats.breakdown.map((row) => (
                  <tr key={row.label} className="border-b border-[#CBE4DC]">
                    <td className="py-1.5 pr-2">{row.label}</td>
                    <td className="py-1.5">{row.count}</td>
                    <td className="py-1.5 font-bold">{row.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-2.5 rounded-2xl border border-[#CBE4DC] bg-white p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-[#0F172A]">
              Hàng chờ xác minh ({queue.length})
            </h2>
            <label className="inline-flex items-center gap-1 rounded-lg border border-[#CBE4DC] bg-[#F4FBF8] px-2 py-1 text-[11px] font-bold text-[#0D685E]">
              <KeyRound className="h-3 w-3" aria-hidden="true" />
              PIN:
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                aria-label="Mã PIN Đoàn viên"
                className="w-12 bg-transparent text-xs outline-none tabular-nums"
              />
            </label>
          </div>

          {queue.length === 0 ? (
            <p className="text-xs text-[#475569]">Đã duyệt hết báo cáo chờ.</p>
          ) : (
            queue.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-xs">
                <div className="font-extrabold text-[#0D685E]">
                  {item.id} • {item.type} ({item.area})
                </div>
                <div className="tabular-nums mt-0.5 font-bold">{item.targetMasked}</div>
                <div className="mt-1 text-[#475569]">{item.description}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleModerate(item.id, 'approved')}
                    data-screen="M07"
                    data-ui={`btn-approve-${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0D685E] px-2.5 py-1.5 font-bold text-white"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleModerate(item.id, 'rejected')}
                    data-screen="M07"
                    data-ui={`btn-reject-${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#DC2626] bg-white px-2.5 py-1.5 font-bold text-[#991B1B]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Từ chối
                  </button>
                </div>
              </div>
            ))
          )}

          {recentApproved.length > 0 && (
            <div className="border-t border-[#CBE4DC] pt-2 text-[11px] text-[#065F46]">
              <strong>Đã công khai mới nhất:</strong>{' '}
              {recentApproved.map((r) => `${r.id} (${r.targetMasked})`).join(', ')}
            </div>
          )}
        </div>
      </div>

      {zaloPreview && (
        <div className="space-y-2 rounded-2xl border-2 border-[#0D685E] bg-white p-3.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#0D685E]">
            <span>Thẻ cảnh báo Zalo Khu phố (.png)</span>
            <button type="button" onClick={() => setZaloPreview(null)} className="text-[#475569]">
              Đóng
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zaloPreview} alt="Thẻ cảnh báo Zalo khu phố" className="w-full rounded-xl" />
          <a
            href={zaloPreview}
            download="canh-bao-zalo-dong-nai.png"
            className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#0D685E] text-xs font-bold text-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Tải ảnh thẻ (.png) gửi nhóm Zalo
          </a>
        </div>
      )}
    </section>
  );
}
