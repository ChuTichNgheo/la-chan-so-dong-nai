import { ShieldCheck } from 'lucide-react';

interface BrandLogoProps {
  compact?: boolean;
}

/**
 * Plug-in logo component: drop final logo into public/assets/ and swap here.
 */
export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E9FAF5] text-[#0D685E] ring-1 ring-[#CBE4DC]">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-[family-name:var(--font-lexend)] text-sm font-extrabold text-[#0D685E]">
            INFINITY AI
          </div>
          <div className="text-[11px] font-medium text-[#475569]">Lá Chắn Số Đồng Nai</div>
        </div>
      )}
    </div>
  );
}
