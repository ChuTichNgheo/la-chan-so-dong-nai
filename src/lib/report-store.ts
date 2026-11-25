import { INITIAL_MODERATION_QUEUE, INITIAL_RADAR_STATS } from '@/data/mock-radar';
import { maskSensitiveTarget } from '@/lib/privacy';
import type { CreateReportPayload, ReportsApiResponse, ReportStatus, ScamReport } from '@/types';

const STORAGE_KEY = 'lacd_reports_fallback_v1';

function readLocalQueue(): ScamReport[] {
  if (typeof window === 'undefined') return INITIAL_MODERATION_QUEUE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_MODERATION_QUEUE;
    const parsed = JSON.parse(raw) as ScamReport[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MODERATION_QUEUE;
  } catch {
    return INITIAL_MODERATION_QUEUE;
  }
}

function writeLocalQueue(items: ScamReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota issues
  }
}

export async function fetchRadarReports(): Promise<ReportsApiResponse> {
  try {
    const res = await fetch('/api/reports', { cache: 'no-store' });
    if (res.ok) {
      return (await res.json()) as ReportsApiResponse;
    }
  } catch {
    // Fall back to local cache below
  }

  const all = readLocalQueue();
  const pending = all.filter((item) => item.status === 'pending');
  const approved = all.filter((item) => item.status === 'approved');

  return {
    stats: {
      ...INITIAL_RADAR_STATS,
      totalReports: INITIAL_RADAR_STATS.totalReports + approved.length,
      pendingCount: pending.length,
    },
    queue: pending,
    recentApproved: approved,
    source: 'fallback',
  };
}

export async function submitNewReport(
  payload: CreateReportPayload
): Promise<{ report: ScamReport; source: 'supabase' | 'fallback'; error?: string }> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return (await res.json()) as { report: ScamReport; source: 'supabase' | 'fallback' };
    }
    const err = (await res.json()) as { error?: string };
    if (res.status === 403) {
      throw new Error(err.error || 'Tài khoản bị khóa gửi báo cáo.');
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('khóa')) {
      throw e;
    }
  }

  const all = readLocalQueue();
  const nextReport: ScamReport = {
    id: `RP-${Math.floor(124 + Math.random() * 800)}`,
    type: payload.type,
    target: payload.target,
    targetMasked: maskSensitiveTarget(payload.target),
    area: payload.area,
    description: payload.description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  writeLocalQueue([nextReport, ...all]);
  return { report: nextReport, source: 'fallback' };
}

export async function moderateReportStatus(
  id: string,
  status: Exclude<ReportStatus, 'pending'>
): Promise<{ ok: boolean; error?: string; source: 'supabase' | 'fallback' }> {
  try {
    const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      return { ok: true, source: 'supabase' };
    }
    const err = (await res.json()) as { error?: string };
    return { ok: false, error: err.error || 'Không có quyền duyệt.', source: 'supabase' };
  } catch {
    return { ok: false, error: 'Lỗi mạng khi gọi API duyệt.', source: 'fallback' };
  }
}
