'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Lock, Phone } from 'lucide-react';
import { OFFICIAL_HOTLINES } from '@/config/hotlines';
import { maskSensitiveTarget } from '@/lib/privacy';
import { submitNewReport } from '@/lib/report-store';

interface ReportScreenProps {
  scannedText: string;
  onNotify: (msg: string) => void;
}

export function ReportScreen({ scannedText, onNotify }: ReportScreenProps) {
  const [type, setType] = useState('Đường dẫn giả mạo');
  const [target, setTarget] = useState('0909888123');
  const [area, setArea] = useState('P. Trấn Biên');
  const [description, setDescription] = useState(
    'Đối tượng tự xưng cán bộ công an yêu cầu chuyển 50 triệu xác minh tài khoản.'
  );
  const [submittedInfo, setSubmittedInfo] = useState<{ id: string; source: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const packetText = `[TIN BÁO LỪA ĐẢO - ĐỒNG NAI] Thủ đoạn: ${type} • Đối tượng: ${
    maskSensitiveTarget(target) || '(chưa nhập)'
  } • Khu vực: ${area} • Mô tả: ${description} • Trạng thái: ${
    submittedInfo ? `Đã ghi nhận (${submittedInfo.id})` : 'Sẵn sàng gửi Đội TN xác minh'
  }.`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim() || !description.trim()) {
      onNotify('Vui lòng điền SĐT/Link nghi vấn và mô tả ngắn.');
      return;
    }
    setSubmitting(true);
    const res = await submitNewReport({ type, target, area, description });
    setSubmittedInfo({ id: res.report.id, source: res.source });
    setSubmitting(false);
    onNotify(
      `Đã gửi báo cáo ${res.report.id} (${res.source === 'supabase' ? 'Supabase' : 'Lưu tạm'}) chờ Đội TN duyệt.`
    );
  }

  async function handleCopyPacket() {
    try {
      await navigator.clipboard.writeText(packetText);
      onNotify('Đã sao chép Phiếu tin báo chuẩn hóa để dán vào VNeID / Cổng NCSC!');
    } catch {
      onNotify('Không thể tự động sao chép, bạn hãy chọn và copy đoạn phiếu bên trên.');
    }
  }

  return (
    <section className="space-y-3" data-screen="M04">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
            Báo cáo &amp; Hồ sơ Công an
          </h1>
          <p className="text-xs text-[#475569]">
            Báo cáo vào hàng chờ xác minh tại M07 trước khi công khai (chống vu khống).
          </p>
        </div>
        {scannedText && (
          <button
            type="button"
            onClick={() => {
              setTarget(scannedText.slice(0, 60));
              setDescription(scannedText);
              onNotify('Đã chép nội dung vừa quét từ M02 vào phiếu.');
            }}
            className="shrink-0 rounded-lg border border-[#CBE4DC] bg-[#E9FAF5] px-2 py-1 text-[11px] font-bold text-[#0D685E]"
          >
            Lấy tin vừa quét
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 rounded-2xl border border-[#CBE4DC] bg-white p-4 shadow-sm">
        <label className="block text-xs font-bold text-[#475569]">
          1. Kiểu thủ đoạn
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm font-medium text-[#0F172A]"
          >
            <option value="Đường dẫn giả mạo">Đường dẫn giả mạo (link độc hại)</option>
            <option value="Giả danh công an / cơ quan">Giả danh công an yêu cầu chuyển tiền</option>
            <option value="Tuyển CTV việc nhẹ lương cao">Tuyển CTV việc nhẹ lương cao</option>
            <option value="Người thân gặp tai nạn">Giả người thân gặp tai nạn</option>
          </select>
        </label>

        <label className="block text-xs font-bold text-[#475569]">
          2. SĐT / Link / STK nghi vấn
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            data-screen="M04"
            data-ui="input-report-target"
            placeholder="VD: 0909888123 hoặc http://vneid-xacminh.xyz"
            className="mt-1 w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm font-medium text-[#0F172A]"
          />
        </label>

        <div className="grid grid-cols-1 gap-2">
          <label className="block text-xs font-bold text-[#475569]">
            3. Địa bàn tại Đồng Nai
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="VD: P. Trấn Biên"
              className="mt-1 w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm font-medium text-[#0F172A]"
            />
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Mô tả ngắn nội dung lừa đảo..."
            className="w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm text-[#0F172A]"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[#E9FAF5] p-2.5 text-[11px] text-[#0D685E]">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Tự động che SĐT mặc định &amp; tách bước duyệt tại Radar M07.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          data-screen="M04"
          data-ui="btn-submit-report"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0D685E] font-bold text-white transition hover:bg-[#09524A]"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Đang gửi vào Supabase...' : 'Gửi báo cáo & Tạo phiếu Công an'}
        </button>

        {submittedInfo && (
          <p className="rounded-xl bg-[#ECFDF5] p-2.5 text-xs font-bold text-[#065F46]">
            Đã lưu {submittedInfo.id} ({submittedInfo.source}) — mở tab Radar (M07) để Đoàn viên duyệt!
          </p>
        )}
      </form>

      <div className="space-y-2.5 rounded-2xl border-2 border-[#0D685E] bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#0D685E] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
            HỒ SƠ TIN BÁO CHUẨN HÓA
          </span>
          <span className="text-[11px] font-semibold text-[#475569]">
            {submittedInfo ? 'Đã nộp chờ duyệt' : 'Sẵn sàng xuất'}
          </span>
        </div>

        <div className="rounded-xl bg-[#F1F5F9] p-2.5 text-xs leading-relaxed text-[#0F172A]">
          {packetText}
        </div>

        <button
          type="button"
          onClick={() => void handleCopyPacket()}
          data-screen="M04"
          data-ui="btn-copy-police-packet"
          className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#E9FAF5] text-xs font-extrabold text-[#0D685E]"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Sao chép hồ sơ gửi Công an / VNeID
        </button>

        <div className="grid grid-cols-2 gap-2">
          {OFFICIAL_HOTLINES.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.kind === 'url' ? '_blank' : undefined}
              rel={item.kind === 'url' ? 'noreferrer' : undefined}
              data-screen="M04"
              data-ui={`btn-hotline-${item.id}`}
              className="flex flex-col rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-xs hover:bg-[#E9FAF5]"
            >
              <span className="inline-flex items-center gap-1 font-extrabold text-[#0D685E]">
                {item.kind === 'tel' ? (
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {item.label}
              </span>
              <span className="mt-0.5 text-[11px] text-[#475569]">{item.subLabel}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
