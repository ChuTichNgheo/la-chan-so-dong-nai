'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronsUp,
  FileText,
  Gamepad2,
  Play,
  Share2,
  Type,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { VideoScenario } from '@/data/videos-data';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';
import type { ScreenId } from '@/types';

interface VideoSlideCardProps {
  item: VideoScenario;
  displayIndex: number;
  isActive: boolean;
  isFirst: boolean;
  muted: boolean;
  largeCaption: boolean;
  onToggleMute: () => void;
  onToggleCaption: () => void;
  onOpenDetails: () => void;
  onNavigate: (screen: ScreenId) => void;
  onNotify: (msg: string) => void;
}

export function VideoSlideCard({
  item,
  displayIndex,
  isActive,
  isFirst,
  muted,
  largeCaption,
  onToggleMute,
  onToggleCaption,
  onOpenDetails,
  onNavigate,
  onNotify,
}: VideoSlideCardProps) {
  const [paused, setPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasRealVideo = Boolean(item.src) && !videoFailed;
  const cleanTitle = item.title.replace(/^\d+\.\s*/, '');

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !hasRealVideo) return;
    if (isActive && !paused) {
      vid.muted = muted;
      void vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isActive, paused, muted, hasRealVideo]);

  function handleTapStage() {
    const vid = videoRef.current;
    if (!vid) {
      setPaused((p) => !p);
      return;
    }
    if (vid.paused) {
      setPaused(false);
      void vid.play().catch(() => {});
    } else {
      setPaused(true);
      vid.pause();
    }
  }

  function handleAudioAction() {
    if (hasRealVideo) {
      onToggleMute();
      return;
    }
    stopVietnameseSpeech();
    void speakAlertVietnamese(`${cleanTitle}. ${item.caption} ${item.stepAction}`, item.audioKey);
  }

  return (
    <article className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-gradient-to-b from-[#072623] via-[#081A1E] to-[#040D10]">
      {hasRealVideo ? (
        <video
          ref={videoRef}
          src={item.src}
          loop
          playsInline
          preload={isActive ? 'metadata' : 'none'}
          muted={muted}
          onClick={handleTapStage}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          onClick={handleTapStage}
          className="absolute inset-0 flex items-center justify-center px-6 pr-20 pb-28 text-center"
        >
          <p className="rounded-2xl bg-white/10 p-4 text-xs text-white/90 backdrop-blur">
            Không tải được tệp video trên thiết bị này. Bấm &ldquo;3 bước&rdquo; bên phải để xem hướng dẫn nhanh.
          </p>
        </div>
      )}

      {paused && (
        <button
          type="button"
          onClick={handleTapStage}
          aria-label="Tiếp tục phát"
          className="pointer-events-auto absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/45 p-4 text-white backdrop-blur-md"
        >
          <Play className="h-8 w-8 fill-white" aria-hidden="true" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/95 via-black/65 to-transparent" />

      {/* Single clean right-side vertical utility rail (no duplicate unmute button) */}
      <div className="absolute right-2.5 bottom-5 z-20 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleAudioAction}
          data-screen="M05"
          data-ui="btn-video-audio"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span
            className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition ${
              hasRealVideo && muted
                ? 'bg-[#F59E0B] text-[#0F172A] shadow-lg'
                : 'bg-black/50 text-white'
            }`}
          >
            {hasRealVideo && muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </span>
          <span>{hasRealVideo ? (muted ? 'Bật tiếng' : 'Có tiếng') : 'Nghe đọc'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCaption}
          data-screen="M05"
          data-ui="btn-video-caption-lg"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span
            className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md ${
              largeCaption ? 'bg-[#0D685E]' : 'bg-black/50'
            }`}
          >
            <Type className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Chữ to</span>
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          data-screen="M05"
          data-ui="btn-video-details"
          className="flex flex-col items-center gap-1 text-[10px] font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-md">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>3 bước</span>
        </button>

        <button
          type="button"
          onClick={() => onNotify(`Đã tạo thẻ chia sẻ "${cleanTitle}" cho người thân!`)}
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
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-md">
            <Gamepad2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Game</span>
        </button>
      </div>

      {/* Bottom TikTok overlay with generous right margin so rail never overlaps */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pr-[72px] pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#B91C1C] px-2.5 py-0.5 text-[10px] font-extrabold">
            {item.trend}
          </span>
          <span className="text-[11px] font-semibold text-[#A7F3D0]">{item.duration}</span>
        </div>

        <h1 className="mt-1.5 font-[family-name:var(--font-lexend)] text-base font-extrabold leading-snug">
          {displayIndex}. {cleanTitle}
        </h1>

        <p className={`mt-1 text-white/90 leading-snug ${largeCaption ? 'text-sm font-bold' : 'text-xs'}`}>
          {item.caption}
        </p>

        {isFirst && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-bold text-[#E6FFF8] backdrop-blur-sm">
            <ChevronsUp className="h-3.5 w-3.5 animate-bounce" aria-hidden="true" />
            Lướt / cuộn xuống để xem video tiếp
          </div>
        )}
      </div>
    </article>
  );
}
