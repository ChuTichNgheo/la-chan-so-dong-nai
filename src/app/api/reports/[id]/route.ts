import { NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db';
import type { ReportStatus } from '@/types';

interface ModeratePayload {
  status: Exclude<ReportStatus, 'pending'>;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json(
        { error: 'Bạn cần đăng nhập tài khoản Quản trị Đội TNTN để duyệt.' },
        { status: 401 }
      );
    }
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Tài khoản Người dân không có quyền duyệt báo cáo.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as Partial<ModeratePayload>;

    if (body.status !== 'approved' && body.status !== 'rejected') {
      return NextResponse.json({ error: 'Trạng thái duyệt không hợp lệ.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ id, status: body.status, source: 'fallback' });
    }

    const { data, error } = await supabase
      .from('scam_reports')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ id, status: body.status, source: 'fallback' });
    }

    return NextResponse.json({ report: data, source: 'supabase' });
  } catch {
    return NextResponse.json({ error: 'Không thể xử lý yêu cầu duyệt.' }, { status: 400 });
  }
}
