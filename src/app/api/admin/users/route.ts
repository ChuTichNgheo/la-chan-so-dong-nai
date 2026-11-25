import { NextResponse } from 'next/server';
import { getCurrentUserProfile, mapUserRow, type DbUserRow } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ Quản trị viên mới xem được danh sách người dùng.' }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ users: [], source: 'fallback' });
  }

  const { data } = await supabase
    .from('app_users')
    .select('id, username, full_name, role, is_locked, trusted_name, trusted_phone, game_score, game_badge, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const users = (data ?? []).map((row) => mapUserRow(row as Omit<DbUserRow, 'password_hash'>));
  return NextResponse.json({ users, source: 'supabase' });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUserProfile();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền khóa/mở tài khoản.' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { id?: string; isLocked?: boolean };
    if (!body.id || typeof body.isLocked !== 'boolean') {
      return NextResponse.json({ error: 'Thiếu id hoặc trạng thái khóa.' }, { status: 400 });
    }
    if (body.id === user.id) {
      return NextResponse.json({ error: 'Không thể tự khóa tài khoản đang đăng nhập.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Chưa kết nối Supabase.' }, { status: 503 });
    }

    await supabase.from('app_users').update({ is_locked: body.isLocked }).eq('id', body.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái người dùng.' }, { status: 400 });
  }
}
