'use client';

import { CheckCircle2, Flag, PhoneCall, RefreshCw } from 'lucide-react';
import type { FamilyAlertItem, ScreenId } from '@/types';

interface FamilyReceiverPanelProps {
  alerts: FamilyAlertItem[];
  fallbackMessage: string;
  contactPhone: string;
  sourceLabel: 'supabase' | 'fallback';
  refreshing: boolean;
  onRefresh: () => void;
  onAcknowledge: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export function FamilyReceiverPanel({
  alerts,
  fallbackMessage,
  contactPhone,
  sourceLabel,
  refreshing,
  onRefresh,
  onAcknowledge,
  onNavigate,
}: FamilyReceiverPanelProps) {
  const latest = alerts[0];
  const displaySnippet = latest ? latest.snippet : fallbackMessage;
  const isAcked = latest?.status === 'acknowledged';

  return (
    <div className="space-y-3 rounded-3xl border-2 border-[#DC2626] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-extrabold uppercase">
            {latest ? `Cảnh báo từ ${latest.senderName}` : 'Cảnh báo khẩn từ Ba (Bác Tư)'}
          </div>
          <div className="text-[11px] font-medium text-[#7F1D1D]">
            Đồng bộ: {sourceLabel === 'supabase' ? 'Supabase xuyên thiết bị' : 'Trên máy'} •{' '}
            {alerts.length > 0 ? `${alerts.length} tin gần đây` : 'Mẫu minh họa'}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Làm mới cảnh báo gia đình"
          className="rounded-full bg-white p-2 text-[#991B1B] shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="rounded-2xl bg-white p-3 leading-relaxed text-[#0F172A]">{displaySnippet}</p>

      {latest && (
        <button
          type="button"
          disabled={isAcked}
          onClick={() => onAcknowledge(latest.id)}
          className={`flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-2xl font-bold transition ${
            isAcked
              ? 'bg-[#ECFDF5] text-[#065F46]'
              : 'bg-[#F59E0B] text-[#0F172A] shadow-sm'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {isAcked
            ? `Đã xác nhận (${latest.acknowledgedBy || 'Người thân'})`
            : 'Xác nhận đã nhận & đang gọi Ba/Mẹ'}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`tel:${contactPhone.replace(/\D/g, '')}`}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-[#0D685E] font-bold text-white"
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          Gọi lại ngay
        </a>
        <button
          type="button"
          onClick={() => onNavigate('M04')}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-white font-bold text-[#991B1B] shadow-sm"
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          Lập hồ sơ báo cáo
        </button>
      </div>
    </div>
  );
}
