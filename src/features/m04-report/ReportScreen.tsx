'use client';

import { useRef, useState } from 'react';
import { Camera, CheckCircle2, Copy, ExternalLink, Lock, Phone } from 'lucide-react';
import { OFFICIAL_HOTLINES } from '@/config/hotlines';
import { compressImageToBase64 } from '@/lib/image-compress';
import { maskSensitiveTarget } from '@/lib/privacy';
import { extractReportPrefill } from '@/lib/report-prefill';
import { submitNewReport } from '@/lib/report-store';

interface ReportScreenProps {
  scannedText: string;
  onNotify: (msg: string) => void;
  onReportSubmitted?: () => void;
}

export function ReportScreen({ scannedText, onNotify, onReportSubmitted }: ReportScreenProps) {
  const initialPrefill = scannedText ? extractReportPrefill(scannedText) : null;

  const [type, setType] = useState(initialPrefill?.type ?? 'Đường dẫn giả mạo');
  const [target, setTarget] = useState(initialPrefill?.target ?? '');
  const [area, setArea] = useState('P. Trấn Biên');
  const [description, setDescription] = useState(initialPrefill?.description ?? '');
  const [submittedInfo, setSubmittedInfo] = useState<{ id: string; source: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const evidenceFileRef = useRef<HTMLInputElement | null>(null);

  async function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAutofilling(true);
    try {
      const { base64, mimeType } = await compressImageToBase64(file);
      const res = await fetch('/api/reports/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, imageMimeType: mimeType }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        onNotify(err.error || 'Chưa trích xuất được thông tin từ ảnh.');
        return;
      }
      const data = (await res.json()) as {
        type: string;
        target: string;
        area: string;
        description: string;
      };
      setType(data.type);
      if (data.target) setTarget(data.target);
      if (data.area) setArea(data.area);
      if (data.description) setDescription(data.description);
      onNotify('AI đã tự bóc thông tin từ ảnh bằng chứng vào phiếu!');
    } catch {
      onNotify('Không đọc được tệp ảnh bằng chứng.');
    } finally {
      setAutofilling(false);
    }
  }

  const cleanTarget = target.trim();
  const cleanDescription = description.trim();
  const hasContent = Boolean(cleanTarget && cleanDescription);

  const packetText = `[TIN BÁO LỪA ĐẢO - ĐỒNG NAI] Thủ đoạn: ${type} • Đối tượng: ${
    maskSensitiveTarget(cleanTarget) || '(chưa nhập)'
  } • Khu vực: ${area.trim() || 'Đồng Nai'} • Mô tả: ${
    cleanDescription || '(chưa nhập)'
  } • Trạng thái: ${submittedInfo ? `Đã ghi nhận (${submittedInfo.id})` : 'Sẵn sàng gửi xác minh'}.`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanTarget || !cleanDescription) {
      onNotify('Vui lòng điền SĐT/Link/STK nghi vấn và mô tả ngắn.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitNewReport({
        type,
        target: cleanTarget,
        area: area.trim() || 'Đồng Nai',
        description: cleanDescription,
      });
      setSubmittedInfo({ id: res.report.id, source: res.source });
      onReportSubmitted?.();
      onNotify(`Đã gửi báo cáo ${res.report.id} chờ Đội Thanh niên tình nguyện xác minh.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Không thể gửi báo cáo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyPacket() {
    if (!hasContent) {
      onNotify('Vui lòng nhập đối tượng nghi vấn và mô tả trước khi sao chép hồ sơ.');
      return;
    }
    try {
      await navigator.clipboard.writeText(packetText);
      onNotify('Đã sao chép Phiếu tin báo chuẩn hóa để dán vào VNeID / Cổng NCSC!');
    } catch {
      onNotify('Không thể tự động sao chép, bạn hãy chọn và copy đoạn phiếu bên trên.');
    }
  }

  return (
    <section className="space-y-4" data-screen="M04">
      <div className="flex flex-wrap items-start justify-between gap-2 px-1">
        <div>
          <h1 className="font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
            Báo cáo &amp; Hồ sơ Công an
          </h1>
          <p className="mt-0.5 text-xs text-[#475569]">
            Xác minh trước khi công khai để chống vu khống.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            ref={evidenceFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => void handleEvidenceUpload(e)}
            className="hidden"
          />
          <button
            type="button"
            disabled={autofilling}
            onClick={() => evidenceFileRef.current?.click()}
            data-screen="M04"
            data-ui="btn-autofill-evidence"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEF3C7] px-3 py-1.5 text-[11px] font-extrabold text-[#92400E]"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            {autofilling ? 'Đang đọc ảnh...' : 'Tự điền từ ảnh'}
          </button>
          {scannedText && (
            <button
              type="button"
              onClick={() => {
                const parsed = extractReportPrefill(scannedText);
                setType(parsed.type);
                setTarget(parsed.target);
                setDescription(parsed.description);
                onNotify('Đã bóc SĐT/Link & mô tả vừa quét vào phiếu.');
              }}
              className="shrink-0 rounded-full bg-[#E9FAF5] px-3 py-1.5 text-[11px] font-bold text-[#0D685E]"
            >
              Lấy tin vừa quét
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]"
      >
        <label className="block text-xs font-bold text-[#475569]">
          1. Kiểu thủ đoạn
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1.5 w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm font-medium text-[#0F172A] outline-none"
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
            className="mt-1.5 w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0D685E]"
          />
        </label>

        <label className="block text-xs font-bold text-[#475569]">
          3. Địa bàn tại Đồng Nai &amp; Mô tả
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="VD: P. Trấn Biên, TP. Long Khánh"
            className="mt-1.5 w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm font-medium text-[#0F172A] outline-none"
          />
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Mô tả ngắn nội dung hoặc thủ đoạn lừa đảo..."
          className="w-full rounded-2xl bg-[#F4FBF8] p-3 text-sm text-[#0F172A] outline-none"
        />

        <div className="flex items-center gap-2 rounded-2xl bg-[#E9FAF5] p-3 text-[11px] font-medium text-[#0D685E]">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Tự động che SĐT mặc định &amp; chỉ công khai trên Radar sau khi xác minh.</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          data-screen="M04"
          data-ui="btn-submit-report"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0D685E] font-bold text-white shadow-[0_6px_16px_rgba(13,104,94,0.2)]"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Đang gửi báo cáo...' : 'Gửi báo cáo & Tạo phiếu Công an'}
        </button>

        {submittedInfo && (
          <p className="rounded-2xl bg-[#ECFDF5] p-3 text-xs font-bold text-[#065F46]">
            Đã ghi nhận {submittedInfo.id} — đang chờ Đội Thanh niên tình nguyện xác minh tại Radar!
          </p>
        )}
      </form>

      <div className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#0D685E] px-3 py-1 text-[11px] font-extrabold text-white">
            HỒ SƠ TIN BÁO CHUẨN HÓA
          </span>
          <span className="text-[11px] font-semibold text-[#475569]">
            {submittedInfo ? 'Đã nộp chờ duyệt' : hasContent ? 'Sẵn sàng xuất' : 'Chưa đủ thông tin'}
          </span>
        </div>

        <div className="rounded-2xl bg-[#F1F5F9] p-3 text-xs leading-relaxed text-[#0F172A] break-words">
          {packetText}
        </div>

        <button
          type="button"
          onClick={() => void handleCopyPacket()}
          data-screen="M04"
          data-ui="btn-copy-police-packet"
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#E9FAF5] text-xs font-extrabold text-[#0D685E]"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Sao chép hồ sơ gửi Công an / VNeID
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          {OFFICIAL_HOTLINES.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.kind === 'url' ? '_blank' : undefined}
              rel={item.kind === 'url' ? 'noreferrer' : undefined}
              data-screen="M04"
              data-ui={`btn-hotline-${item.id}`}
              className="flex flex-col rounded-2xl bg-[#F4FBF8] p-3 text-xs transition hover:bg-[#E9FAF5]"
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
