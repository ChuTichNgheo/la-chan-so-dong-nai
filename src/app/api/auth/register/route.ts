import { NextResponse } from 'next/server';
import {
  cookieOptionsForSession,
  hashPassword,
  mapUserRow,
  SESSION_COOKIE_NAME,
  signSessionToken,
  type DbUserRow,
} from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      fullName?: string;
      password?: string;
    };

    const username = (body.username ?? '').trim().toLowerCase();
    const fullName = (body.fullName ?? '').trim();
    const password = body.password ?? '';

    if (username.length < 3 || !/^[a-z0-9_.-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Tên đăng nhập tối thiểu 3 ký tự (chữ không dấu, số hoặc dấu _ . -).' },
        { status: 400 }
      );
    }
    if (!fullName || password.length < 4) {
      return NextResponse.json(
        { error: 'Vui lòng nhập họ tên và mật khẩu từ 4 ký tự trở lên.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Chưa cấu hình bảng app_users trên Supabase. Hãy dùng tài khoản Demo hoặc chạy schema.sql.' },
        { status: 503 }
      );
    }

    const { data: existing } = await supabase
      .from('app_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Tên đăng nhập này đã tồn tại.' }, { status: 409 });
    }

    const newRow: DbUserRow = {
      id: `usr-${Date.now()}`,
      username,
      full_name: fullName,
      password_hash: hashPassword(password),
      role: 'user',
      is_locked: false,
      trusted_name: 'Chị Lan (Con gái)',
      trusted_phone: '0912345678',
      game_score: 0,
      game_badge: 'Tân Binh Số',
    };

    const { error } = await supabase.from('app_users').insert(newRow);
    if (error) {
      return NextResponse.json(
        { error: 'Không tạo được tài khoản trên Supabase (kiểm tra đã chạy schema.sql chưa).' },
        { status: 500 }
      );
    }

    const token = signSessionToken({ id: newRow.id, username: newRow.username, role: 'user' });
    const response = NextResponse.json({ user: mapUserRow(newRow), source: 'supabase' }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptionsForSession());
    return response;
  } catch {
    return NextResponse.json({ error: 'Yêu cầu đăng ký không hợp lệ.' }, { status: 400 });
  }
}
