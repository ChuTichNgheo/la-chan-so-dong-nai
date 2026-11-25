import { NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import type { DynamicRule } from '@/types';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ rules: [], source: 'fallback' });
  }

  const { data } = await supabase
    .from('dynamic_rules')
    .select('id, pattern, level, note, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const rules: DynamicRule[] = (data ?? []).map((r) => ({
    id: String(r.id),
    pattern: String(r.pattern),
    level: r.level as DynamicRule['level'],
    note: String(r.note),
    createdAt: String(r.created_at),
  }));

  return NextResponse.json({ rules, source: 'supabase' });
}

export async function POST(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: 'Cần đăng nhập tài khoản Quản trị.' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ Quản trị viên Đội TNTN mới có quyền thêm luật.' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      pattern?: string;
      level?: DynamicRule['level'];
      note?: string;
    };

    const pattern = (body.pattern ?? '').trim().toLowerCase();
    const level = body.level;
    const note = (body.note ?? '').trim() || 'Cảnh báo nóng do Quản trị viên Đồng Nai cập nhật.';

    if (!pattern || (level !== 'danger' && level !== 'warn' && level !== 'safe')) {
      return NextResponse.json({ error: 'Thiếu từ khóa/link hoặc mức cảnh báo.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Chưa kết nối Supabase.' }, { status: 503 });
    }

    const newRule = {
      id: `RL-${Date.now()}`,
      pattern,
      level,
      note,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('dynamic_rules').insert(newRule);
    if (error) {
      return NextResponse.json({ error: 'Không lưu được luật mới.' }, { status: 500 });
    }

    return NextResponse.json({ rule: newRule }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Không có quyền Quản trị.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Thiếu mã luật.' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('dynamic_rules').delete().eq('id', id);
  }
  return NextResponse.json({ ok: true });
}
