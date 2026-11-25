interface CunAiSvgProps {
  size?: number;
  mood?: 'idle' | 'alert' | 'listening';
}

/**
 * Original SVG Mascot: Cún INFINITY AI.
 * Plug-in point: swap with custom artwork in public/assets/ anytime.
 */
export function CunAiSvg({ size = 36, mood = 'idle' }: CunAiSvgProps) {
  const collarColor = mood === 'alert' ? '#B91C1C' : '#0D685E';
  const badgeBg = mood === 'alert' ? '#FEF2F2' : '#F59E0B';
  const mouthPath =
    mood === 'alert' ? 'M27 42 Q32 37 37 42' : 'M27 39 Q32 44 37 39';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#E9FAF5" stroke={collarColor} strokeWidth="2.5" />
      <path
        d="M16 26 L13 11 Q13 8 17 10 L26 17 Z"
        fill="#D97706"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M48 26 L51 11 Q51 8 47 10 L38 17 Z"
        fill="#D97706"
        stroke="#0F172A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="32" cy="33" rx="18" ry="16" fill="#FDE68A" stroke="#0F172A" strokeWidth="2.2" />
      <ellipse cx="32" cy="38" rx="12" ry="9" fill="#FFFFFF" />
      <circle cx="25" cy="30" r="2.7" fill="#0F172A" />
      <circle cx="39" cy="30" r="2.7" fill="#0F172A" />
      <circle cx="25.9" cy="29.1" r="0.9" fill="#FFFFFF" />
      <circle cx="39.9" cy="29.1" r="0.9" fill="#FFFFFF" />
      <ellipse cx="32" cy="35" rx="3.2" ry="2.2" fill="#0F172A" />
      <path d={mouthPath} stroke="#0F172A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path
        d="M17 45 Q32 52 47 45 L45 53 Q32 58 19 53 Z"
        fill={collarColor}
        stroke="#0F172A"
        strokeWidth="1.8"
      />
      <circle cx="32" cy="52" r="6.5" fill={badgeBg} stroke="#0F172A" strokeWidth="1.6" />
      <path
        d="M28.2 52 C28.2 50.4 30.2 50.4 32 52 C33.8 53.6 35.8 53.6 35.8 52 C35.8 50.4 33.8 50.4 32 52 C30.2 53.6 28.2 53.6 28.2 52 Z"
        stroke="#0F172A"
        strokeWidth="1.6"
        fill="none"
      />
    </svg>
  );
}

interface CunAiMascotProps {
  onClick?: () => void;
  position?: 'right' | 'left';
  screenId?: string;
  mood?: 'idle' | 'alert' | 'listening';
}

export function CunAiMascot({
  onClick,
  position = 'right',
  screenId = 'Shell',
  mood = 'idle',
}: CunAiMascotProps) {
  const sideClass = position === 'left' ? 'left-3' : 'right-3';

  return (
    <button
      type="button"
      onClick={onClick}
      data-screen={screenId}
      data-ui="btn-cun-ai-mascot"
      aria-label="Mở Trợ lý Cún INFINITY AI"
      className={`fixed bottom-20 z-30 flex items-center gap-2 rounded-full border-2 border-[#14B8A6] bg-[#0D685E] px-2.5 py-1.5 text-white shadow-lg transition hover:bg-[#09524A] md:absolute ${sideClass}`}
    >
      <CunAiSvg size={34} mood={mood} />
      <span className="pr-1 text-left leading-tight">
        <span className="block text-xs font-extrabold">Cún AI</span>
        <span className="block text-[10px] text-[#D1FAE5]">Nói để làm giùm</span>
      </span>
    </button>
  );
}
