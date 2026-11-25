'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, Share2, ShieldCheck } from 'lucide-react';
import { INITIAL_RADAR_STATS } from '@/data/mock-radar';
import { fetchRadarReports, moderateReportStatus } from '@/lib/report-store';
import { renderZaloAlertCardDataUrl } from '@/lib/zalo-card-canvas';
import type { AppUserProfile, RadarBreakdownItem, RadarStats, ScamReport, ScreenId } from '@/types';
import { AdminModerationPanel } from './AdminModerationPanel';

interface RadarScreenProps {
  wideRadar: boolean;
  currentUser: AppUserProfile | null;
  onToggleWide: () => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

const TONE_CLASSES: Record<RadarBreakdownItem['tone'], string> = {
  danger: 'bg-[#B91C1C]',
  primary: 'bg-[#0D685E]',
  amber: 'bg-[#F59E0B]',
  muted: 'bg-[#475569]',
};

export function RadarScreen({
  wideRadar,
  currentUser,
  onToggleWide,
  onNavigate,
  onNotify,
}: RadarScreenProps) {
  const [stats, setStats] = useState<RadarStats>(INITIAL_RADAR_STATS);
  const [queue, setQueue] = useState<ScamReport[]>([]);
  const [recentApproved, setRecentApproved] = useState<ScamReport[]>([]);
  const [sourceLabel, setSourceLabel] = useState<'supabase' | 'fallback'>('fallback');
  const [tableView, setTableView] = useState(false);
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
  }, [applyRadarData, currentUser?.id]);

  async function handleModerate(id: string, status: 'approved' | 'rejected') {
    const res = await moderateReportStatus(id, status);
    if (!res.ok) {
      onNotify(res.error || 'Bạn cần đăng nhập Quản trị viên để duyệt.');
      return;
    }
    onNotify(status === 'approved' ? `Đã duyệt ${id} công khai!` : `Đã từ chối ${id}.`);
    await loadData();
  }

  return (
    <section className="space-y-4" data-screen="M07">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <div className="text-[11px] font-extrabold uppercase text-[#0D685E]">
            Radar Đồng Nai • {sourceLabel}
          </div>
          <h1 className="font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
            Cảnh báo Cộng đồng
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void loadData()}
            aria-label="Làm mới số liệu"
            className="rounded-full bg-white p-2 text-[#0D685E] shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onToggleWide}
            data-screen="M07"
            data-ui="btn-toggle-desktop-radar"
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0D685E] shadow-sm"
          >
            {wideRadar ? 'Thu gọn' : 'Bản rộng'}
          </button>
          <button
            type="button"
            onClick={() => setZaloPreview(renderZaloAlertCardDataUrl(stats))}
            data-screen="M07"
            data-ui="btn-zalo-export"
            className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B] px-3 py-1.5 text-xs font-extrabold text-[#0F172A] shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Xuất Zalo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center tabular-nums">
        <div className="rounded-3xl bg-white p-3 shadow-[0_4px_18px_rgba(13,104,94,0.06)]">
          <div className="text-2xl font-extrabold text-[#0D685E]">{stats.totalReports}</div>
          <div className="text-[11px] text-[#475569]">Đã xác minh</div>
        </div>
        <div className="rounded-3xl bg-white p-3 shadow-[0_4px_18px_rgba(13,104,94,0.06)]">
          <div className="text-2xl font-extrabold text-[#B91C1C]">{stats.fakeLinkPercent}%</div>
          <div className="text-[11px] text-[#475569]">Đường dẫn giả</div>
        </div>
        <div className="rounded-3xl bg-white p-3 shadow-[0_4px_18px_rgba(13,104,94,0.06)]">
          <div className="text-2xl font-extrabold text-[#92400E]">{stats.pendingCount}</div>
          <div className="text-[11px] text-[#475569]">Chờ xác minh</div>
        </div>
      </div>

      <div className={wideRadar ? 'grid grid-cols-2 items-start gap-3.5' : 'space-y-3.5'}>
        <div className="space-y-3.5">
          <div className="rounded-3xl bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#0F172A]">Phân bố thủ đoạn</h2>
              <button
                type="button"
                onClick={() => setTableView((v) => !v)}
                className="rounded-full bg-[#E9FAF5] px-3 py-1 text-[11px] font-bold text-[#0D685E]"
              >
                {tableView ? 'Xem biểu đồ' : 'Xem dạng bảng'}
              </button>
            </div>
            {!tableView ? (
              <div className="space-y-3">
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
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-1.5">Thủ đoạn</th>
                    <th className="py-1.5">Lượt</th>
                    <th className="py-1.5">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.breakdown.map((row) => (
                    <tr key={row.label} className="border-b border-slate-100">
                      <td className="py-2 pr-2">{row.label}</td>
                      <td className="py-2">{row.count}</td>
                      <td className="py-2 font-bold">{row.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {recentApproved.length > 0 && (
            <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
              <h2 className="mb-2.5 font-extrabold text-[#991B1B]">Cảnh báo đã xác minh mới nhất</h2>
              <div className="space-y-2">
                {recentApproved.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[#FEF2F2] p-2.5 text-[#991B1B]">
                    <strong>{item.type}</strong> ({item.area}):{' '}
                    <span className="tabular-nums font-bold">{item.targetMasked}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {currentUser?.role === 'admin' ? (
          <AdminModerationPanel
            queue={queue}
            onModerate={handleModerate}
            onNotify={onNotify}
          />
        ) : (
          <div className="rounded-3xl bg-[#E9FAF5] p-4 text-xs">
            <div className="flex items-center gap-2 font-extrabold text-[#0D685E]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Khu vực kiểm duyệt dành cho Quản trị Đội TNTN
            </div>
            <p className="mt-1.5 leading-relaxed text-[#475569]">
              Người dân xem được số liệu và cảnh báo đã xác minh. Để duyệt báo cáo hoặc thêm luật
              chặn nóng, vui lòng đăng nhập tài khoản Quản trị.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('M09')}
              data-screen="M07"
              data-ui="btn-goto-admin-login"
              className="mt-3 rounded-2xl bg-[#0D685E] px-4 py-2.5 font-bold text-white"
            >
              Đăng nhập Quản trị (M09)
            </button>
          </div>
        )}
      </div>

      {zaloPreview && (
        <div className="space-y-2.5 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(13,104,94,0.1)]">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#0D685E]">
            <span>Thẻ cảnh báo Zalo Khu phố (.png)</span>
            <button type="button" onClick={() => setZaloPreview(null)} className="text-[#475569]">
              Đóng
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zaloPreview} alt="Thẻ cảnh báo Zalo khu phố" className="w-full rounded-2xl" />
          <a
            href={zaloPreview}
            download="canh-bao-zalo-dong-nai.png"
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] text-xs font-bold text-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Tải ảnh thẻ (.png) gửi nhóm Zalo
          </a>
        </div>
      )}
    </section>
  );
}
