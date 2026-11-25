'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  Clock,
  Download,
  MessageCircleWarning,
  Play,
  RotateCcw,
  Share2,
  Shield,
  Sparkles,
  UserRoundX,
  Video,
} from 'lucide-react';
import { CunAiSvg } from '@/components/CunAiMascot';
import { GAME_QUESTIONS } from '@/data/lessons-game';
import { LESSONS_DATA, VIDEOS_DATA } from '@/data/videos-data';
import { renderGameBadgeCardDataUrl } from '@/lib/zalo-card-canvas';
import type { AppUserProfile } from '@/types';
import { ScamRoleplayArena } from './ScamRoleplayArena';

interface LearningScreenProps {
  currentUser: AppUserProfile | null;
  onUserUpdated: (user: AppUserProfile) => void;
  onOpenVideoAt: (index: number) => void;
  onNotify: (msg: string) => void;
}

export function LearningScreen({
  currentUser,
  onUserUpdated,
  onOpenVideoAt,
  onNotify,
}: LearningScreenProps) {
  const [tab, setTab] = useState<'roleplay' | 'game' | 'lessons'>('roleplay');
  const [started, setStarted] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [badgeCardUrl, setBadgeCardUrl] = useState<string | null>(null);

  const outOfLives = lives <= 0;
  const isGameFinished = qIndex >= GAME_QUESTIONS.length || outOfLives;
  const answered = chosenIdx !== null || timedOut;
  const currentQ = GAME_QUESTIONS[qIndex];

  useEffect(() => {
    if (!started || tab !== 'game' || isGameFinished || answered) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setTimedOut(true);
          setStreak(0);
          setLives((l) => Math.max(0, l - 1));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, tab, isGameFinished, answered, qIndex]);

  function handleSelectOption(idx: number) {
    if (answered || !currentQ) return;
    setChosenIdx(idx);
    const opt = currentQ.options[idx];
    if (opt.isCorrect) {
      const nextStreak = streak + 1;
      const bonus = 100 + (nextStreak > 1 ? 25 : 0);
      setStreak(nextStreak);
      setCorrectCount((c) => c + 1);
      setScore((s) => s + bonus);
    } else {
      setStreak(0);
      setLives((l) => Math.max(0, l - 1));
    }
  }

  function handleNextQuestion() {
    const nextIdx = qIndex + 1;
    setChosenIdx(null);
    setTimedOut(false);
    setSecondsLeft(10);
    setQIndex(nextIdx);

    if ((nextIdx >= GAME_QUESTIONS.length || lives <= 0) && currentUser) {
      const earnedBadge =
        correctCount >= 4
          ? 'Siêu Lá Chắn Đồng Nai'
          : correctCount >= 2
          ? 'Thám Tử Số Tiềm Năng'
          : 'Tân Binh Cần Ôn Video';
      void fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameScore: score, gameBadge: earnedBadge }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { user?: AppUserProfile } | null) => {
          if (d?.user) onUserUpdated(d.user);
        })
        .catch(() => {});
    }
  }

  function handleResetGame() {
    setStarted(true);
    setQIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setLives(3);
    setSecondsLeft(10);
    setChosenIdx(null);
    setTimedOut(false);
    setBadgeCardUrl(null);
  }

  const badgeTitle = outOfLives
    ? 'Hết 3 lá chắn — Hãy thử lại'
    : correctCount >= 4
    ? 'Siêu Lá Chắn Đồng Nai'
    : correctCount >= 2
    ? 'Thám Tử Số Tiềm Năng'
    : 'Tân Binh Cần Ôn Video';

  async function handleChallengeFamily() {
    const dataUrl = renderGameBadgeCardDataUrl({
      playerName: currentUser?.fullName || 'Công dân Số Đồng Nai',
      badgeTitle,
      scoreLabel: `${score} điểm (${correctCount}/${GAME_QUESTIONS.length} câu đúng)`,
      modeLabel: 'Thử thách Phản xạ 10 giây',
    });
    if (dataUrl) setBadgeCardUrl(dataUrl);

    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const challengeMsg = `🛡️ Tôi vừa đạt ${score} điểm (${badgeTitle}) ở Mini Game Bắt Bài Lừa Đảo 10 giây trên Lá Chắn Số Đồng Nai! Cả nhà thử xem ai đạt điểm cao hơn nhé: ${shareUrl}`;

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Thách đấu Lá Chắn Số Đồng Nai', text: challengeMsg });
        onNotify('Đã xuất Thẻ Huy Hiệu PNG & chia sẻ thách đấu Gia đình!');
        return;
      }
      await navigator.clipboard.writeText(challengeMsg);
      onNotify('Đã tạo Thẻ Huy Hiệu PNG & sao chép link thách đấu dán Zalo!');
    } catch {
      onNotify('Đã tạo Thẻ Huy Hiệu PNG bên dưới — bấm Tải ảnh để gửi Zalo!');
    }
  }

  const headerBadge =
    tab === 'roleplay'
      ? 'AI Nhập Vai'
      : tab === 'lessons'
      ? `${LESSONS_DATA.length} bài học 1p`
      : !started
      ? `${GAME_QUESTIONS.length} tình huống`
      : outOfLives
      ? 'Hết lá chắn'
      : isGameFinished
      ? 'Hoàn thành'
      : `Màn ${qIndex + 1} / ${GAME_QUESTIONS.length}`;

  return (
    <section className="space-y-4" data-screen="M06">
      <div className="flex items-center justify-between px-1">
        <h1 className="font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
          Học tập &amp; Bắt Bài
        </h1>
        <span className="tabular-nums rounded-full bg-[#E9FAF5] px-3 py-1 text-xs font-extrabold text-[#0D685E]">
          {headerBadge}
        </span>
      </div>

      {/* 3-Tab Switcher: AI Roleplay | 10s Quiz | 10 Lessons */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.05)]">
        <button
          type="button"
          onClick={() => setTab('roleplay')}
          data-screen="M06"
          data-ui="tab-roleplay"
          className={`inline-flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-extrabold transition ${
            tab === 'roleplay' ? 'bg-[#0D685E] text-white shadow-xs' : 'text-[#475569]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Đấu trí AI
        </button>
        <button
          type="button"
          onClick={() => setTab('game')}
          data-screen="M06"
          data-ui="tab-game"
          className={`rounded-xl py-2 text-[11px] font-bold transition ${
            tab === 'game' ? 'bg-[#0D685E] text-white shadow-xs' : 'text-[#475569]'
          }`}
        >
          Bắt Bài 10s
        </button>
        <button
          type="button"
          onClick={() => setTab('lessons')}
          data-screen="M06"
          data-ui="tab-lessons"
          className={`rounded-xl py-2 text-[11px] font-bold transition ${
            tab === 'lessons' ? 'bg-[#0D685E] text-white shadow-xs' : 'text-[#475569]'
          }`}
        >
          10 Bài học
        </button>
      </div>

      {tab === 'roleplay' ? (
        <ScamRoleplayArena
          currentUser={currentUser}
          onUserUpdated={onUserUpdated}
          onNotify={onNotify}
        />
      ) : tab === 'game' ? (
        <div className="space-y-3">
          {!started ? (
            <div className="space-y-3.5 rounded-3xl bg-white p-5 text-center shadow-[0_8px_28px_rgba(13,104,94,0.08)]">
              <div className="mx-auto w-fit">
                <CunAiSvg size={56} mood="idle" />
              </div>
              <h2 className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-[#0F172A]">
                Thử thách phản xạ 10 giây
              </h2>
              <p className="text-xs leading-relaxed text-[#475569]">
                Đọc nhanh 5 tin nhắn giả lập thực tế tại Đồng Nai. Bạn có 3 lá chắn và 10 giây
                phản xạ mỗi tình huống để bắt bài kẻ gian.
              </p>
              <button
                type="button"
                onClick={handleResetGame}
                data-screen="M06"
                data-ui="btn-start-game"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0D685E] text-sm font-extrabold text-white shadow-md"
              >
                <Play className="h-4 w-4 fill-white" aria-hidden="true" />
                Bắt đầu thử thách
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1.5 rounded-3xl bg-[#0D685E] p-3 text-center text-white tabular-nums shadow-md">
                <div>
                  <div className="text-base font-extrabold">{score}</div>
                  <div className="text-[10px] text-[#D1FAE5]">Điểm số</div>
                </div>
                <div>
                  <div className="text-base font-extrabold">x{streak}</div>
                  <div className="text-[10px] text-[#D1FAE5]">Chuỗi</div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-0.5 text-base font-extrabold">
                    <Shield className="h-3.5 w-3.5 text-[#FCD34D]" aria-hidden="true" />
                    {lives}/3
                  </div>
                  <div className="text-[10px] text-[#D1FAE5]">Lá chắn</div>
                </div>
                <div>
                  <div
                    className={`inline-flex items-center gap-0.5 text-base font-extrabold ${
                      secondsLeft <= 3 && !answered ? 'text-[#FCD34D]' : ''
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {isGameFinished ? 'Xong' : `${secondsLeft}s`}
                  </div>
                  <div className="text-[10px] text-[#D1FAE5]">Phản xạ</div>
                </div>
              </div>

              {isGameFinished ? (
                <div className="space-y-3 rounded-3xl bg-white p-5 text-center shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
                  <div className="mx-auto w-fit">
                    <CunAiSvg size={56} mood={outOfLives || correctCount < 2 ? 'alert' : 'idle'} />
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                      outOfLives ? 'bg-[#FEF2F2] text-[#991B1B]' : 'bg-[#FFFBEB] text-[#92400E]'
                    }`}
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    {badgeTitle}
                  </div>
                  <div className="tabular-nums font-[family-name:var(--font-lexend)] text-2xl font-extrabold text-[#0D685E]">
                    {score} điểm ({correctCount}/{GAME_QUESTIONS.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleChallengeFamily()}
                    data-screen="M06"
                    data-ui="btn-challenge-family-png"
                    className="flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#F59E0B] text-xs font-extrabold text-[#0F172A] shadow-sm"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    Xuất Thẻ Huy Hiệu PNG &amp; Thách đấu Gia đình
                  </button>

                  {badgeCardUrl && (
                    <div className="space-y-2 rounded-2xl bg-[#F4FBF8] p-3 text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={badgeCardUrl}
                        alt="Thẻ Huy Hiệu Lá Chắn Số Đồng Nai"
                        className="w-full rounded-xl shadow-sm"
                      />
                      <a
                        href={badgeCardUrl}
                        download="huy-hieu-la-chan-so-dong-nai.png"
                        className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#0D685E] text-xs font-extrabold text-white"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Tải ảnh Thẻ Huy Hiệu (.png) gửi Zalo
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetGame}
                    data-screen="M06"
                    data-ui="btn-reset-game"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#E9FAF5] py-3 text-xs font-bold text-[#0D685E]"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Chơi lại từ đầu
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(13,104,94,0.08)]">
                  <div className="flex items-center justify-between bg-[#F1F5F9] px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FEF2F2] text-[#B91C1C]">
                        <UserRoundX className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-xs font-extrabold text-[#0F172A]">{currentQ.sender}</div>
                        <div className="text-[10px] font-semibold text-[#64748B]">
                          {currentQ.role} • Người lạ
                        </div>
                      </div>
                    </div>
                    <MessageCircleWarning className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                  </div>

                  <div className="h-1.5 w-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-1000 linear ${
                        secondsLeft <= 3 ? 'bg-[#DC2626]' : 'bg-[#14B8A6]'
                      }`}
                      style={{ width: `${secondsLeft * 10}%` }}
                    />
                  </div>

                  <div className="space-y-2.5 p-3.5">
                    <div className="max-w-[94%] rounded-2xl rounded-tl-xs bg-[#F4FBF8] p-3 text-xs leading-relaxed text-[#0F172A] shadow-xs">
                      <p>{currentQ.message}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#0D685E]">
                        Chọn phản xạ của bạn:
                      </div>
                      {currentQ.options.map((opt, idx) => {
                        const styleClass = answered
                          ? opt.isCorrect
                            ? 'bg-[#ECFDF5] text-[#065F46] ring-2 ring-[#059669]'
                            : idx === chosenIdx
                            ? 'bg-[#FEF2F2] text-[#991B1B] ring-2 ring-[#DC2626]'
                            : 'bg-slate-50 opacity-50'
                          : 'bg-slate-100 text-[#0F172A] hover:bg-[#E9FAF5] active:scale-[0.99]';
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={answered}
                            onClick={() => handleSelectOption(idx)}
                            data-screen="M06"
                            data-ui={`btn-quiz-opt-${idx}`}
                            className={`w-full rounded-2xl p-2.5 text-left text-xs font-bold transition ${styleClass}`}
                          >
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div className="space-y-2 rounded-2xl bg-[#F4FBF8] p-3 text-xs">
                        <div className="font-extrabold text-[#0D685E]">
                          {timedOut
                            ? 'Hết 10 giây! (-1 lá chắn)'
                            : chosenIdx !== null && currentQ.options[chosenIdx]?.isCorrect
                            ? 'Bắt bài chính xác!'
                            : 'Sập bẫy rồi (-1 lá chắn)'}
                        </div>
                        <p className="text-[#1E293B]">{currentQ.explanation}</p>
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          data-screen="M06"
                          data-ui="btn-next-question"
                          className="w-full rounded-2xl bg-[#0D685E] py-2.5 font-bold text-white"
                        >
                          {qIndex + 1 < GAME_QUESTIONS.length && lives > 0
                            ? 'Qua tình huống tiếp theo →'
                            : 'Xem kết quả'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {LESSONS_DATA.map((item) => {
            const realVideoIdx = item.src
              ? VIDEOS_DATA.findIndex((v) => v.id === item.id)
              : -1;
            return (
              <div key={item.id} className="rounded-3xl bg-white p-4 text-xs shadow-[0_4px_18px_rgba(13,104,94,0.05)]">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      realVideoIdx >= 0 ? 'bg-[#FEF2F2] text-[#991B1B]' : 'bg-[#E9FAF5] text-[#0D685E]'
                    }`}
                  >
                    {realVideoIdx >= 0 ? 'VIDEO THẬT' : 'Bài học 1p'}
                  </span>
                  {realVideoIdx >= 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenVideoAt(realVideoIdx)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F4FBF8] px-3 py-1 text-[11px] font-bold text-[#0D685E]"
                    >
                      <Video className="h-3 w-3" aria-hidden="true" />
                      Xem ngay
                    </button>
                  )}
                </div>
                <h2 className="mt-2 font-extrabold text-[#0F172A]">{item.title}</h2>
                <p className="mt-1 text-[#475569]">{item.stepAction}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
