'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { VIDEOS_DATA } from '@/data/videos-data';

export function VideosScreen() {
  const [index, setIndex] = useState(0);
  const current = VIDEOS_DATA[index];

  return (
    <section className="space-y-3" data-screen="M05">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-lexend)] text-lg font-extrabold text-[#0D685E]">
          Video cảnh báo 1 phút
        </h1>
        <span className="tabular-nums text-xs font-bold text-[#475569]">
          {index + 1} / {VIDEOS_DATA.length}
        </span>
      </div>

      <div className="rounded-2xl bg-[#0A1B1F] p-4 text-white">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#B91C1C] px-2.5 py-0.5 text-[11px] font-bold">
          <Film className="h-3.5 w-3.5" aria-hidden="true" />
          {current.trend}
        </span>
        <h2 className="mt-2 font-[family-name:var(--font-lexend)] text-base font-extrabold">
          {current.title}
        </h2>
        <p className="mt-2 rounded-xl border-l-4 border-[#F59E0B] bg-white/10 p-3 text-sm">
          {current.caption}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev - 1 + VIDEOS_DATA.length) % VIDEOS_DATA.length)}
            data-screen="M05"
            data-ui="btn-video-prev"
            className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Trước
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % VIDEOS_DATA.length)}
            data-screen="M05"
            data-ui="btn-video-next"
            className="inline-flex items-center gap-1 rounded-xl bg-[#0D685E] px-3 py-2 text-xs font-bold"
          >
            Tiếp theo
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
