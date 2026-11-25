'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Gamepad2,
  Pause,
  Play,
  Share2,
  Type,
  Volume2,
  VolumeX,
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
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    setVideoFailed(false);
    stopVietnameseSpeech();
  }

  function handleStep(delta: number) {
    stopVietnameseSpeech();
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
    void speakAlertVietnamese(
      `${current.title}. ${current.caption} ${current.stepAction}`,
      current.audioKey
    );
  }

  return (
    <section className="space-y-2.5" data-screen="M05">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: `Tất cả (${VIDEOS_DATA.length})` },
              { id: 'senior', label: 'Người cao tuổi' },
              { id: 'student', label: 'Học sinh THPT' },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleFilterChange(pill.id)}
              data-screen="M05"
              data-ui={`filter-video-${pill.id}`}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                filter === pill.id
                  ? 'bg-[#0D685E] text-white'
                  : 'border border-[#CBE4DC] bg-white text-[#475569]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <span className="tabular-nums text-xs font-extrabold text-[#0D685E]">
          {safeIndex + 1} / {filtered.length}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-[#0A1B1F] text-white shadow-lg">
        {hasRealVideo && (
          <video
            ref={videoRef}
            key={current.src}
            src={current.src}
            autoPlay
            loop
            playsInline
            muted={muted}
            onClick={handleTogglePlay}
            onError={() => setVideoFailed(true)}
            className="h-[310px] w-full bg-black object-cover"
          />
        )}

        <div className={hasRealVideo ? 'bg-gradient-to-t from-[#0A1B1F] via-[#0A1B1F]/95 to-transparent p-3.5' : 'p-4'}>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#B91C1C] px-2.5 py-0.5 text-[11px] font-bold">
              <Film className="h-3.5 w-3.5" aria-hidden="true" />
              {current.trend}
            </span>
            <span className="text-[11px] font-semibold text-[#A7F3D0]">{current.duration}</span>
          </div>

          {hasRealVideo && muted && (
            <button
              type="button"
              onClick={handleToggleAudio}
              data-screen="M05"
              data-ui="btn-unmute-video"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#F59E0B] px-3 py-1 text-xs font-extrabold text-[#0F172A]"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              Bấm để bật tiếng Video
            </button>
          )}

          <h1 className="mt-2 font-[family-name:var(--font-lexend)] text-base font-extrabold leading-snug">
            {current.title}
          </h1>

          <p
            className={`mt-2 rounded-xl border-l-4 border-[#F59E0B] bg-white/10 p-2.5 leading-relaxed ${
              largeCaption ? 'text-base font-bold' : 'text-xs'
            }`}
          >
            {current.caption}
          </p>

          {!hasRealVideo && (
            <div className="mt-2.5 space-y-1.5 rounded-xl bg-white/5 p-2.5 text-xs leading-relaxed text-[#E2F1ED]">
              <p>
                <strong className="text-[#FCD34D]">Chiêu trò:</strong> {current.stepTrick}
              </p>
              <p>
                <strong className="text-[#FCD34D]">Dấu hiệu / Hậu quả:</strong> {current.stepSign}
              </p>
              <p>
                <strong className="text-[#FCD34D]">Cách xử lý:</strong> {current.stepAction}
              </p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-4 gap-1.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={handleToggleAudio}
              data-screen="M05"
              data-ui="btn-video-audio"
              className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2"
            >
              {hasRealVideo && muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{hasRealVideo ? (muted ? 'Bật tiếng' : 'Có tiếng') : 'Nghe đọc'}</span>
            </button>
            <button
              type="button"
              onClick={() => setLargeCaption((p) => !p)}
              data-screen="M05"
              data-ui="btn-video-caption-lg"
              className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2"
            >
              <Type className="h-4 w-4" aria-hidden="true" />
              <span>{largeCaption ? 'Cỡ vừa' : 'Chữ to'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNotify(`Đã tạo thẻ gửi "${current.title}" cho Ba/Mẹ qua Zalo!`)}
              data-screen="M05"
              data-ui="btn-video-send-family"
              className="flex flex-col items-center gap-1 rounded-xl bg-[#F59E0B] py-2 text-[#0F172A]"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span>Gửi Ba/Mẹ</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('M06')}
              data-screen="M05"
              data-ui="btn-video-goto-game"
              className="flex flex-col items-center gap-1 rounded-xl bg-white/10 py-2"
            >
              <Gamepad2 className="h-4 w-4" aria-hidden="true" />
              <span>Mini Game</span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              data-screen="M05"
              data-ui="btn-video-prev"
              className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Trước
            </button>
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Đang phát' : 'Tạm dừng'}
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              data-screen="M05"
              data-ui="btn-video-next"
              className="inline-flex items-center gap-1 rounded-xl bg-[#0D685E] px-3 py-2 text-xs font-bold"
            >
              Tiếp theo
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
