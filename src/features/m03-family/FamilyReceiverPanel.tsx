'use client';

import { useState } from 'react';
import { CheckCircle2, Flag, PhoneCall, RefreshCw } from 'lucide-react';
import { isValidVietnamesePhone, normalizePhoneDigits } from '@/lib/phone';
import type { FamilyAlertItem, ScreenId } from '@/types';

interface FamilyReceiverPanelProps {
  alerts: FamilyAlertItem[];
  fallbackMessage: string;
  senderPhone: string;
  refreshing: boolean;
  onChangeSenderPhone: (phone: string) => void;
  onRefresh: () => void;
  onAcknowledge: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export function FamilyReceiverPanel({
  alerts,
  fallbackMessage,
  senderPhone,
  refreshing,
  onChangeSenderPhone,
  onRefresh,
  onAcknowledge,
  onNavigate,
}: FamilyReceiverPanelProps) {
  const [editingCallback, setEditingCallback] = useState(false);
  const [tempPhone, setTempPhone] = useState(senderPhone);
  const [phoneError, setPhoneError] = useState('');

  const latest = alerts[0];
  const displaySnippet = latest ? latest.snippet : fallbackMessage;
  const isAcked = latest?.status === 'acknowledged';
  const callbackDigits = normalizePhoneDigits(latest?.senderPhone || senderPhone);

  function handleSaveCallback() {
    if (!isValidVietnamesePhone(tempPhone)) {
      setPhoneError('Số điện thoại người cần hỗ trợ chưa hợp lệ (VD: 0908123456).');
      return;
    }
    setPhoneError('');
    onChangeSenderPhone(normalizePhoneDigits(tempPhone));
    setEditingCallback(false);
  }

  return (
    <div className="space-y-3 rounded-3xl border-2 border-[#DC2626] bg-[#FEF2F2] p-4 text-xs text-[#991B1B]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-extrabold uppercase">
            {latest ? `Cảnh báo từ ${latest.senderName}` : 'Cảnh báo khẩn từ người thân'}
          </div>
          <div className="text-[11px] font-medium text-[#7F1D1D]">
            {alerts.length > 0 ? `${alerts.length} tin gần đây` : 'Chế độ xem thử cho người thân'}
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

      <div className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-[11px] text-[#0F172A]">
        <span>
          Số gọi lại người cần hỗ trợ: <strong className="tabular-nums">{callbackDigits}</strong>
        </span>
        <button
          type="button"
          onClick={() => {
            setTempPhone(senderPhone);
            setEditingCallback((p) => !p);
          }}
          className="font-bold text-[#0D685E]"
        >
          {editingCallback ? 'Đóng' : 'Sửa số'}
        </button>
      </div>

      {editingCallback && (
        <div className="space-y-1.5 rounded-2xl bg-white p-2.5">
          <div className="flex gap-1.5">
            <input
              value={tempPhone}
              onChange={(e) => {
                setTempPhone(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              placeholder="SĐT của Ba/Mẹ cần gọi lại"
              className="flex-1 rounded-xl bg-[#F4FBF8] px-2.5 py-2 text-xs text-[#0F172A] outline-none"
            />
            <button
              type="button"
              onClick={handleSaveCallback}
              className="rounded-xl bg-[#0D685E] px-3 py-2 text-xs font-bold text-white"
            >
              Lưu
            </button>
          </div>
          {phoneError && <p className="text-[11px] font-bold text-[#B91C1C]">{phoneError}</p>}
        </div>
      )}

      {latest && (
        <button
          type="button"
          disabled={isAcked}
          onClick={() => onAcknowledge(latest.id)}
          className={`flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-2xl font-bold transition ${
            isAcked ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#F59E0B] text-[#0F172A] shadow-sm'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {isAcked
            ? `Đã xác nhận (${latest.acknowledgedBy || 'Người thân'})`
            : 'Xác nhận đã nhận & đang gọi lại'}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={`tel:${callbackDigits}`}
          data-screen="M03"
          data-ui="btn-receiver-callback"
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
