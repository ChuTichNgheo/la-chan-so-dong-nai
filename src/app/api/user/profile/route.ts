import { NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import type { RiskLevel, ScamReport, ScanHistoryItem } from '@/types';

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ user, scanHistory: [], myReports: [], source: 'fallback' });
  }

  const [{ data: historyRows }, { data: reportRows }] = await Promise.all([
    supabase
      .from('scan_history')
      .select('id, snippet, risk_level, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('scam_reports')
      .select('id, type, target, target_masked, area, description, status, reporter_id, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const scanHistory: ScanHistoryItem[] = (historyRows ?? []).map((h) => ({
    id: String(h.id),
    snippet: String(h.snippet),
    riskLevel: h.risk_level as RiskLevel,
    title: String(h.title),
    createdAt: String(h.created_at),
  }));

  const myReports: ScamReport[] = (reportRows ?? []).map((r) => ({
    id: String(r.id),
    type: String(r.type),
    target: String(r.target),
    targetMasked: String(r.target_masked),
    area: String(r.area),
    description: String(r.description),
    status: r.status as ScamReport['status'],
    reporterId: r.reporter_id ? String(r.reporter_id) : null,
    createdAt: String(r.created_at),
  }));

  return NextResponse.json({ user, scanHistory, myReports, source: 'supabase' });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: 'Bạn chưa đăng nhập.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      trustedName?: string;
      trustedPhone?: string;
      gameScore?: number;
      gameBadge?: string;
    };

    const updates: Record<string, string | number> = {};
    if (typeof body.trustedName === 'string' && body.trustedName.trim()) {
      updates.trusted_name = body.trustedName.trim().slice(0, 60);
    }
    if (typeof body.trustedPhone === 'string' && body.trustedPhone.trim()) {
      updates.trusted_phone = body.trustedPhone.trim().slice(0, 20);
    }
    if (typeof body.gameScore === 'number' && Number.isFinite(body.gameScore)) {
      updates.game_score = Math.max(user.gameScore, Math.round(body.gameScore));
    }
    if (typeof body.gameBadge === 'string' && body.gameBadge.trim()) {
      updates.game_badge = body.gameBadge.trim().slice(0, 50);
    }

    const supabase = getSupabaseServerClient();
    if (!supabase || Object.keys(updates).length === 0) {
      return NextResponse.json({ user: { ...user, ...body }, source: 'fallback' });
    }

    const { error } = await supabase.from('app_users').update(updates).eq('id', user.id);
    if (error) {
      return NextResponse.json({ user, source: 'fallback' });
    }

    const updated = await getCurrentUserProfile();
    return NextResponse.json({ user: updated ?? user, source: 'supabase' });
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật hồ sơ.' }, { status: 400 });
  }
}
