'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { INITIAL_RADAR_STATS } from '@/data/mock-radar';
import { fetchRadarReports, moderateReportStatus } from '@/lib/report-store';
import {
  renderFridgeQrPosterDataUrl,
  renderZaloAlertCardDataUrl,
} from '@/lib/zalo-card-canvas';
import type {
  AppUserProfile,
  RadarBreakdownItem,
  RadarStats,
  ScamReport,
  ScreenId,
  UiMode,
} from '@/types';
import { AdminModerationPanel } from './AdminModerationPanel';
import { DONG_NAI_AREAS, DongNaiHotspotGrid } from './DongNaiHotspotGrid';
import { RadarLookupCard } from './RadarLookupCard';
import { WeeklyTrendChart } from './WeeklyTrendChart';

interface RadarScreenProps {
  wideRadar: boolean;
  uiMode: UiMode;
  trustedName: string;
  trustedPhone: string;
  currentUser: AppUserProfile | null;
  onToggleWide: () => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
  onStatsSynced?: (stats: RadarStats) => void;
}

const TONE_CLASSES: Record<RadarBreakdownItem['tone'], string> = {
  danger: 'bg-[#B91C1C]',
  primary: 'bg-[#0D685E]',
  amber: 'bg-[#F59E0B]',
  muted: 'bg-[#475569]',
};

export function RadarScreen({
  wideRadar,
  uiMode,
  trustedName,
  trustedPhone,
  currentUser,
  onToggleWide,
  onNavigate,
  onNotify,
  onStatsSynced,
}: RadarScreenProps) {
  const [stats, setStats] = useState<RadarStats>(INITIAL_RADAR_STATS);
  const [queue, setQueue] = useState<ScamReport[]>([]);
  const [recentApproved, setRecentApproved] = useState<ScamReport[]>([]);
  const [sourceLabel, setSourceLabel] = useState<'supabase' | 'fallback'>('fallback');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [tableView, setTableView] = useState(false);
  const [zaloPreview, setZaloPreview] = useState<{ url: string; title: string; filename: string } | null>(null);
  const [showFullPhoneOnPoster, setShowFullPhoneOnPoster] = useState(false);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [bulletinText, setBulletinText] = useState<string | null>(null);
  const [bulletinLoading, setBulletinLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const applyRadarData = useCallback(
    (data: Awaited<ReturnType<typeof fetchRadarReports>>) => {
      setStats(data.stats);
      setQueue(data.queue);
      setRecentApproved(data.recentApproved);
      setSourceLabel(data.source);
      onStatsSynced?.(data.stats);
    },
    [onStatsSynced]
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

  async function handleSyncedIntel(fallbackInserted?: ScamReport[]) {
    if (fallbackInserted && fallbackInserted.length > 0) {
      setQueue((prev) => [...fallbackInserted, ...prev]);
      setStats((prev) => ({ ...prev, pendingCount: prev.pendingCount + fallbackInserted.length }));
      return;
    }
    await loadData();
  }

  async function handleGenerateFridgePoster(fullPhone = showFullPhoneOnPoster) {
    setGeneratingPoster(true);
    try {
      const url = await renderFridgeQrPosterDataUrl({
        areaLabel: selectedArea || 'Đồng Nai',
        trustedName: trustedName.split('(')[0].trim() || 'Người thân',
        trustedPhone,
        showFullPhone: fullPhone,
      });
      if (url) {
        setZaloPreview({
          url,
          title: `Poster QR Dán Tủ Lạnh — ${selectedArea || 'Đồng Nai'} (.png)`,
          filename: 'poster-qr-tu-lanh-dong-nai.png',
        });
        onNotify('Đã tạo Poster QR mở thẳng Chế độ Tối giản!');
      }
    } finally {
      setGeneratingPoster(false);
    }
  }

  async function handleGenerateZaloBulletin() {
    setBulletinLoading(true);
    try {
      const res = await fetch('/api/admin/zalo-bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: selectedArea || 'Toàn tỉnh Đồng Nai',
          stats,
          recentApproved: filteredApproved,
        }),
      });
      const data = (await res.json()) as { bulletin?: string; source?: string };
      if (data.bulletin) {
        setBulletinText(data.bulletin);
        onNotify(
          data.source === 'gemini'
            ? 'Gemini AI đã soạn xong Bản tin Zalo khu phố!'
            : 'Đã tạo Bản tin Zalo khu phố chuẩn mẫu!'
        );
      }
    } catch {
      onNotify('Không thể tạo bản tin lúc này.');
    } finally {
      setBulletinLoading(false);
    }
  }

  async function handleCopyBulletin() {
    if (!bulletinText) return;
    try {
      await navigator.clipboard.writeText(bulletinText);
      onNotify('Đã sao chép Bản tin Zalo — dán ngay vào nhóm khu phố!');
    } catch {
      onNotify('Bạn hãy bôi đen và copy đoạn bản tin bên trên.');
    }
  }

  function handleExportCsv() {
    const rows = [...filteredApproved, ...filteredQueue];
    const escapeCell = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
    const header = ['Mã hồ sơ', 'Trạng thái', 'Loại thủ đoạn', 'Đối tượng (đã che)', 'Địa bàn', 'Mô tả', 'Thời gian'];
    const dataLines =
      rows.length > 0
        ? rows.map((r) =>
            [
              r.id,
              r.status === 'approved' ? 'Đã xác minh' : 'Chờ duyệt',
              r.type,
              r.targetMasked,
              r.area,
              r.description,
              r.createdAt,
            ]
              .map(escapeCell)
              .join(',')
          )
        : stats.breakdown.map((b, idx) =>
            [
              `TK-${idx + 1}`,
              'Tổng hợp',
              b.label,
              `${b.count} vụ (${b.percent}%)`,
              selectedArea || 'Đồng Nai',
              'Số liệu thống kê Radar cộng đồng',
              new Date().toISOString(),
            ]
              .map(escapeCell)
              .join(',')
          );

    const csvContent = `\uFEFF${header.map(escapeCell).join(',')}\n${dataLines.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-radar-dong-nai-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Đã xuất file báo cáo Excel (.csv) chuẩn UTF-8 cho Thành đoàn!');
  }

  const areaObj = selectedArea ? DONG_NAI_AREAS.find((a) => a.name === selectedArea) : null;
  const filteredApproved = areaObj
    ? recentApproved.filter((r) =>
        areaObj.matchKeys.some((k) => r.area.toLowerCase().includes(k))
      )
    : recentApproved;
  const filteredQueue = areaObj
    ? queue.filter((r) => areaObj.matchKeys.some((k) => r.area.toLowerCase().includes(k)))
    : queue;

  return (
    <section className="space-y-4" data-screen="M07">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <div className="text-[11px] font-extrabold uppercase text-[#0D685E]">
            Radar Đồng Nai{uiMode === 'pro' ? ` • ${sourceLabel}` : ''}
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
        </div>
      </div>

      <RadarLookupCard />

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

      {/* Interactive Đồng Nai Localities Hotspot Map/Grid */}
      <DongNaiHotspotGrid
        selectedArea={selectedArea}
        recentApproved={recentApproved}
        queue={queue}
        onSelectArea={setSelectedArea}
      />

      {/* Youth Union Outreach Toolkit (3 1-tap actions) */}
      <div className="space-y-2.5 rounded-3xl bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[#0F172A]">
            Bộ công cụ tuyên truyền Tổ CNSCĐ
          </h2>
          <span className="rounded-full bg-[#E9FAF5] px-2.5 py-0.5 text-[10px] font-bold text-[#0D685E]">
            {selectedArea || 'Toàn tỉnh'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              const url = renderZaloAlertCardDataUrl(stats, selectedArea || 'ĐỒNG NAI');
              if (url) {
                setZaloPreview({
                  url,
                  title: `Thẻ cảnh báo Zalo — ${selectedArea || 'Đồng Nai'} (.png)`,
                  filename: 'canh-bao-zalo-dong-nai.png',
                });
              }
            }}
            data-screen="M07"
            data-ui="btn-zalo-export"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#FFFBEB] p-2.5 text-center text-[11px] font-extrabold text-[#92400E] transition hover:bg-[#FEF3C7]"
          >
            <Share2 className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
            <span>Thẻ Zalo</span>
          </button>

          <button
            type="button"
            disabled={generatingPoster}
            onClick={() => void handleGenerateFridgePoster()}
            data-screen="M07"
            data-ui="btn-fridge-qr-poster"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#E9FAF5] p-2.5 text-center text-[11px] font-extrabold text-[#0D685E] transition hover:bg-[#D1FAE5]"
          >
            {generatingPoster ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <QrCode className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Poster QR nhà</span>
          </button>

          <button
            type="button"
            disabled={bulletinLoading}
            onClick={() => void handleGenerateZaloBulletin()}
            data-screen="M07"
            data-ui="btn-ai-zalo-bulletin"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#0D685E] p-2.5 text-center text-[11px] font-extrabold text-white transition hover:bg-[#09524A]"
          >
            {bulletinLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4 text-[#FCD34D]" aria-hidden="true" />
            )}
            <span>AI soạn tin Zalo</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            data-screen="M07"
            data-ui="btn-export-csv"
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-100 p-2.5 text-center text-[11px] font-extrabold text-[#0F172A] transition hover:bg-slate-200"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#059669]" aria-hidden="true" />
            <span>Xuất Excel (.csv)</span>
          </button>
        </div>
      </div>

      {/* AI Zalo Bulletin Preview */}
      {bulletinText && (
        <div className="space-y-2.5 rounded-3xl border border-[#CBE4DC] bg-white p-4 shadow-[0_8px_24px_rgba(13,104,94,0.08)]">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#0D685E]">
            <span>Bản tin Cảnh báo Tuần ({selectedArea || 'Đồng Nai'})</span>
            <button type="button" onClick={() => setBulletinText(null)} className="text-[#475569]">
              Đóng
            </button>
          </div>
          <textarea
            value={bulletinText}
            onChange={(e) => setBulletinText(e.target.value)}
            rows={7}
            className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-xs leading-relaxed text-[#0F172A] outline-none"
          />
          <button
            type="button"
            onClick={() => void handleCopyBulletin()}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] text-xs font-extrabold text-white"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Sao chép gửi ngay vào nhóm Zalo khu phố
          </button>
        </div>
      )}

      {/* PNG Preview (Zalo Card or Fridge QR Poster) */}
      {zaloPreview && (
        <div className="space-y-2.5 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(13,104,94,0.1)]">
          <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-[#0D685E]">
            <span className="truncate">{zaloPreview.title}</span>
            <button type="button" onClick={() => setZaloPreview(null)} className="shrink-0 text-[#475569]">
              Đóng
            </button>
          </div>
          {zaloPreview.filename.includes('poster-qr') && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#F4FBF8] px-3 py-2 text-[11px] font-bold text-[#0F172A]">
              <input
                type="checkbox"
                checked={showFullPhoneOnPoster}
                onChange={(e) => {
                  const next = e.target.checked;
                  setShowFullPhoneOnPoster(next);
                  void handleGenerateFridgePoster(next);
                }}
                className="h-4 w-4 accent-[#0D685E]"
              />
              Hiện đủ 10 số SĐT người thân khi in dán trong nhà (mặc định che SĐT)
            </label>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zaloPreview.url} alt={zaloPreview.title} className="w-full rounded-2xl border border-slate-100" />
          <a
            href={zaloPreview.url}
            download={zaloPreview.filename}
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] text-xs font-bold text-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Tải ảnh (.png) để in hoặc gửi nhóm Zalo
          </a>
        </div>
      )}

      <div className={wideRadar ? 'grid grid-cols-2 items-start gap-3.5' : 'space-y-3.5'}>
        <div className="space-y-3.5">
          <WeeklyTrendChart stats={stats} />
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

          <div className="rounded-3xl bg-white p-4 text-xs shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
            <h2 className="mb-2.5 font-extrabold text-[#991B1B]">
              Cảnh báo đã xác minh mới nhất {selectedArea ? `(${selectedArea})` : ''}
            </h2>
            {filteredApproved.length === 0 ? (
              <p className="text-[#475569]">
                Chưa có báo cáo mới được duyệt riêng tại {selectedArea || 'khu vực này'}.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredApproved.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[#FEF2F2] p-2.5 text-[#991B1B]">
                    <strong>{item.type}</strong> ({item.area}):{' '}
                    <span className="tabular-nums font-bold">{item.targetMasked}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {currentUser?.role === 'admin' ? (
          <AdminModerationPanel
            queue={filteredQueue}
            onModerate={handleModerate}
            onSyncedIntel={handleSyncedIntel}
            onNotify={onNotify}
          />
        ) : (
          <div className="rounded-3xl bg-[#E9FAF5] p-4 text-xs">
            <div className="flex items-center gap-2 font-extrabold text-[#0D685E]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Khu vực kiểm duyệt &amp; Đồng bộ AI dành cho Đội TNTN
            </div>
            <p className="mt-1.5 leading-relaxed text-[#475569]">
              Người dân xem được số liệu, bản đồ điểm nóng và công cụ tạo Poster QR / Bản tin Zalo.
              Đăng nhập Quản trị (<code>doantn</code>) để tự động quét tin RSS+AI, duyệt báo cáo và
              thêm luật chặn nóng.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('M09')}
              data-screen="M07"
              data-ui="btn-goto-admin-login"
              className="mt-3 rounded-2xl bg-[#0D685E] px-4 py-2.5 font-bold text-white"
            >
              Đăng nhập Quản trị (Cài đặt)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
