import { NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import type { FamilyAlertItem, RiskLevel } from '@/types';

interface DbFamilyAlertRow {
  id: string;
  sender_id: string | null;
  sender_name: string;
  target_phone: string;
  risk_level: RiskLevel;
  snippet: string;
  status: 'sent' | 'acknowledged';
  acknowledged_by: string | null;
  created_at: string;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

function mapAlertRow(row: DbFamilyAlertRow): FamilyAlertItem {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    targetPhone: row.target_phone,
    riskLevel: row.risk_level,
    snippet: row.snippet,
    status: row.status,
    acknowledgedBy: row.acknowledged_by,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const user = await getCurrentUserProfile();
  const { searchParams } = new URL(request.url);
  const phone = normalizePhone(searchParams.get('phone') || user?.trustedPhone || '');

  const supabase = getSupabaseServerClient();
  if (!supabase || !phone) {
    return NextResponse.json({ alerts: [], source: 'fallback' });
  }

  const { data, error } = await supabase
    .from('family_alerts')
    .select('id, sender_id, sender_name, target_phone, risk_level, snippet, status, acknowledged_by, created_at')
    .eq('target_phone', phone)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ alerts: [], source: 'fallback' });
  }

  return NextResponse.json({
    alerts: ((data ?? []) as DbFamilyAlertRow[]).map(mapAlertRow),
    source: 'supabase',
  });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    const body = (await request.json()) as {
      targetPhone?: string;
      senderName?: string;
      riskLevel?: RiskLevel;
      snippet?: string;
    };

    const targetPhone = normalizePhone(body.targetPhone || user?.trustedPhone || '');
    const snippet = String(body.snippet || '').trim();
    if (!targetPhone || !snippet) {
      return NextResponse.json({ error: 'Thiếu số điện thoại người thân hoặc nội dung.' }, { status: 400 });
    }

    const newItem: FamilyAlertItem = {
      id: `FA-${Date.now()}`,
      senderId: user?.id ?? null,
      senderName: (body.senderName || user?.fullName || 'Bác Tư (Đồng Nai)').slice(0, 60),
      targetPhone,
      riskLevel: body.riskLevel ?? 'danger',
      snippet: snippet.slice(0, 260),
      status: 'sent',
      acknowledgedBy: null,
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ alert: newItem, source: 'fallback' });
    }

    const { error } = await supabase.from('family_alerts').insert({
      id: newItem.id,
      sender_id: newItem.senderId,
      sender_name: newItem.senderName,
      target_phone: newItem.targetPhone,
      risk_level: newItem.riskLevel,
      snippet: newItem.snippet,
      status: newItem.status,
      created_at: newItem.createdAt,
    });

    if (error) {
      return NextResponse.json({ alert: newItem, source: 'fallback' });
    }

    return NextResponse.json({ alert: newItem, source: 'supabase' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không gửi được cảnh báo.' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    const body = (await request.json()) as { id?: string; acknowledgedBy?: string };
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Thiếu mã cảnh báo.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, source: 'fallback' });
    }

    const { error } = await supabase
      .from('family_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: (body.acknowledgedBy || user?.fullName || 'Người thân tin cậy').slice(0, 60),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ ok: false, source: 'fallback' });
    }

    return NextResponse.json({ ok: true, source: 'supabase' });
  } catch {
    return NextResponse.json({ error: 'Cập nhật thất bại.' }, { status: 400 });
  }
}
