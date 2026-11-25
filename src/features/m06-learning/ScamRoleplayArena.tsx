'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bot,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRoundX,
} from 'lucide-react';
import { renderGameBadgeCardDataUrl } from '@/lib/zalo-card-canvas';
import type { AppUserProfile } from '@/types';

type ScenarioId = 'job' | 'police' | 'friend';

interface ChatTurn {
  role: 'scammer' | 'user';
  text: string;
}

interface RoleplayEvaluation {
  awarenessScore: number;
  badge: string;
  strengths: string[];
  mistakes: string[];
  goldenTip: string;
}

interface ScamRoleplayArenaProps {
  currentUser: AppUserProfile | null;
  onUserUpdated: (user: AppUserProfile) => void;
  onNotify: (msg: string) => void;
}

const SCENARIOS: Array<{
  id: ScenarioId;
  badge: string;
  badgeClass: string;
  title: string;
  senderName: string;
  senderSub: string;
  opening: string;
  quickReplies: string[];
}> = [
  {
    id: 'job',
    badge: 'Học sinh THPT',
    badgeClass: 'bg-[#EEF2FF] text-[#3730A3]',
    title: 'Tuyển CTV việc nhẹ nạp 200k',
    senderName: 'HR Tuyển Dụng ShopeeMall',
    senderSub: 'Tài khoản lạ • Zalo',
    opening:
      'Chào bạn! Bên mình tuyển CTV bấm tim video tại nhà 300k–500k/ngày cho học sinh, sinh viên Đồng Nai. Nhiệm vụ đầu chỉ cần nạp 200k kích hoạt tài khoản ở http://nhiemvu-ctv-dn.xyz, 3 phút sau hoàn lại 250k ngay. Bạn gửi STK để mình lên đơn nhé?',
    quickReplies: [
      'Không nhé, việc gì đòi nạp tiền trước và gửi link .xyz là lừa đảo!',
      'Thật không bạn, làm sao để rút tiền về tài khoản?',
      'Để mình hỏi ba mẹ và kiểm tra trên Lá Chắn Số trước đã.',
    ],
  },
  {
    id: 'police',
    badge: 'Nguy hiểm cao',
    badgeClass: 'bg-[#FEF2F2] text-[#B91C1C]',
    title: 'Giả Công an Biên Hòa dọa khởi tố',
    senderName: 'Cán bộ Điều tra (Số lạ)',
    senderSub: 'Cuộc gọi lạ • Tự xưng Công an',
    opening:
      'Tôi là cán bộ điều tra Công an Biên Hòa. CCCD của anh/chị đang liên quan vụ án rửa tiền 2 tỷ đồng. Yêu cầu giữ bí mật tuyệt đối, không báo người thân và chuyển ngay số dư vào tài khoản tạm giữ để xác minh trong hôm nay nếu không sẽ có lệnh bắt!',
    quickReplies: [
      'Công an không bao giờ đòi chuyển tiền qua điện thoại. Tôi ra Công an phường xác minh!',
      'Tôi không biết gì cả, tôi cần giữ bí mật thật sao?',
      'Gửi giấy mời chính thức về phường đi, tôi cúp máy và báo 113 đây!',
    ],
  },
  {
    id: 'friend',
    badge: 'Hay gặp trên Zalo',
    badgeClass: 'bg-[#FFFBEB] text-[#92400E]',
    title: 'Giả bạn thân hack Zalo mượn 3 triệu',
    senderName: 'Minh Anh (Bạn thân?)',
    senderSub: 'Tin nhắn Zalo • STK tên người lạ',
    opening:
      'Ê cậu ơi cứu tớ gấp với! Xe tớ vừa bị hư giữa đường ở Quốc lộ 1A, app ngân hàng lại lỗi. Cậu chuyển gấp giúp tớ 3 triệu vào STK 109800006621 (chủ TK Nguyễn Văn Lạ — tiệm sửa xe) trước nhé, tối về tớ gửi lại liền!',
    quickReplies: [
      'Bật gọi video thấy mặt cậu hoặc gọi số di động trực tiếp rồi tớ mới tin!',
      'Sao số tài khoản lại tên người lạ vậy? Tớ không chuyển đâu nhé.',
      'Chờ xíu để tớ mở app chuyển trước 1 triệu được không?',
    ],
  },
];

export function ScamRoleplayArena({
  currentUser,
  onUserUpdated,
  onNotify,
}: ScamRoleplayArenaProps) {
  const [selectedId, setSelectedId] = useState<ScenarioId | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<RoleplayEvaluation | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activeScenario = SCENARIOS.find((s) => s.id === selectedId) ?? null;
  const userTurns = messages.filter((m) => m.role === 'user').length;

  function startScenario(id: ScenarioId) {
    const found = SCENARIOS.find((s) => s.id === id);
    if (!found) return;
    setSelectedId(id);
    setMessages([{ role: 'scammer', text: found.opening }]);
    setSuggestedReplies(found.quickReplies);
    setDraft('');
    setEvaluation(null);
    setBadgePreview(null);
  }

  async function sendReply(textToSend: string, finishNow = false) {
    if (!selectedId || loading || evaluation) return;
    const clean = textToSend.trim();
    if (!clean && !finishNow) return;

    const nextMessages: ChatTurn[] = clean
      ? [...messages, { role: 'user', text: clean }]
      : messages;

    setMessages(nextMessages);
    setDraft('');
    setLoading(true);

    try {
      const res = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedId,
          messages: nextMessages,
          finishNow,
        }),
      });
      const data = (await res.json()) as {
        finished: boolean;
        scammerReply: string;
        suggestedReplies?: string[];
        evaluation?: RoleplayEvaluation;
      };

      const updatedMessages: ChatTurn[] = [
        ...nextMessages,
        { role: 'scammer', text: data.scammerReply },
      ];
      setMessages(updatedMessages);
      if (Array.isArray(data.suggestedReplies) && data.suggestedReplies.length > 0) {
        setSuggestedReplies(data.suggestedReplies);
      }

      if (data.finished && data.evaluation) {
        setEvaluation(data.evaluation);
        if (currentUser) {
          const earnedPoints = Math.max(currentUser.gameScore, data.evaluation.awarenessScore * 5);
          void fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameScore: earnedPoints,
              gameBadge: data.evaluation.badge,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((d: { user?: AppUserProfile } | null) => {
              if (d?.user) onUserUpdated(d.user);
            })
            .catch(() => {});
        }
      }
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch {
      onNotify('Mạng hơi chập chờn — bạn bấm gửi lại giúp nhé.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShareBadge() {
    if (!evaluation) return;
    const dataUrl = renderGameBadgeCardDataUrl({
      playerName: currentUser?.fullName || 'Công dân Số Đồng Nai',
      badgeTitle: evaluation.badge,
      scoreLabel: `Độ tỉnh táo ${evaluation.awarenessScore}/100`,
      modeLabel: 'Đấu trí AI Bắt bài',
    });
    if (!dataUrl) return;
    setBadgePreview(dataUrl);

    const challengeText = `🛡️ Tôi vừa đạt Độ tỉnh táo ${evaluation.awarenessScore}/100 (${evaluation.badge}) khi đấu trí trực tiếp với Kẻ lừa đảo AI trên Lá Chắn Số Đồng Nai! Cả nhà thử thách đấu xem ai bắt bài nhanh hơn nhé!`;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Thẻ Huy Hiệu Lá Chắn Số', text: challengeText });
        onNotify('Đã mở chia sẻ Thẻ Huy Hiệu thách đấu gia đình!');
        return;
      }
      await navigator.clipboard.writeText(challengeText);
      onNotify('Đã tạo Thẻ Huy Hiệu PNG & sao chép lời thách đấu gửi Zalo!');
    } catch {
      onNotify('Đã tạo Thẻ Huy Hiệu PNG — bấm Tải ảnh bên dưới để gửi Zalo!');
    }
  }

  if (!activeScenario) {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#133B3A] to-[#0D685E] p-4 text-white shadow-md">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#6EE7B7]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Mới • Gemini AI Nhập Vai Thực Chiến
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-lexend)] text-base font-extrabold">
            Đấu trí trực tiếp với Kẻ lừa đảo AI
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#D1FAE5]">
            Chat tự do 3 lượt với AI đóng vai kẻ gian thật tại Đồng Nai. AI sẽ đánh vào tâm lý,
            sau đó chấm <strong>Độ Tỉnh Táo (0–100)</strong> và chỉ rõ câu nào bạn bị sơ hở!
          </p>
        </div>

        <div className="space-y-2.5">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => startScenario(sc.id)}
              data-screen="M06"
              data-ui={`btn-roleplay-${sc.id}`}
              className="flex w-full items-center justify-between gap-3 rounded-3xl bg-white p-4 text-left shadow-[0_6px_20px_rgba(13,104,94,0.06)] transition hover:ring-2 hover:ring-[#0D685E] active:scale-[0.99]"
            >
              <div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${sc.badgeClass}`}>
                  {sc.badge}
                </span>
                <div className="mt-1.5 font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0F172A]">
                  {sc.title}
                </div>
                <div className="mt-0.5 text-[11px] text-[#475569]">{sc.senderName}</div>
              </div>
              <span className="shrink-0 rounded-2xl bg-[#0D685E] px-3 py-2 text-xs font-extrabold text-white">
                Đấu trí →
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chat Header */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(13,104,94,0.08)]">
        <div className="flex items-center justify-between gap-2 bg-[#0F172A] px-4 py-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#DC2626] text-white">
              <UserRoundX className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <div className="text-xs font-extrabold">{activeScenario.senderName}</div>
              <div className="text-[10.5px] text-slate-300">
                {activeScenario.senderSub} • Lượt {Math.min(userTurns + (evaluation ? 0 : 1), 3)}/3
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setEvaluation(null);
              setBadgePreview(null);
            }}
            className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white"
          >
            Đổi kịch bản
          </button>
        </div>

        {/* Messages Stream */}
        <div className="max-h-[300px] space-y-2.5 overflow-y-auto bg-[#F8FCFA] p-3.5 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'rounded-tr-xs bg-[#0D685E] font-medium text-white'
                    : 'rounded-tl-xs border border-[#FECACA] bg-white text-[#0F172A]'
                }`}
              >
                {msg.role === 'scammer' && (
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] font-extrabold text-[#B91C1C]">
                    <Bot className="h-3 w-3" aria-hidden="true" />
                    Kẻ gian mô phỏng
                  </div>
                )}
                <p className="break-words">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0D685E]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Đối tượng đang phản hồi...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input + Quick Replies (while active) */}
        {!evaluation && (
          <div className="space-y-2 border-t border-slate-100 bg-white p-3">
            <div className="flex flex-wrap gap-1.5">
              {(suggestedReplies.length > 0 ? suggestedReplies : activeScenario.quickReplies).map((qr, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendReply(qr)}
                  className="rounded-xl bg-[#E9FAF5] px-2.5 py-1.5 text-left text-[11px] font-bold text-[#0D685E] transition hover:bg-[#D1FAE5]"
                >
                  {qr}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendReply(draft);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Gõ câu bạn muốn đáp trả kẻ lừa đảo..."
                className="min-h-[42px] flex-1 rounded-2xl bg-[#F4FBF8] px-3 text-xs outline-none focus:ring-2 focus:ring-[#0D685E]"
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                data-screen="M06"
                data-ui="btn-roleplay-send"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-2xl bg-[#0D685E] text-white disabled:opacity-45"
                aria-label="Gửi câu trả lời"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
            {userTurns >= 1 && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void sendReply('Tôi cúp máy và chặn số này ngay đây!', true)}
                className="w-full rounded-xl bg-[#FEF2F2] py-2 text-[11px] font-extrabold text-[#991B1B]"
              >
                Cúp máy &amp; Chấm điểm Độ Tỉnh Táo ngay
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Evaluation Card (0-100 Awareness Score + Mistakes) */}
      {evaluation && (
        <div className="space-y-3 rounded-3xl border-2 border-[#0D685E] bg-white p-4 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[11px] font-extrabold text-[#92400E]">
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                {evaluation.badge}
              </span>
              <h3 className="mt-1 font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0F172A]">
                Kết quả Đấu trí AI
              </h3>
            </div>
            <div className="text-right tabular-nums">
              <div
                className={`font-[family-name:var(--font-lexend)] text-3xl font-extrabold leading-none ${
                  evaluation.awarenessScore >= 80
                    ? 'text-[#059669]'
                    : evaluation.awarenessScore >= 55
                    ? 'text-[#D97706]'
                    : 'text-[#DC2626]'
                }`}
              >
                {evaluation.awarenessScore}
                <span className="text-sm text-[#64748B]">/100</span>
              </div>
              <div className="text-[10.5px] font-bold text-[#475569]">Độ tỉnh táo</div>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                evaluation.awarenessScore >= 80
                  ? 'bg-[#059669]'
                  : evaluation.awarenessScore >= 55
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#DC2626]'
              }`}
              style={{ width: `${evaluation.awarenessScore}%` }}
            />
          </div>

          <div className="space-y-2 text-xs">
            <div className="rounded-2xl bg-[#ECFDF5] p-3 text-[#065F46]">
              <div className="mb-1 flex items-center gap-1 font-extrabold">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Điểm làm tốt
              </div>
              <ul className="space-y-1">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-[#FFFBEB] p-3 text-[#92400E]">
              <div className="mb-1 flex items-center gap-1 font-extrabold">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Lưu ý / Lỗi sơ hở
              </div>
              <ul className="space-y-1">
                {evaluation.mistakes.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2 rounded-2xl bg-[#E9FAF5] p-3 text-[#0D685E]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-bold leading-relaxed">{evaluation.goldenTip}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleShareBadge()}
              data-screen="M06"
              data-ui="btn-roleplay-share-badge"
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-[#F59E0B] px-3 text-xs font-extrabold text-[#0F172A]"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Xuất Thẻ PNG
            </button>
            <button
              type="button"
              onClick={() => startScenario(activeScenario.id)}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-[#E9FAF5] px-3 text-xs font-bold text-[#0D685E]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Đấu lại kịch bản
            </button>
          </div>

          {badgePreview && (
            <div className="space-y-2 rounded-2xl bg-[#F4FBF8] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgePreview}
                alt="Thẻ Huy Hiệu Đấu trí AI"
                className="w-full rounded-xl shadow-sm"
              />
              <a
                href={badgePreview}
                download="huy-hieu-dau-tri-ai-dong-nai.png"
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#0D685E] text-xs font-extrabold text-white"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Tải Thẻ Huy Hiệu (.png) gửi Zalo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
