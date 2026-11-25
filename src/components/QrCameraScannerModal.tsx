'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, QrCode, ShieldAlert, Sparkles, X } from 'lucide-react';
import { parseQrPayload, type ParsedQrPayload } from '@/lib/vietqr-parser';

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

interface QrCameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanDecoded: (parsed: ParsedQrPayload) => void;
  onCaptureImageFallback: (base64: string, mimeType: string, label: string) => void;
}

const SAMPLE_SCAM_VIETQR =
  '00020101021238560010A0000007270126000697042201121098000066210208QRIBFTTA53037045408500000005802VN62290825Xac minh tai khoan vu an6304ABCD';
const SAMPLE_PHISHING_QR = 'http://vneid-capnhat-dn.xyz/bhyt-dongnai';

export function QrCameraScannerModal({
  open,
  onClose,
  onScanDecoded,
  onCaptureImageFallback,
}: QrCameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [nativeQrSupported, setNativeQrSupported] = useState(false);
  const [decodedPreview, setDecodedPreview] = useState<ParsedQrPayload | null>(null);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function initCamera() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        if (active) {
          setCameraError('Trình duyệt chưa hỗ trợ mở Camera trực tiếp — bạn hãy dùng nút Thử quét QR mẫu bên dưới.');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = stream;
          await vid.play().catch(() => {});
        }
        setCameraReady(true);

        const win = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
        if (win.BarcodeDetector) {
          setNativeQrSupported(true);
          const detector = new win.BarcodeDetector({ formats: ['qr_code'] });
          scanTimerRef.current = setInterval(() => {
            const currentVid = videoRef.current;
            if (!currentVid || currentVid.readyState < 2) return;
            void detector
              .detect(currentVid)
              .then((codes) => {
                const rawVal = codes[0]?.rawValue?.trim();
                if (rawVal) {
                  stopCamera();
                  setDecodedPreview(parseQrPayload(rawVal));
                }
              })
              .catch(() => {});
          }, 450);
        }
      } catch {
        if (active) {
          setCameraError(
            'Chưa được cấp quyền Camera (hoặc thiết bị không có camera). Bạn vẫn có thể bấm nút Thử quét mã VietQR mẫu bên dưới!'
          );
        }
      }
    }

    void initCamera();
    return () => {
      active = false;
      stopCamera();
    };
  }, [open, stopCamera]);

  function handleSnapFrameToVision() {
    const vid = videoRef.current;
    if (!vid || vid.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    const maxW = 960;
    const scale = Math.min(1, maxW / vid.videoWidth);
    canvas.width = Math.round(vid.videoWidth * scale);
    canvas.height = Math.round(vid.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const base64 = dataUrl.split(',')[1] || '';
    stopCamera();
    onCaptureImageFallback(base64, 'image/jpeg', 'Ảnh chụp Camera QR / Chuyển khoản');
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-3 backdrop-blur-xs sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Quét mã QR trước khi chuyển tiền"
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-[28px] border-2 border-[#0D685E] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#07463F] to-[#0D685E] px-4 py-3.5 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/15">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-[family-name:var(--font-lexend)] text-sm font-extrabold">
                Quét QR Trước Khi Chuyển Tiền
              </div>
              <div className="text-[11px] text-[#D1FAE5]">
                Giải mã VietQR (Ngân hàng, STK, Số tiền) &amp; Link ẩn
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Đóng camera quét QR"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {decodedPreview ? (
            <div className="space-y-3 rounded-2xl border-2 border-[#F59E0B] bg-[#FFFBEB] p-3.5 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-[#92400E]">
                <ShieldAlert className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                {decodedPreview.kind === 'vietqr'
                  ? 'Đã giải mã thông tin VietQR chuyển khoản!'
                  : 'Đã giải mã nội dung ẩn bên trong mã QR!'}
              </div>

              {decodedPreview.kind === 'vietqr' ? (
                <div className="space-y-1.5 rounded-xl bg-white p-3 text-[#0F172A]">
                  <div>
                    <span className="text-[#475569]">Ngân hàng:</span>{' '}
                    <strong>{decodedPreview.bankName}</strong>
                  </div>
                  {decodedPreview.accountNumber && (
                    <div className="tabular-nums">
                      <span className="text-[#475569]">Số tài khoản:</span>{' '}
                      <strong className="text-[#B91C1C]">{decodedPreview.accountNumber}</strong>
                    </div>
                  )}
                  {decodedPreview.amountVnd && (
                    <div className="tabular-nums">
                      <span className="text-[#475569]">Số tiền yêu cầu:</span>{' '}
                      <strong>{decodedPreview.amountVnd}</strong>
                    </div>
                  )}
                  {decodedPreview.transferNote && (
                    <div>
                      <span className="text-[#475569]">Nội dung:</span>{' '}
                      <strong>{decodedPreview.transferNote}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-white p-3 font-bold text-[#0F172A] break-all">
                  {decodedPreview.raw}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDecodedPreview(null)}
                  className="rounded-xl bg-white py-2.5 font-bold text-[#475569] shadow-xs"
                >
                  Quét mã khác
                </button>
                <button
                  type="button"
                  onClick={() => onScanDecoded(decodedPreview)}
                  data-ui="btn-qr-confirm-analyze"
                  className="rounded-xl bg-[#0D685E] py-2.5 font-extrabold text-white shadow-sm"
                >
                  Kiểm tra lừa đảo ngay →
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#071316]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                {cameraReady && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-44 w-44 rounded-3xl border-2 border-[#34D399] shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center p-5 text-center text-xs font-semibold text-white/90">
                    {cameraError}
                  </div>
                )}
              </div>

              {cameraReady && (
                <button
                  type="button"
                  onClick={handleSnapFrameToVision}
                  data-ui="btn-qr-snap-vision"
                  className="flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] text-xs font-extrabold text-white shadow-sm"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {nativeQrSupported
                    ? 'Chụp đọc ngay bằng Gemini Vision (nếu QR mờ)'
                    : 'Chụp mã QR / Bill gửi Gemini AI đọc ngay'}
                </button>
              )}

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#475569]">
                  Hoặc thử giải mã nhanh 2 mẫu QR lừa đảo thực tế:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setDecodedPreview(parseQrPayload(SAMPLE_SCAM_VIETQR));
                    }}
                    data-ui="btn-sample-vietqr"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#CBE4DC] bg-[#E9FAF5] px-2.5 py-2 text-[11px] font-extrabold text-[#0D685E]"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Thử VietQR 50 triệu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setDecodedPreview(parseQrPayload(SAMPLE_PHISHING_QR));
                    }}
                    data-ui="btn-sample-linkqr"
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-2 text-[11px] font-extrabold text-[#991B1B]"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Thử QR link VNeID giả
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
