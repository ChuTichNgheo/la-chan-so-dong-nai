'use client';

import { useEffect, useState } from 'react';
import { Award, Clock, MessageCircleWarning, RotateCcw, Shield, UserRoundX, Video } from 'lucide-react';
import { CunAiSvg } from '@/components/CunAiMascot';
import { GAME_QUESTIONS } from '@/data/lessons-game';
import { VIDEOS_DATA } from '@/data/videos-data';
import type { AppUserProfile } from '@/types';

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
  const [tab, setTab] = useState<'game' | 'lessons'>('game');
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const isGameFinished = qIndex >= GAME_QUESTIONS.length || lives <= 0;
  const answered = chosenIdx !== null || timedOut;
  const currentQ = GAME_QUESTIONS[qIndex];

  useEffect(() => {
    if (tab !== 'game' || isGameFinished || answered) return;
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
  }, [tab, isGameFinished, answered, qIndex]);

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
    setQIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setLives(3);
    setSecondsLeft(10);
    setChosenIdx(null);
    setTimedOut(false);
  }

  const badgeTitle =
    correctCount >= 4
      ? 'Siêu Lá Chắn Đồng Nai'
      : correctCount >= 2
      ? 'Thám Tử Số Tiềm Năng'
      : 'Tân Binh Cần Ôn Video';

  return (
    <section className="space-y-4" data-screen="M06">
      <div className="flex items-center justify-between px-1">
        <h1 className="font-[family-name:var(--font-lexend)] text-xl font-extrabold text-[#0F172A]">
          Học tập &amp; Bắt Bài
        </h1>
        <span className="tabular-nums rounded-full bg-[#E9FAF5] px-3 py-1 text-xs font-extrabold text-[#0D685E]">
          {isGameFinished ? 'Hoàn thành' : `Màn ${qIndex + 1} / ${GAME_QUESTIONS.length}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_4px_16px_rgba(13,104,94,0.05)]">
        <button
          type="button"
          onClick={() => setTab('game')}
          data-screen="M06"
          data-ui="tab-game"
          className={`rounded-xl py-2 text-xs font-bold transition ${
            tab === 'game' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          Mini Game Bắt Bài
        </button>
        <button
          type="button"
          onClick={() => setTab('lessons')}
          data-screen="M06"
          data-ui="tab-lessons"
          className={`rounded-xl py-2 text-xs font-bold transition ${
            tab === 'lessons' ? 'bg-[#0D685E] text-white' : 'text-[#475569]'
          }`}
        >
          10 Bài học 1 phút
        </button>
      </div>

      {tab === 'game' ? (
        <div className="space-y-3">
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
                {secondsLeft}s
              </div>
              <div className="text-[10px] text-[#D1FAE5]">Phản xạ</div>
            </div>
          </div>

          {isGameFinished ? (
            <div className="space-y-3 rounded-3xl bg-white p-5 text-center shadow-[0_6px_24px_rgba(13,104,94,0.07)]">
              <div className="mx-auto w-fit">
                <CunAiSvg size={56} mood={correctCount >= 4 ? 'idle' : 'alert'} />
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-extrabold text-[#92400E]">
                <Award className="h-4 w-4" aria-hidden="true" />
                Huy hiệu: {badgeTitle}
              </div>
              <div className="tabular-nums font-[family-name:var(--font-lexend)] text-2xl font-extrabold text-[#0D685E]">
                {score} điểm ({correctCount}/{GAME_QUESTIONS.length})
              </div>
              <button
                type="button"
                onClick={() => onNotify('Đã sao chép link Mini Game thách đấu gia đình qua Zalo!')}
                className="w-full rounded-2xl bg-[#F59E0B] py-3 text-xs font-extrabold text-[#0F172A]"
              >
                Thách đấu cùng Gia đình
              </button>
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
            /* Chat App Simulator Card */
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(13,104,94,0.08)]">
              <div className="flex items-center justify-between bg-[#F1F5F9] px-4 py-2.5">
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

              {/* Live shrinking 10s countdown bar */}
              <div className="h-1.5 w-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-1000 linear ${
                    secondsLeft <= 3 ? 'bg-[#DC2626]' : 'bg-[#14B8A6]'
                  }`}
                  style={{ width: `${secondsLeft * 10}%` }}
                />
              </div>

              <div className="space-y-3 p-4">
                {/* Incoming Chat Bubble */}
                <div className="max-w-[92%] rounded-2xl rounded-tl-xs bg-[#F4FBF8] p-3.5 text-xs leading-relaxed text-[#0F172A] shadow-xs">
                  <p>{currentQ.message}</p>
                  <span className="mt-1.5 block text-[10px] font-medium text-[#64748B]">
                    Tin nhắn đến • Vừa xong
                  </span>
                </div>

                {/* Quick-Action Response Pills */}
                <div className="space-y-2 pt-1">
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
                        className={`w-full rounded-2xl p-3 text-left text-xs font-bold transition ${styleClass}`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className="space-y-2.5 rounded-2xl bg-[#F4FBF8] p-3.5 text-xs">
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
                        : 'Xem tổng kết & Huy hiệu'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {VIDEOS_DATA.map((item, idx) => (
            <div key={item.id} className="rounded-3xl bg-white p-4 text-xs shadow-[0_4px_18px_rgba(13,104,94,0.05)]">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                    item.src ? 'bg-[#FEF2F2] text-[#991B1B]' : 'bg-[#E9FAF5] text-[#0D685E]'
                  }`}
                >
                  {item.src ? 'VIDEO THẬT' : 'Bài học 1p'}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenVideoAt(idx)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F4FBF8] px-3 py-1 text-[11px] font-bold text-[#0D685E]"
                >
                  <Video className="h-3 w-3" aria-hidden="true" />
                  Xem ngay
                </button>
              </div>
              <h2 className="mt-2 font-extrabold text-[#0F172A]">{item.title}</h2>
              <p className="mt-1 text-[#475569]">{item.stepAction}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
