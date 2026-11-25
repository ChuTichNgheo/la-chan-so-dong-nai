import { NextResponse } from 'next/server';
import { runLayerOneRules } from '@/data/local-rules';
import { getSupabaseServerClient } from '@/lib/db';
import { inspectAllUrlsInText } from '@/lib/url-inspector';
import type { DynamicRule, ScamReport } from '@/types';

function normalizeCompact(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9.]/g, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const qLower = query.toLowerCase();
  const qCompact = normalizeCompact(query);

  const supabase = getSupabaseServerClient();
  const matches: ScamReport[] = [];
  let pendingMatches = 0;
  let dynamicRules: DynamicRule[] = [];
  let areaSummary: Array<{ area: string; count: number }> = [];

  if (supabase) {
    const { data: reports } = await supabase
      .from('scam_reports')
      .select('id, type, target, target_masked, area, description, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const rows = (reports ?? []) as Array<{
      id: string;
      type: string;
      target: string;
      target_masked: string;
      area: string;
      description: string;
      status: 'pending' | 'approved' | 'rejected';
      created_at: string;
    }>;

    const areaCounts = new Map<string, number>();
    for (const row of rows) {
      if (row.status === 'approved') {
        const areaName = row.area || 'Đồng Nai';
        areaCounts.set(areaName, (areaCounts.get(areaName) ?? 0) + 1);
      }
      if (!query) continue;
      const hit =
        row.target.toLowerCase().includes(qLower) ||
        row.description.toLowerCase().includes(qLower) ||
        (qCompact.length >= 5 && normalizeCompact(row.target).includes(qCompact));
      if (!hit) continue;

      if (row.status === 'approved') {
        matches.push({
          id: row.id,
          type: row.type,
          target: row.target_masked,
          targetMasked: row.target_masked,
          area: row.area,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
        });
      } else if (row.status === 'pending') {
        pendingMatches += 1;
      }
    }

    areaSummary = [...areaCounts.entries()]
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (query) {
      const { data: ruleRows } = await supabase
        .from('dynamic_rules')
        .select('id, pattern, level, note, created_at')
        .limit(100);
      dynamicRules = ((ruleRows ?? []) as Array<{
        id: string;
        pattern: string;
        level: 'danger' | 'warn' | 'safe';
        note: string;
        created_at: string;
      }>)
        .filter((r) => {
          const p = r.pattern.toLowerCase();
          return p.includes(qLower) || qLower.includes(p) || (qCompact.length >= 4 && normalizeCompact(p).includes(qCompact));
        })
        .map((r) => ({
          id: r.id,
          pattern: r.pattern,
          level: r.level,
          note: r.note,
          createdAt: r.created_at,
        }));
    }
  }

  const urlReports = query ? await inspectAllUrlsInText(query, { expandShortlink: true }) : [];
  const layerOne = query ? runLayerOneRules(query) : null;

  return NextResponse.json({
    query,
    matches: matches.slice(0, 10),
    pendingMatches,
    dynamicRules,
    urlReports,
    layerOneLevel: layerOne?.level ?? 'unknown',
    areaSummary,
  });
}
