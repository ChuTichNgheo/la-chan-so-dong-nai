'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, MessageSquare, PhoneCall, Send, Share2 } from 'lucide-react';
import { isValidVietnamesePhone, normalizePhoneDigits } from '@/lib/phone';
import { maskSensitiveTarget } from '@/lib/privacy';
import { speakAlertVietnamese } from '@/lib/speech';
import type { AnalyzeResult, AppUserProfile, FamilyAlertItem, ScreenId } from '@/types';
import { FamilyDeepfakeShieldCard } from './FamilyDeepfakeShieldCard';
import { FamilyReceiverPanel } from './FamilyReceiverPanel';

interface FamilyScreenProps {
  scannedText: string;
  scanResult: AnalyzeResult | null;
  currentUser: AppUserProfile | null;
  onContactLocalSaved?: (name: string, phone: string) => void;
  onUserUpdated: (user: AppUserProfile) => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

const CONTACT_STORAGE_KEY = 'lacd_family_contact_v1';
const ALERTS_STORAGE_KEY = 'lacd_family_alerts_v1';
const SENDER_PHONE_KEY = 'lacd_sender_callback_phone_v1';

export function FamilyScreen({
  scannedText,
  scanResult,
  currentUser,
  onContactLocalSaved,
  onUserUpdated,
  onNavigate,
  onNotify,
}: FamilyScreenProps) {
  const [view, setView] = useState<'sender' | 'receiver'>('sender');
  const [contactName, setContactName] = useState(
    currentUser?.trustedName ?? 'Chị Lan (Con gái • Ưu tiên 1)'
  );
  const [contactPhone, setContactPhone] = useState(currentUser?.trustedPhone ?? '0912345678');
  const [draftName, setDraftName] = useState(currentUser?.trustedName ?? 'Chị Lan (Con gái • Ưu tiên 1)');
  const [draftPhone, setDraftPhone] = useState(currentUser?.trustedPhone ?? '0912345678');
  const [senderPhone, setSenderPhone] = useState('0908111222');
  const [contactError, setContactError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [alerts, setAlerts] = useState<FamilyAlertItem[]>([]);
  const [sessionSentId, setSessionSentId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const loadAlerts = useCallback(async (phone: string) => {
    setRefreshing(true);
    try {
      const cleanPhone = normalizePhoneDigits(phone);
      const res = await fetch(`/api/family-alerts?phone=${encodeURIComponent(cleanPhone)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { alerts?: FamilyAlertItem[]; source?: string };
        if (data.source === 'supabase' && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
          setRefreshing(false);
          return;
        }
      }
    } catch {
      // Fallback to local cache
    }
    try {
      const cached = window.localStorage.getItem(ALERTS_STORAGE_KEY);
      if (cached) setAlerts(JSON.parse(cached) as FamilyAlertItem[]);
    } catch {
      // Ignore storage error
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      let phoneToLoad = currentUser?.trustedPhone ?? '0912345678';
      if (currentUser) {
        setContactName(currentUser.trustedName);
        setContactPhone(currentUser.trustedPhone);
        setDraftName(currentUser.trustedName);
        setDraftPhone(currentUser.trustedPhone);
      } else {
        try {
          const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { name?: string; phone?: string };
            if (parsed.name) {
              setContactName(parsed.name);
              setDraftName(parsed.name);
            }
            if (parsed.phone) {
              setContactPhone(parsed.phone);
              setDraftPhone(parsed.phone);
              phoneToLoad = parsed.phone;
            }
          }
          const savedSender = window.localStorage.getItem(SENDER_PHONE_KEY);
          if (savedSender) setSenderPhone(savedSender);
        } catch {
          // Keep default
        }
      }
      void loadAlerts(phoneToLoad);
    });
    return () => {
      active = false;
    };
  }, [currentUser, loadAlerts]);

  async function handleSaveContact() {
    const cleanName = draftName.trim();
    const cleanPhone = normalizePhoneDigits(draftPhone);
    if (cleanName.length < 2) {
      setContactError('Vui lòng nhập tên người thân (tối thiểu 2 ký tự).');
      return;
    }
    if (!isValidVietnamesePhone(draftPhone)) {
      setContactError('Số điện thoại không hợp lệ (cần 10 số Việt Nam, VD: 0912345678).');
      return;
    }

    setContactError('');
    setContactName(cleanName);
    setContactPhone(cleanPhone);
    onContactLocalSaved?.(cleanName, cleanPhone);

    try {
      window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify({ name: cleanName, phone: cleanPhone }));
    } catch {
      // Ignore
    }
    if (currentUser) {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trustedName: cleanName, trustedPhone: cleanPhone }),
      });
      if (res.ok) {
        const data = (await res.json()) as { user?: AppUserProfile };
        if (data.user) onUserUpdated(data.user);
      }
    }
    setEditing(false);
    onNotify(currentUser ? 'Đã lưu & đồng bộ lên tài khoản.' : 'Đã lưu người thân tin cậy.');
    void loadAlerts(cleanPhone);
  }

  const shortContactName = contactName.split('(')[0].trim() || 'Người thân';
  const displayPhone = showPhone ? contactPhone : maskSensitiveTarget(contactPhone);
  const summarySnippet =
    scannedText.trim() || 'Cuộc gọi tự xưng Công an yêu cầu chuyển 50 triệu để xác minh.';
  const isSafeVerified = scanResult?.level === 'safe';

  const alertMessage = isSafeVerified
    ? `[XÁC MINH - LÁ CHẮN SỐ ĐỒNG NAI] Ba vừa kiểm tra nguồn chính thống (${
        scanResult?.badge ?? 'Đã xác thực'
      }): "${summarySnippet.slice(0, 120)}". Báo con yên tâm nhé!`
    : `[KHẨN - LÁ CHẮN SỐ ĐỒNG NAI] Ba vừa gặp nội dung cần cảnh giác (${
        scanResult?.badge ?? 'Mức NGUY HIỂM'
      }): "${summarySnippet.slice(0, 120)}". Xin con gọi lại xác minh ngay!`;

  async function handleConfirmSend() {
    setSending(true);
    try {
      const res = await fetch('/api/family-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPhone: contactPhone,
          senderName: currentUser?.fullName || 'Bác Tư (Đồng Nai)',
          riskLevel: scanResult?.level ?? 'danger',
          snippet: alertMessage,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { alert: FamilyAlertItem };
        setSessionSentId(data.alert.id);
        const nextList = [data.alert, ...alerts];
        setAlerts(nextList);
        try {
          window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(nextList.slice(0, 10)));
        } catch {
          // Ignore
        }
      }
    } finally {
      setSending(false);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Tin nhắn từ Lá Chắn Số', text: alertMessage });
        onNotify(`Đã gửi tin nhắn tới ${shortContactName}.`);
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(alertMessage);
      onNotify(`Đã đẩy tin lên hệ thống & sao chép gửi ${shortContactName}.`);
    } catch {
      onNotify(`Đã gửi tin cho ${shortContactName}.`);
    }
    void speakAlertVietnamese(`Đã gửi thẻ cảnh báo sang điện thoại của ${shortContactName}.`, 'family');
  }

  async function handleAcknowledge(id: string) {
    await fetch('/api/family-alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, acknowledgedBy: shortContactName }),
    });
    const updated = alerts.map((a) =>
      a.id === id ? { ...a, status: 'acknowledged' as const, acknowledgedBy: shortContactName } : a
    );
    setAlerts(updated);
    try {
      window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
    onNotify('Đã xác nhận đã nhận tin — máy người gửi sẽ thấy trạng thái này!');
  }

  const sessionAlert = sessionSentId ? alerts.find((a) => a.id === sessionSentId) : null;
  const cleanReceiverDigits = normalizePhoneDigits(contactPhone);
  const smsHref = `sms:${cleanReceiverDigits}?body=${encodeURIComponent(alertMessage)}`;

  return (
    <section className="space-y-4" data-screen="M03">
      <div className="flex items-center justify-between gap-2 px-1">
        <h1 className="font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
          Hỏi người thân
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9FAF5] px-3 py-1 text-[11px] font-bold text-[#0D685E]">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Che SĐT mặc định
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.05)]">
        <button
          type="button"
          onClick={() => setView('sender')}
          data-screen="M03"
          data-ui="tab-family-sender"
          className={`rounded-xl py-2 text-xs font-bold transition ${
            view === 'sender' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Góc nhìn người gửi
        </button>
        <button
          type="button"
          onClick={() => setView('receiver')}
          data-screen="M03"
          data-ui="tab-family-receiver"
          className={`rounded-xl py-2 text-xs font-bold transition ${
            view === 'receiver' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Người thân nhận {alerts.some((a) => a.status === 'sent') ? '• Mới' : ''}
        </button>
      </div>

      {view === 'sender' ? (
        <div className="space-y-3.5 rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#F4FBF8] p-3">
            <div className="text-xs">
              <div className="font-extrabold text-[#0F172A]">{contactName}</div>
              <div className="tabular-nums mt-0.5 font-bold text-[#0D685E]">{displayPhone}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPhone((p) => !p)}
                aria-label={showPhone ? 'Ẩn số điện thoại' : 'Hiện số điện thoại'}
                className="rounded-xl bg-white p-2 text-[#475569] shadow-sm"
              >
                {showPhone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftName(contactName);
                  setDraftPhone(contactPhone);
                  setContactError('');
                  setEditing((p) => !p);
                }}
                data-screen="M03"
                data-ui="btn-edit-family-contact"
                className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-[#0D685E] shadow-sm"
              >
                {editing ? 'Đóng' : 'Đổi số'}
              </button>
            </div>
          </div>

          {editing && (
            <div className="space-y-2 rounded-2xl bg-[#E9FAF5] p-3 text-xs">
              <input
                value={draftName}
                onChange={(e) => {
                  setDraftName(e.target.value);
                  if (contactError) setContactError('');
                }}
                placeholder="Tên người thân (VD: Chị Lan)"
                className="w-full rounded-xl bg-white p-2.5 outline-none"
              />
              <input
                value={draftPhone}
                onChange={(e) => {
                  setDraftPhone(e.target.value);
                  if (contactError) setContactError('');
                }}
                placeholder="Số điện thoại (VD: 0912345678)"
                className="w-full rounded-xl bg-white p-2.5 tabular-nums outline-none"
              />
              {contactError && (
                <p className="rounded-lg bg-[#FEF2F2] px-2.5 py-1.5 font-bold text-[#B91C1C]">
                  {contactError}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleSaveContact()}
                data-screen="M03"
                data-ui="btn-save-family-contact"
                className="w-full rounded-xl bg-[#0D685E] py-2.5 font-bold text-white"
              >
                Lưu người thân tin cậy
              </button>
            </div>
          )}

          <div
            className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
              isSafeVerified ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#FFFBEB] text-[#92400E]'
            }`}
          >
            <strong>{isSafeVerified ? 'Nội dung chia sẻ an toàn:' : 'Thẻ sẽ gửi đi (bạn tự bấm gửi):'}</strong>
            <p className="mt-1 text-[#0F172A] break-words">{alertMessage}</p>
          </div>

          {sessionAlert && (
            <div
              className={`rounded-2xl px-3 py-2 text-xs font-bold ${
                sessionAlert.status === 'acknowledged'
                  ? 'bg-[#ECFDF5] text-[#065F46]'
                  : 'bg-[#E9FAF5] text-[#0D685E]'
              }`}
            >
              {sessionAlert.status === 'acknowledged'
                ? `✓ ${sessionAlert.acknowledgedBy || shortContactName} đã xác nhận xem tin!`
                : `• Đã gửi tin lên hệ thống — chờ ${shortContactName} phản hồi`}
            </div>
          )}

          <button
            type="button"
            disabled={sending}
            onClick={() => void handleConfirmSend()}
            data-screen="M03"
            data-ui="btn-confirm-send-family"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] font-extrabold text-[#0F172A] shadow-[0_6px_18px_rgba(245,158,11,0.28)]"
          >
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
              <Share2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {sending ? 'Đang gửi...' : `Xác nhận gửi cho ${shortContactName} ngay`}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={smsHref}
              className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-[#F4FBF8] text-xs font-extrabold text-[#0F172A]"
            >
              <MessageSquare className="h-4 w-4 text-[#0D685E]" aria-hidden="true" />
              Nhắn SMS thật
            </a>
            <a
              href={`tel:${cleanReceiverDigits}`}
              data-screen="M03"
              data-ui="btn-call-family"
              className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-[#E9FAF5] text-xs font-extrabold text-[#0D685E]"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              Gọi {shortContactName}
            </a>
          </div>
        </div>
      ) : (
        <FamilyReceiverPanel
          alerts={alerts}
          fallbackMessage={alertMessage}
          senderPhone={senderPhone}
          refreshing={refreshing}
          onChangeSenderPhone={(p) => {
            setSenderPhone(p);
            try {
              window.localStorage.setItem(SENDER_PHONE_KEY, p);
            } catch {
              // Ignore
            }
          }}
          onRefresh={() => void loadAlerts(contactPhone)}
          onAcknowledge={(id) => void handleAcknowledge(id)}
          onNavigate={onNavigate}
        />
      )}

      <FamilyDeepfakeShieldCard onNotify={onNotify} />
    </section>
  );
}
