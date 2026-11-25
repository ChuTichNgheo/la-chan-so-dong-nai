'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { VIDEOS_DATA } from '@/data/videos-data';
import { stopVietnameseSpeech } from '@/lib/speech';
import type { ScreenId } from '@/types';
import { VideoSlideCard } from './VideoSlideCard';

interface VideosScreenProps {
  initialIndex?: number;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

export function VideosScreen({ initialIndex = 0, onNavigate, onNotify }: VideosScreenProps) {
  const [filter, setFilter] = useState<'all' | 'senior' | 'student'>('all');
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [largeCaption, setLargeCaption] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const filtered = filter === 'all' ? VIDEOS_DATA : VIDEOS_DATA.filter((v) => v.group === filter);
  const safeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));
  const current = filtered[safeIndex] ?? VIDEOS_DATA[0];

  useEffect(() => {
    const el = feedRef.current;
    if (el && initialIndex > 0) {
      el.scrollTo({ top: initialIndex * el.clientHeight, behavior: 'instant' as ScrollBehavior });
    }
    return () => stopVietnameseSpeech();
  }, [initialIndex]);

  function handleFilterChange(nextFilter: 'all' | 'senior' | 'student') {
    stopVietnameseSpeech();
    setFilter(nextFilter);
    setActiveIndex(0);
    setShowDetails(false);
    feedRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function handleScroll() {
    const el = feedRef.current;
    if (!el || el.clientHeight === 0) return;
    const nextIdx = Math.round(el.scrollTop / el.clientHeight);
    if (nextIdx !== activeIndex && nextIdx >= 0 && nextIdx < filtered.length) {
      stopVietnameseSpeech();
      setShowDetails(false);
      setActiveIndex(nextIdx);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const el = feedRef.current;
    if (!el) return;
    if (e.key === 'ArrowDown' && safeIndex < filtered.length - 1) {
      e.preventDefault();
      el.scrollBy({ top: el.clientHeight, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' && safeIndex > 0) {
      e.preventDefault();
      el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' });
    }
  }

  function handleToggleMute() {
    const nextMuted = !muted;
    setMuted(nextMuted);
    onNotify(nextMuted ? 'Đã tắt tiếng video' : 'Đã bật tiếng video');
  }

  return (
    <section
      data-screen="M05"
      className="relative h-full w-full select-none overflow-hidden bg-[#040D10] text-white"
    >
      {/* Segmented Stories Progress Bars */}
      <div className="pointer-events-none absolute inset-x-3 top-2 z-30 flex gap-1">
        {filtered.map((item, idx) => (
          <div key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                idx < safeIndex
                  ? 'w-full bg-white'
                  : idx === safeIndex
                  ? 'w-full bg-[#F59E0B]'
                  : 'w-0 bg-white'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Top floating glass filter bar */}
      <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-between gap-2 px-3 pt-1">
        <div className="flex gap-1.5 rounded-full bg-black/45 p-1 backdrop-blur-md">
          {(
            [
              { id: 'all', label: `Tất cả (${VIDEOS_DATA.length})` },
              { id: 'senior', label: '65+' },
              { id: 'student', label: 'THPT' },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleFilterChange(pill.id)}
              data-screen="M05"
              data-ui={`filter-video-${pill.id}`}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                filter === pill.id ? 'bg-white text-[#0F172A]' : 'text-white/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <span className="tabular-nums rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-extrabold text-[#FCD34D] backdrop-blur-md">
          {filtered.length === 0 ? '0 / 0' : `${safeIndex + 1} / ${filtered.length}`}
        </span>
      </div>

      {/* True TikTok Vertical Scroll-Snap Feed */}
      <div
        ref={feedRef}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        aria-label="Danh sách video ngắn phòng chống lừa đảo"
        className="no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain outline-none"
      >
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="font-[family-name:var(--font-lexend)] text-base font-extrabold text-white">
              Chưa có video thật cho nhóm này
            </p>
            <p className="mt-1.5 text-xs text-white/70">
              Quản trị viên Đội TNTN có thể đăng thêm video tuyên truyền mới vào mục này.
            </p>
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className="mt-4 rounded-full bg-[#F59E0B] px-4 py-2 text-xs font-extrabold text-[#0F172A]"
            >
              Xem tất cả ({VIDEOS_DATA.length})
            </button>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <VideoSlideCard
              key={item.id}
              item={item}
              displayIndex={idx + 1}
              isActive={idx === safeIndex}
              isFirst={idx === 0}
              muted={muted}
              largeCaption={largeCaption}
              onToggleMute={handleToggleMute}
              onToggleCaption={() => setLargeCaption((p) => !p)}
              onOpenDetails={() => setShowDetails(true)}
              onNavigate={onNavigate}
              onNotify={onNotify}
            />
          ))
        )}
      </div>

      {showDetails && (
        <div
          className="absolute inset-0 z-30 flex items-end bg-black/55 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetails(false);
          }}
        >
          <div className="w-full rounded-t-3xl bg-white p-4 text-[#0F172A] shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0D685E]">
                Tóm tắt nhanh 3 bước
              </h2>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                aria-label="Đóng tóm tắt"
                className="rounded-full bg-slate-100 p-1.5 text-[#475569]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs leading-relaxed">
              <p className="rounded-2xl bg-[#F4FBF8] p-3">
                <strong className="text-[#0D685E]">Chiêu trò:</strong> {current.stepTrick}
              </p>
              <p className="rounded-2xl bg-[#FFFBEB] p-3">
                <strong className="text-[#92400E]">Dấu hiệu / Hậu quả:</strong> {current.stepSign}
              </p>
              <p className="rounded-2xl bg-[#ECFDF5] p-3">
                <strong className="text-[#065F46]">Cách xử lý:</strong> {current.stepAction}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
