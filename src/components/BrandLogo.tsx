import { ShieldCheck } from 'lucide-react';

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#E9FAF5] text-[#0D685E] ring-1 ring-[#CBE4DC] sm:h-9 sm:w-9">
        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate whitespace-nowrap font-[family-name:var(--font-lexend)] text-xs font-extrabold text-[#0D685E] sm:text-sm">
            INFINITY AI
          </div>
          <div className="truncate whitespace-nowrap text-[10px] font-medium text-[#475569] sm:text-[11px]">
            Lá Chắn Số Đồng Nai
          </div>
        </div>
      )}
    </div>
  );
}
