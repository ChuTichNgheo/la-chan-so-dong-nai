'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Gamepad2,
  Pause,
  Play,
  Share2,
  ShieldAlert,
  Type,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { VIDEOS_DATA } from '@/data/videos-data';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';
import type { ScreenId } from '@/types';

interface VideosScreenProps {
  initialIndex?: number;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

export function VideosScreen({ initialIndex = 0, onNavigate, onNotify }: VideosScreenProps) {
  const [filter, setFilter] = useState<'all' | 'senior' | 'student'>('all');
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [largeCaption, setLargeCaption] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [speakingStory, setSpeakingStory] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  const filtered = filter === 'all' ? VIDEOS_DATA : VIDEOS_DATA.filter((v) => v.group === filter);
  const safeIndex = index % Math.max(1, filtered.length);
  const current = filtered[safeIndex] ?? VIDEOS_DATA[0];
  const hasRealVideo = Boolean(current.src) && !videoFailed;

  useEffect(() => {
    return () => stopVietnameseSpeech();
  }, []);

  function handleFilterChange(nextFilter: 'all' | 'senior' | 'student') {
    setFilter(nextFilter);
    setIndex(0);
    setShowDetails(false);
    setVideoFailed(false);
    setSpeakingStory(false);
    stopVietnameseSpeech();
  }

  function handleStep(delta: number) {
    stopVietnameseSpeech();
    setSpeakingStory(false);
    setShowDetails(false);
    setVideoFailed(false);
    setPlaying(true);
    setIndex((prev) => (prev + delta + filtered.length) % filtered.length);
  }

  function handleTogglePlay() {
    const next = !playing;
    setPlaying(next);
    if (hasRealVideo && videoRef.current) {
      if (next) void videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    } else if (!next) {
      stopVietnameseSpeech();
      setSpeakingStory(false);
    }
  }

  function handleToggleAudio() {
    if (hasRealVideo && videoRef.current) {
      const nextMuted = !muted;
      videoRef.current.muted = nextMuted;
      setMuted(nextMuted);
      if (!nextMuted) void videoRef.current.play().catch(() => {});
      onNotify(nextMuted ? 'Đã tắt tiếng video' : 'Đã bật tiếng video thật');
      return;
    }
    if (speakingStory) {
      stopVietnameseSpeech();
      setSpeakingStory(false);
      return;
    }
    setSpeakingStory(true);
    void speakAlertVietnamese(
      `${current.title}. ${current.caption} ${current.stepAction}`,
      current.audioKey
    );
  }

  return (
    <section
      data-screen="M05"
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartY.current === null) return;
        const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
        const delta = touchStartY.current - endY;
        touchStartY.current = null;
        if (delta > 50) handleStep(1);
        else if (delta < -50) handleStep(-1);
      }}
      className="relative h-full w-full select-none overflow-hidden bg-gradient-to-b from-[#072623] via-[#081A1E] to-[#040D10] text-white"
    >
      {/* Segmented Stories Progress Bars */}
      <div className="absolute inset-x-3 top-2 z-30 flex gap-1">
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

      {/* Full-bleed background video OR Animated Story Reels Card */}
      {hasRealVideo ? (
        <video
          ref={videoRef}
          key={current.src}
          src={current.src}
          autoPlay
          loop
          playsInline
          preload="metadata"
          muted={muted}
          onClick={handleTogglePlay}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          onClick={handleTogglePlay}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-32"
        >
          <div className="w-full max-w-[330px] rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B91C1C] px-2.5 py-1 text-[10px] font-extrabold">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                {current.trend}
              </span>
              <div className="flex h-4 items-end gap-0.5">
                <span className={`w-1 rounded-full bg-[#34D399] ${playing ? 'h-4 animate-wave-1' : 'h-1.5'}`} />
                <span className={`w-1 rounded-full bg-[#34D399] ${playing ? 'h-4 animate-wave-2' : 'h-2.5'}`} />
                <span className={`w-1 rounded-full bg-[#34D399] ${playing ? 'h-4 animate-wave-3' : 'h-1.5'}`} />
              </div>
            </div>

            <p className={`mt-4 font-[family-name:var(--font-lexend)] font-extrabold leading-snug text-white ${largeCaption ? 'text-xl' : 'text-base'}`}>
              {current.caption}
            </p>

            <div className="mt-4 rounded-2xl bg-black/35 p-3 text-xs leading-relaxed text-[#D1FAE5]">
              <strong className="text-[#FCD34D]">Cách xử lý nhanh:</strong> {current.stepAction}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleAudio();
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#F59E0B] py-2 text-xs font-extrabold text-[#0F172A]"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {speakingStory ? 'Đang đọc kịch bản (Bấm dừng)' : 'Nghe Cún AI đọc kịch bản'}
            </button>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

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
          {safeIndex + 1} / {filtered.length}
        </span>
      </div>

      {hasRealVideo && muted && (
        <button
          type="button"
          onClick={handleToggleAudio}
          data-screen="M05"
          data-ui="btn-unmute-video"
          className="absolute top-16 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B] px-3 py-1.5 text-xs font-extrabold text-[#0F172A] shadow-lg"
        >
          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
          Bấm bật tiếng
        </button>
      )}

      {/* Right TikTok-style vertical utility rail */}
      <div className="absolute right-2.5 bottom-4 z-20 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleToggleAudio}
          data-screen="M05"
          data-ui="btn-video-audio"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur-md">
            {hasRealVideo && muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </span>
          <span>{hasRealVideo ? (muted ? 'Bật tiếng' : 'Có tiếng') : 'Nghe đọc'}</span>
        </button>

        <button
          type="button"
          onClick={() => setLargeCaption((p) => !p)}
          data-screen="M05"
          data-ui="btn-video-caption-lg"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span
            className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md ${
              largeCaption ? 'bg-[#0D685E]' : 'bg-black/45'
            }`}
          >
            <Type className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Chữ to</span>
        </button>

        <button
          type="button"
          onClick={() => setShowDetails(true)}
          data-screen="M05"
          data-ui="btn-video-details"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur-md">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>3 bước</span>
        </button>

        <button
          type="button"
          onClick={() => onNotify(`Đã tạo thẻ gửi "${current.title}" cho Ba/Mẹ qua Zalo!`)}
          data-screen="M05"
          data-ui="btn-video-send-family"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F59E0B] text-[#0F172A] shadow">
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Gửi Ba/Mẹ</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('M06')}
          data-screen="M05"
          data-ui="btn-video-goto-game"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur-md">
            <Gamepad2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Game</span>
        </button>
      </div>

      {/* Bottom overlay caption + compact reel controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 pr-16">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#B91C1C] px-2.5 py-0.5 text-[10px] font-extrabold">
            {current.trend}
          </span>
          <span className="text-[11px] font-semibold text-[#A7F3D0]">{current.duration}</span>
        </div>

        <h1 className="mt-1.5 font-[family-name:var(--font-lexend)] text-base font-extrabold leading-snug">
          {current.title}
        </h1>

        {hasRealVideo && (
          <p className={`mt-1 text-white/90 ${largeCaption ? 'text-sm font-bold' : 'line-clamp-2 text-xs'}`}>
            {current.caption}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            data-screen="M05"
            data-ui="btn-video-prev"
            aria-label="Video trước"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur"
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-bold backdrop-blur"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Đang phát' : 'Tạm dừng'}
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            data-screen="M05"
            data-ui="btn-video-next"
            aria-label="Video tiếp theo"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-[#0D685E] px-3 text-xs font-bold"
          >
            Tiếp
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
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
