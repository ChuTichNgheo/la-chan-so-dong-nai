import { maskSensitiveTarget } from '@/lib/privacy';
import type { RadarStats } from '@/types';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFallbackQrMatrix(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const cells = 15;
  const cell = size / cells;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#0F172A';

  const drawFinder = (cx: number, cy: number) => {
    ctx.fillRect(x + cx * cell, y + cy * cell, 5 * cell, 5 * cell);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + (cx + 1) * cell, y + (cy + 1) * cell, 3 * cell, 3 * cell);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(x + (cx + 2) * cell, y + (cy + 2) * cell, cell, cell);
  };
  drawFinder(0, 0);
  drawFinder(cells - 5, 0);
  drawFinder(0, cells - 5);

  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      const inCorner =
        (r < 6 && c < 6) || (r < 6 && c >= cells - 6) || (r >= cells - 6 && c < 6);
      if (inCorner) continue;
      if ((r * 7 + c * 11 + r * c) % 3 === 0) {
        ctx.fillRect(x + c * cell, y + r * cell, cell - 0.5, cell - 0.5);
      }
    }
  }
}

function loadQrImage(targetUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 3500);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=6&data=${encodeURIComponent(
      targetUrl
    )}`;
  });
}

/**
 * Generates a PNG alert card via HTML5 Canvas ready for sharing in neighborhood Zalo groups.
 */
export function renderZaloAlertCardDataUrl(stats: RadarStats, areaLabel = 'ĐỒNG NAI'): string | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 460;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 720, 460);
  grad.addColorStop(0, '#07463F');
  grad.addColorStop(1, '#0D685E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 460);

  drawRoundedRect(ctx, 36, 30, 360, 38, 12);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`CẢNH BÁO TUẦN NÀY • ${areaLabel.toUpperCase()}`, 50, 55);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`${stats.fakeLinkPercent}% LỪA ĐẢO LÀ LINK GIẢ MẠO`, 36, 118);

  drawRoundedRect(ctx, 36, 146, 648, 204, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`• ${stats.totalReports} lượt báo cáo đã xác minh tại Đồng Nai.`, 54, 192);
  ctx.font = '19px sans-serif';
  ctx.fillText('• KHÔNG bấm link lạ nhận quà / cài tệp .apk ngoài kho.', 54, 238);
  ctx.fillText('• Công an KHÔNG yêu cầu chuyển tiền qua điện thoại.', 54, 282);
  ctx.fillText('• Nghi ngờ → Bấm nút vàng HỎI NGƯỜI THÂN ngay.', 54, 326);

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('Kiểm tra miễn phí cùng Lá Chắn Số Đồng Nai (INFINITY AI)', 36, 408);

  return canvas.toDataURL('image/png');
}

export interface FridgePosterOptions {
  areaLabel: string;
  trustedName: string;
  trustedPhone: string;
  showFullPhone?: boolean;
  appUrl?: string;
}

/**
 * Generates a vertical printable PNG "Poster QR Dán Tủ Lạnh" that opens the app directly in Minimal 1-Tap Mode.
 */
export async function renderFridgeQrPosterDataUrl(
  options: FridgePosterOptions
): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  const baseUrl =
    options.appUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://la-chan-so-dong-nai.vercel.app');
  const minimalUrl = `${baseUrl.replace(/\/$/, '')}/?mode=minimal`;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1020;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#F4FBF8';
  ctx.fillRect(0, 0, 720, 1020);

  // Header Banner
  const headerGrad = ctx.createLinearGradient(0, 0, 720, 210);
  headerGrad.addColorStop(0, '#07463F');
  headerGrad.addColorStop(1, '#0D685E');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, 720, 215);

  drawRoundedRect(ctx, 40, 28, 340, 38, 19);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`TỜ RƠI AN TOÀN • ${options.areaLabel.toUpperCase()}`, 58, 53);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('LÁ CHẮN SỐ ĐỒNG NAI', 40, 118);
  ctx.fillStyle = '#D1FAE5';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText('Dán tủ lạnh / bàn điện thoại — Quét là kiểm tra ngay!', 40, 162);

  // QR Card
  drawRoundedRect(ctx, 40, 240, 640, 310, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#CBE4DC';
  ctx.stroke();

  const qrImg = await loadQrImage(minimalUrl);
  const qrX = 70;
  const qrY = 272;
  const qrSize = 240;
  if (qrImg) {
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } else {
    drawFallbackQrMatrix(ctx, qrX, qrY, qrSize);
  }

  ctx.fillStyle = '#0D685E';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('QUÉT MÃ QR MỞ NGAY', 340, 318);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('Tự bật Chế độ Tối giản', 340, 358);
  ctx.fillText('(Chữ to • Nút lớn • Nghe trực tiếp)', 340, 388);

  ctx.fillStyle = '#475569';
  ctx.font = '17px sans-serif';
  ctx.fillText('• Không cần tải app hay đăng nhập', 340, 434);
  ctx.fillText('• Quét bằng camera Zalo / điện thoại', 340, 466);
  ctx.fillText('• Kiểm tra miễn phí trong 3 giây', 340, 498);

  // Trusted Family Contact Box (Amber Emergency Brake)
  drawRoundedRect(ctx, 40, 574, 640, 124, 24);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#F59E0B';
  ctx.stroke();

  const phoneDisplay = options.showFullPhone
    ? options.trustedPhone
    : maskSensitiveTarget(options.trustedPhone);

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('NGƯỜI THÂN TIN CẬY — GỌI NGAY KHI BỊ GIỤC CHUYỂN TIỀN', 64, 614);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${options.trustedName}  •  ${phoneDisplay}`, 64, 666);

  // 3 Golden Rules Card
  drawRoundedRect(ctx, 40, 722, 640, 212, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FECACA';
  ctx.stroke();

  ctx.fillStyle = '#B91C1C';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText('3 QUY TẮC VÀNG CHỐNG LỪA ĐẢO', 64, 764);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('1. Công an / Ngân hàng KHÔNG gọi đòi chuyển tiền xác minh.', 64, 812);
  ctx.fillText('2. KHÔNG đọc mã OTP, KHÔNG bấm link lạ hay cài file .apk.', 64, 856);
  ctx.fillText('3. Gặp cuộc gọi dọa nạt → CÚP MÁY & GỌI NGƯỜI THÂN.', 64, 900);

  // Footer Hotlines
  ctx.fillStyle = '#0D685E';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Khẩn cấp: 113 (Công an) • 111 (Trẻ em) • Đội TNTN Đồng Nai (INFINITY AI)', 40, 982);

  return canvas.toDataURL('image/png');
}

export interface GameBadgeCardOptions {
  playerName: string;
  badgeTitle: string;
  scoreLabel: string;
  modeLabel: string;
}

/**
 * Generates a shareable PNG achievement badge card to challenge family & friends via Zalo.
 */
export function renderGameBadgeCardDataUrl(options: GameBadgeCardOptions): string | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 720, 480);
  bg.addColorStop(0, '#073B35');
  bg.addColorStop(0.55, '#0D685E');
  bg.addColorStop(1, '#115E59');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 720, 480);

  // Decorative glow circle
  ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
  ctx.beginPath();
  ctx.arc(620, 90, 120, 0, Math.PI * 2);
  ctx.fill();

  // Top pill
  drawRoundedRect(ctx, 40, 34, 340, 38, 19);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`CHỨNG NHẬN • ${options.modeLabel.toUpperCase()}`, 58, 59);

  // Inner white certificate card
  drawRoundedRect(ctx, 40, 92, 640, 294, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('CHÚC MỪNG CÔNG DÂN SỐ ĐỒNG NAI', 70, 138);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(options.playerName.slice(0, 28), 70, 188);

  drawRoundedRect(ctx, 70, 210, 580, 76, 16);
  ctx.fillStyle = '#E9FAF5';
  ctx.fill();
  ctx.fillStyle = '#0D685E';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`🏆 ${options.badgeTitle}`, 92, 257);

  ctx.fillStyle = '#B45309';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`Thành tích: ${options.scoreLabel}`, 70, 336);

  ctx.fillStyle = '#475569';
  ctx.font = '17px sans-serif';
  ctx.fillText('Thách đấu cả nhà cùng luyện phản xạ bắt bài lừa đảo trong 10 giây!', 70, 368);

  // Footer
  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('Lá Chắn Số Đồng Nai • INFINITY AI — An toàn cho mọi nhà', 40, 434);

  return canvas.toDataURL('image/png');
}
