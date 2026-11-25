import { NextResponse } from 'next/server';
import {
  BASELINE_APPROVED_COUNT,
  INITIAL_MODERATION_QUEUE,
  INITIAL_RADAR_STATS,
} from '@/data/mock-radar';
import { getSupabaseServerClient } from '@/lib/db';
import { maskSensitiveTarget } from '@/lib/privacy';
import type { CreateReportPayload, ReportsApiResponse, ScamReport } from '@/types';

interface DbReportRow {
  id: string;
  type: string;
  target: string;
  target_masked: string;
  area: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
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
    createdAt: row.created_at,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const fallback: ReportsApiResponse = {
      stats: INITIAL_RADAR_STATS,
      queue: INITIAL_MODERATION_QUEUE,
      recentApproved: [],
      source: 'fallback',
    };
    return NextResponse.json(fallback);
  }

  const { data, error } = await supabase
    .from('scam_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) {
    const fallback: ReportsApiResponse = {
      stats: INITIAL_RADAR_STATS,
      queue: INITIAL_MODERATION_QUEUE,
      recentApproved: [],
      source: 'fallback',
    };
    return NextResponse.json(fallback);
  }

  const mapped = (data as DbReportRow[]).map(mapRow);
  const queue = mapped.filter((r) => r.status === 'pending');
  const recentApproved = mapped.filter((r) => r.status === 'approved');

  const response: ReportsApiResponse = {
    stats: {
      ...INITIAL_RADAR_STATS,
      totalReports: BASELINE_APPROVED_COUNT + recentApproved.length,
      pendingCount: queue.length,
    },
    queue,
    recentApproved,
    source: 'supabase',
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
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
