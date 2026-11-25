import type { RadarStats, ScamReport } from '@/types';

export const BASELINE_APPROVED_COUNT = 120;

export const INITIAL_RADAR_STATS: RadarStats = {
  totalReports: 120,
  fakeLinkPercent: 35,
  pendingCount: 3,
  breakdown: [
    { label: 'Đường dẫn giả mạo (link độc hại)', count: 42, percent: 35, tone: 'danger' },
    { label: 'Giả danh công an / ngân hàng', count: 34, percent: 28, tone: 'primary' },
    { label: 'Tuyển CTV việc nhẹ lương cao', count: 26, percent: 22, tone: 'amber' },
    { label: 'Giả người thân gặp tai nạn / khác', count: 18, percent: 15, tone: 'muted' },
  ],
};

export const INITIAL_MODERATION_QUEUE: ScamReport[] = [
  {
    id: 'RP-121',
    type: 'Đường dẫn giả mạo',
    target: 'http://vneid-capnhat-dn.xyz',
    targetMasked: 'http://vneid-capnhat-dn.xyz',
    area: 'P. Trấn Biên',
    description: 'Giả mạo tích hợp BHYT VNeID có ảnh chụp tin nhắn.',
    status: 'pending',
    createdAt: '2026-11-25T07:30:00.000Z',
  },
  {
    id: 'RP-122',
    type: 'Tuyển CTV việc nhẹ lương cao',
    target: '0898111412',
    targetMasked: '0898 *** 412',
    area: 'P. Tân Phong',
    description: 'Nhắn tin dụ học sinh THPT nạp 200k làm nhiệm vụ.',
    status: 'pending',
    createdAt: '2026-11-25T07:45:00.000Z',
  },
  {
    id: 'RP-123',
    type: 'Giả danh công an / cơ quan',
    target: 'STK 109800006621',
    targetMasked: 'STK 1098 **** 6621',
    area: 'TP. Long Khánh',
    description: 'Gọi điện dọa người cao tuổi chuyển tiền xác minh.',
    status: 'pending',
    createdAt: '2026-11-25T08:00:00.000Z',
  },
];
