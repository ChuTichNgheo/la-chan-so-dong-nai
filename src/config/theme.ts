import type { RiskLevel } from '@/types';

export const EMERALD_TOKENS = {
  bgApp: '#F4FBF8',
  surface: '#FFFFFF',
  surfaceSoft: '#E9FAF5',
  surfaceMuted: '#F1F5F9',
  border: '#CBE4DC',
  primary: '#0D685E',
  primaryHover: '#09524A',
  secondary: '#14B8A6',
  familyBg: '#F59E0B',
  familyBorder: '#B45309',
  familyText: '#0F172A',
} as const;

export const RISK_LEVEL_META: Record<
  RiskLevel,
  {
    label: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeBgClass: string;
  }
> = {
  danger: {
    label: 'Nguy hiểm',
    bgClass: 'bg-[#FEF2F2]',
    borderClass: 'border-[#DC2626]',
    textClass: 'text-[#991B1B]',
    badgeBgClass: 'bg-[#B91C1C] text-white',
  },
  warn: {
    label: 'Nghi ngờ',
    bgClass: 'bg-[#FFFBEB]',
    borderClass: 'border-[#D97706]',
    textClass: 'text-[#92400E]',
    badgeBgClass: 'bg-[#D97706] text-white',
  },
  unknown: {
    label: 'Chưa ghi nhận – Vẫn cần cảnh giác',
    bgClass: 'bg-[#F1F5F9]',
    borderClass: 'border-[#475569]',
    textClass: 'text-[#1E293B]',
    badgeBgClass: 'bg-[#475569] text-white',
  },
  safe: {
    label: 'Đã xác thực',
    bgClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#059669]',
    textClass: 'text-[#065F46]',
    badgeBgClass: 'bg-[#059669] text-white',
  },
};
