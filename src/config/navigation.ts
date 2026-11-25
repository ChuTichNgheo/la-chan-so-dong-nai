import type { NavTabItem, ScreenId } from '@/types';

export const BOTTOM_NAV_TABS: NavTabItem[] = [
  { id: 'M01', label: 'Trang chủ', iconName: 'home', dataUi: 'nav-home' },
  { id: 'M02', label: 'Kiểm tra', iconName: 'search', dataUi: 'nav-check' },
  { id: 'M06', label: 'Học tập', iconName: 'gamepad', dataUi: 'nav-learn' },
  { id: 'M07', label: 'Radar', iconName: 'bar-chart', dataUi: 'nav-radar' },
  { id: 'M05', label: 'Video', iconName: 'video', dataUi: 'nav-video' },
];

export const SCREEN_TITLES: Record<ScreenId, string> = {
  M01: 'Trang chủ & Kiểm tra nhanh',
  M02: 'Kết quả phân tích Hybrid AI',
  M03: 'Hỏi người thân xác minh',
  M04: 'Báo cáo & Kênh Công an',
  M05: 'Video cảnh báo 1 phút',
  M06: 'Học tập & Mini Game',
  M07: 'Radar Đội tình nguyện',
  M08: 'Trạng thái Hệ thống & An toàn',
  M09: 'Tài khoản & Phân quyền',
};

export const SCREEN_TAB_MAP: Record<ScreenId, NavTabItem['id']> = {
  M01: 'M01',
  M02: 'M02',
  M03: 'M02',
  M04: 'M07',
  M05: 'M05',
  M06: 'M06',
  M07: 'M07',
  M08: 'M01',
  M09: 'M01',
};
