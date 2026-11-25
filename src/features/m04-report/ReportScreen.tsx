'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Phone } from 'lucide-react';
import { OFFICIAL_HOTLINES } from '@/config/hotlines';
import { submitNewReport } from '@/lib/report-store';

export function ReportScreen() {
  const [type, setType] = useState('Đường dẫn giả mạo');
  const [target, setTarget] = useState('');
  const [area, setArea] = useState('P. Trấn Biên');
  const [description, setDescription] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim() || !description.trim()) return;
    setSubmitting(true);
    const res = await submitNewReport({ type, target, area, description });
    setSubmittedId(res.report.id);
    setSubmitting(false);
  }

  return (
    <section className="space-y-3" data-screen="M04">
      <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
        Báo cáo lừa đảo &amp; Kênh Công an
      </h1>

      <form onSubmit={handleSubmit} className="space-y-2.5 rounded-2xl border border-[#CBE4DC] bg-white p-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm"
        >
          <option value="Đường dẫn giả mạo">Đường dẫn giả mạo (link độc hại)</option>
          <option value="Giả danh công an / cơ quan">Giả danh công an yêu cầu chuyển tiền</option>
          <option value="Tuyển CTV việc nhẹ lương cao">Tuyển CTV việc nhẹ lương cao</option>
          <option value="Người thân gặp tai nạn">Giả người thân gặp tai nạn</option>
        </select>

        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="SĐT / Link / STK nghi vấn"
          className="w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm"
        />

        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Địa bàn (VD: P. Trấn Biên)"
          className="w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Mô tả ngắn nội dung lừa đảo..."
          className="w-full rounded-xl border border-[#CBE4DC] bg-[#F4FBF8] p-2.5 text-sm"
        />

        <button
          type="submit"
          disabled={submitting}
          data-screen="M04"
          data-ui="btn-submit-report"
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0D685E] font-bold text-white"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Đang gửi...' : 'Gửi báo cáo (Chờ duyệt M07)'}
        </button>

        {submittedId && (
          <p className="rounded-lg bg-[#ECFDF5] p-2 text-xs font-bold text-[#065F46]">
            Đã ghi nhận mã {submittedId} ở trạng thái chờ Đoàn viên duyệt tại M07.
          </p>
        )}
      </form>

      <div className="grid grid-cols-2 gap-2">
        {OFFICIAL_HOTLINES.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target={item.kind === 'url' ? '_blank' : undefined}
            rel={item.kind === 'url' ? 'noreferrer' : undefined}
            data-screen="M04"
            data-ui={`btn-hotline-${item.id}`}
            className="flex flex-col rounded-xl border border-[#CBE4DC] bg-white p-2.5 text-xs"
          >
            <span className="inline-flex items-center gap-1 font-extrabold text-[#0D685E]">
              {item.kind === 'tel' ? <Phone className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
              {item.label}
            </span>
            <span className="mt-0.5 text-[11px] text-[#475569]">{item.subLabel}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
