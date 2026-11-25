import type { RadarStats } from '@/types';

/**
 * Generates a PNG alert card via HTML5 Canvas ready for sharing in neighborhood Zalo groups.
 */
export function renderZaloAlertCardDataUrl(stats: RadarStats): string | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 460;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 720, 460);
  grad.addColorStop(0, '#0D685E');
  grad.addColorStop(1, '#083D37');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 460);

  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(36, 34, 290, 34);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('CẢNH BÁO TUẦN NÀY • ĐỒNG NAI', 48, 57);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`${stats.fakeLinkPercent}% LỪA ĐẢO LÀ LINK GIẢ MẠO`, 36, 120);

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(36, 150, 648, 195);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px sans-serif';
  ctx.fillText(`• ${stats.totalReports} lượt báo cáo đã ghi nhận tại địa bàn.`, 54, 195);
  ctx.fillText('• KHÔNG bấm link lạ nhận quà / cài tệp .apk ngoài kho.', 54, 240);
  ctx.fillText('• Công an KHÔNG yêu cầu chuyển tiền qua điện thoại.', 54, 285);

  ctx.fillStyle = '#FCD34D';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Kiểm tra miễn phí cùng Lá Chắn Số Đồng Nai (INFINITY AI)', 36, 405);

  return canvas.toDataURL('image/png');
}
