import { NextResponse } from 'next/server';
import {
  cookieOptionsForSession,
  FALLBACK_USERS,
  mapUserRow,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyPassword,
  type DbUserRow,
} from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body.username ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }, { status: 400 });
    }

    let userRow: DbUserRow | null = null;
    let source: 'supabase' | 'fallback' = 'fallback';

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (data) {
        userRow = data as DbUserRow;
        source = 'supabase';
      }
    }

    if (!userRow) {
      userRow = FALLBACK_USERS.find((u) => u.username === username) ?? null;
    }

    if (!userRow || !verifyPassword(password, userRow.password_hash)) {
      return NextResponse.json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' }, { status: 401 });
    }

    if (userRow.is_locked) {
      return NextResponse.json(
        { error: 'Tài khoản này đang bị tạm khóa do vi phạm quy định cộng đồng.' },
        { status: 403 }
      );
    }

    const token = signSessionToken({
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
    });
    const response = NextResponse.json({ user: mapUserRow(userRow), source });
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptionsForSession());
    return response;
  } catch {
    return NextResponse.json({ error: 'Không thể đăng nhập lúc này.' }, { status: 400 });
  }
}
