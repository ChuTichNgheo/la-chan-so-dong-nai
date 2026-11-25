import { Sparkles } from 'lucide-react';

interface CunAiMascotProps {
  onClick?: () => void;
  position?: 'right' | 'left';
  screenId?: string;
}

/**
 * Floating Cún AI Co-Pilot launcher (stops before final human confirmation buttons).
 */
export function CunAiMascot({
  onClick,
  position = 'right',
  screenId = 'Shell',
}: CunAiMascotProps) {
  const sideClass = position === 'left' ? 'left-3' : 'right-3';

  return (
    <button
      type="button"
      onClick={onClick}
      data-screen={screenId}
      data-ui="btn-cun-ai-mascot"
      aria-label="Mở Trợ lý Cún AI"
      className={`fixed bottom-24 z-30 flex items-center gap-2 rounded-full border-2 border-[#14B8A6] bg-[#0D685E] px-3 py-2 text-white shadow-lg transition hover:bg-[#09524A] md:absolute ${sideClass}`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E9FAF5] text-[#0D685E]">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-xs font-extrabold">Cún AI</span>
        <span className="block text-[10px] text-[#D1FAE5]">Nói để làm giùm</span>
      </span>
    </button>
  );
}
