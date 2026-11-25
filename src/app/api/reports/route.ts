import { NextResponse } from 'next/server';
import {
  BASELINE_APPROVED_COUNT,
  INITIAL_MODERATION_QUEUE,
  INITIAL_RADAR_STATS,
} from '@/data/mock-radar';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import { maskSensitiveTarget } from '@/lib/privacy';
import type { CreateReportPayload, RadarBreakdownItem, ReportsApiResponse, ScamReport } from '@/types';

interface DbReportRow {
  id: string;
  type: string;
  target: string;
  target_masked: string;
  area: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  reporter_id?: string | null;
  created_at: string;
}

function mapRow(row: DbReportRow): ScamReport {
  return {
    id: row.id,
    type: row.type,
    target: row.target,
    targetMasked: row.target_masked,
    area: row.area,
    description: row.description,
    status: row.status,
    reporterId: row.reporter_id ?? null,
    createdAt: row.created_at,
  };
}

function buildBreakdown(approved: ScamReport[]): {
  breakdown: RadarBreakdownItem[];
  fakeLinkPercent: number;
} {
  let link = 42;
  let police = 34;
  let job = 26;
  let other = 18;

  for (const item of approved) {
    const t = item.type.toLowerCase();
    if (t.includes('đường dẫn') || t.includes('link')) link += 1;
    else if (t.includes('công an') || t.includes('ngân hàng')) police += 1;
    else if (t.includes('ctv') || t.includes('cộng tác')) job += 1;
    else other += 1;
  }

  const total = Math.max(1, link + police + job + other);
  const fakeLinkPercent = Math.round((link / total) * 100);

  return {
    fakeLinkPercent,
    breakdown: [
      { label: 'Đường dẫn giả mạo (link độc hại)', count: link, percent: fakeLinkPercent, tone: 'danger' },
      { label: 'Giả danh công an / ngân hàng', count: police, percent: Math.round((police / total) * 100), tone: 'primary' },
      { label: 'Tuyển CTV việc nhẹ lương cao', count: job, percent: Math.round((job / total) * 100), tone: 'amber' },
      { label: 'Giả người thân gặp tai nạn / khác', count: other, percent: Math.round((other / total) * 100), tone: 'muted' },
    ],
  };
}

export async function GET() {
  const user = await getCurrentUserProfile();
  const isAdmin = user?.role === 'admin';

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json<ReportsApiResponse>({
      stats: INITIAL_RADAR_STATS,
      queue: isAdmin ? INITIAL_MODERATION_QUEUE : [],
      recentApproved: [],
      source: 'fallback',
    });
  }

  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) {
    return NextResponse.json<ReportsApiResponse>({
      stats: INITIAL_RADAR_STATS,
      queue: isAdmin ? INITIAL_MODERATION_QUEUE : [],
      recentApproved: [],
      source: 'fallback',
    });
  }

  const mapped = (data as DbReportRow[]).map(mapRow);
  const pendingRows = mapped.filter((r) => r.status === 'pending');
  const recentApproved = mapped.filter((r) => r.status === 'approved');
  const { breakdown, fakeLinkPercent } = buildBreakdown(recentApproved);

  return NextResponse.json<ReportsApiResponse>({
    stats: {
      totalReports: BASELINE_APPROVED_COUNT + recentApproved.length,
      fakeLinkPercent,
      pendingCount: pendingRows.length,
      breakdown,
    },
    // Privacy & security: only return pending moderation queue to authenticated admins
    queue: isAdmin ? pendingRows : [],
    recentApproved: recentApproved.slice(0, 6),
    source: 'supabase',
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    if (user?.isLocked) {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đang bị khóa gửi báo cáo.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Partial<CreateReportPayload>;
    const type = body.type?.trim() || '';
    const target = body.target?.trim() || '';
    const area = body.area?.trim() || 'Đồng Nai';
    const description = body.description?.trim() || '';

    if (!type || !target || !description) {
      return NextResponse.json({ error: 'Vui lòng điền đủ thông tin báo cáo.' }, { status: 400 });
    }

    const newReport: ScamReport = {
      id: `RP-${Math.floor(124 + Math.random() * 870)}`,
      type,
      target,
      targetMasked: maskSensitiveTarget(target),
      area,
      description,
      status: 'pending',
      reporterId: user?.id ?? null,
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ report: newReport, source: 'fallback' }, { status: 201 });
    }

    const { error } = await supabase.from('scam_reports').insert({
      id: newReport.id,
      type: newReport.type,
      target: newReport.target,
      target_masked: newReport.targetMasked,
      area: newReport.area,
      description: newReport.description,
      status: 'pending',
      reporter_id: user?.id ?? null,
      created_at: newReport.createdAt,
    });

    if (error) {
      return NextResponse.json({ report: newReport, source: 'fallback' }, { status: 201 });
    }

    return NextResponse.json({ report: newReport, source: 'supabase' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
  }
}
