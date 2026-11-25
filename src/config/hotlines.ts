import type { HotlineItem } from '@/types';

export const OFFICIAL_HOTLINES: HotlineItem[] = [
  {
    id: 'ncsc',
    label: 'Cổng NCSC',
    subLabel: 'canhbao.ncsc.gov.vn',
    href: 'https://canhbao.ncsc.gov.vn',
    kind: 'url',
  },
  {
    id: 'vneid',
    label: 'Kênh Công an / VNeID',
    subLabel: 'Tiếp nhận tin báo tội phạm',
    href: 'https://bocongan.gov.vn',
    kind: 'url',
  },
  {
    id: '111',
    label: 'Tổng đài 111',
    subLabel: 'Bảo vệ trẻ em & HS (24/7)',
    href: 'tel:111',
    kind: 'tel',
  },
  {
    id: '113',
    label: 'Công an khẩn cấp 113',
    subLabel: 'Hỗ trợ khẩn cấp tại địa phương',
    href: 'tel:113',
    kind: 'tel',
  },
];
