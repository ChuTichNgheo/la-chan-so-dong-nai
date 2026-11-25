'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { CunAiSvg } from './CunAiMascot';

export interface CunGuideStep {
  targetUi: string;
  caption: string;
  phase: 'aim' | 'click' | 'stop';
  mood?: 'idle' | 'alert' | 'listening';
}

interface CunAiGuideOverlayProps {
  active: boolean;
  step: CunGuideStep | null;
  onStop: () => void;
}

/**
 * Compact flying Cún AI walker:
 * - Tracks the real target button accurately after scroll
 * - Applies press/flash CSS directly on the button when clicked (no misaligned box border)
 * - Shows a compact 38px dog character so screen content remains unobstructed
 */
export function CunAiGuideOverlay({ active, step, onStop }: CunAiGuideOverlayProps) {
  const [petPos, setPetPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!active || !step) return;

    const el = document.querySelector(`[data-ui="${step.targetUi}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'auto', block: 'center' });
      el.classList.remove('cun-btn-active', 'cun-btn-clicked');
      if (step.phase === 'click') {
        void el.offsetWidth;
        el.classList.add('cun-btn-clicked');
      } else {
        el.classList.add('cun-btn-active');
      }
    }

    function updateCoords() {
      if (!step) return;
      const target = document.querySelector(`[data-ui="${step.targetUi}"]`) as HTMLElement | null;
      if (!target) {
        setPetPos({ x: Math.max(16, window.innerWidth / 2 - 20), y: 120 });
        return;
      }
      const rect = target.getBoundingClientRect();
      const x = Math.min(Math.max(12, rect.right - 22), window.innerWidth - 64);
      const y = Math.min(Math.max(58, rect.bottom - 18), window.innerHeight - 110);
      setPetPos({ x, y });
    }

    const raf = requestAnimationFrame(updateCoords);
    const scroller = document.getElementById('app-scroll-main');
    scroller?.addEventListener('scroll', updateCoords);
    window.addEventListener('resize', updateCoords);

    return () => {
      cancelAnimationFrame(raf);
      scroller?.removeEventListener('scroll', updateCoords);
      window.removeEventListener('resize', updateCoords);
      el?.classList.remove('cun-btn-active', 'cun-btn-clicked');
    };
  }, [active, step]);

  if (!active || !step) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="pointer-events-auto mx-auto mt-2 flex w-fit max-w-[92vw] items-center gap-2 rounded-full border border-[#F59E0B] bg-[#0F172A]/95 px-3 py-1.5 text-xs text-white shadow-xl">
        <span className="h-2 w-2 animate-ping rounded-full bg-[#F59E0B]" />
        <span className="font-semibold">{step.caption}</span>
        <button
          type="button"
          onClick={onStop}
          aria-label="Dừng Cún AI"
          className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold hover:bg-white/25"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          Dừng
        </button>
      </div>

      {petPos && (
        <div
          style={{ left: petPos.x, top: petPos.y }}
          className="fixed flex items-center gap-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          <div className={step.phase === 'click' ? 'scale-90 transition-transform' : 'animate-bounce'}>
            <CunAiSvg size={38} mood={step.mood ?? 'listening'} />
          </div>
          {step.phase === 'click' && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#0D685E] px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
              <Check className="h-3 w-3" aria-hidden="true" />
              Đã bấm
            </span>
          )}
          {step.phase === 'stop' && (
            <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-[10px] font-extrabold text-[#0F172A] shadow">
              Bấm nút này!
            </span>
          )}
        </div>
      )}
    </div>
  );
}
