'use client';

import { Flame, MapPin } from 'lucide-react';
import type { ScamReport } from '@/types';

export interface DongNaiAreaSummary {
  id: string;
  name: string;
  parent: string;
  baseCount: number;
  topThreat: string;
  matchKeys: string[];
}

export const DONG_NAI_AREAS: DongNaiAreaSummary[] = [
  {
    id: 'tran-bien',
    name: 'P. Trấn Biên',
    parent: 'TP. Biên Hòa',
    baseCount: 34,
    topThreat: 'Link VNeID / BHYT giả',
    matchKeys: ['trấn biên', 'biên hòa'],
  },
  {
    id: 'tan-phong',
    name: 'P. Tân Phong',
    parent: 'TP. Biên Hòa',
    baseCount: 25,
    topThreat: 'CTV việc nhẹ (THPT)',
    matchKeys: ['tân phong'],
  },
  {
    id: 'long-khanh',
    name: 'TP. Long Khánh',
    parent: 'Đồng Nai',
    baseCount: 21,
    topThreat: 'Giả danh Công an',
    matchKeys: ['long khánh'],
  },
  {
    id: 'long-thanh',
    name: 'H. Long Thành',
    parent: 'Đồng Nai',
    baseCount: 16,
    topThreat: 'Deepfake / Điện lực',
    matchKeys: ['long thành'],
  },
  {
    id: 'nhon-trach',
    name: 'H. Nhơn Trạch',
    parent: 'Đồng Nai',
    baseCount: 13,
    topThreat: 'Link quà tặng / APK',
    matchKeys: ['nhơn trạch'],
  },
  {
    id: 'trang-bom',
    name: 'H. Trảng Bom',
    parent: 'Đồng Nai',
    baseCount: 11,
    topThreat: 'Giả người thân / CTV',
    matchKeys: ['trảng bom'],
  },
];

interface DongNaiHotspotGridProps {
  selectedArea: string | null;
  recentApproved: ScamReport[];
  queue: ScamReport[];
  onSelectArea: (areaName: string | null) => void;
}

export function DongNaiHotspotGrid({
  selectedArea,
  recentApproved,
  queue,
  onSelectArea,
}: DongNaiHotspotGridProps) {
  const enriched = DONG_NAI_AREAS.map((area) => {
    const liveApproved = recentApproved.filter((r) =>
      area.matchKeys.some((k) => r.area.toLowerCase().includes(k))
    ).length;
    const livePending = queue.filter((r) =>
      area.matchKeys.some((k) => r.area.toLowerCase().includes(k))
    ).length;
    const total = area.baseCount + liveApproved;
    const heat = total >= 28 ? 'high' : total >= 18 ? 'medium' : 'watch';
    return { ...area, total, livePending, heat };
  });

  return (
    <div className="space-y-2.5 rounded-3xl bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-[#0D685E]" aria-hidden="true" />
          <h2 className="text-sm font-extrabold text-[#0F172A]">
            Bản đồ Điểm nóng Địa bàn Đồng Nai
          </h2>
        </div>
        {selectedArea && (
          <button
            type="button"
            onClick={() => onSelectArea(null)}
            className="rounded-full bg-[#E9FAF5] px-2.5 py-0.5 text-[11px] font-bold text-[#0D685E]"
          >
            Xem toàn tỉnh
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#475569]">
        Chạm vào từng địa bàn để lọc cảnh báo &amp; tạo bản tin Zalo / Poster QR đúng khu vực.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {enriched.map((loc) => {
          const isSelected = selectedArea === loc.name;
          const badgeStyle =
            loc.heat === 'high'
              ? 'bg-[#FEF2F2] text-[#B91C1C]'
              : loc.heat === 'medium'
              ? 'bg-[#FFFBEB] text-[#92400E]'
              : 'bg-[#E9FAF5] text-[#0D685E]';

          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectArea(isSelected ? null : loc.name)}
              data-screen="M07"
              data-ui={`btn-hotspot-${loc.id}`}
              className={`rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
                isSelected
                  ? 'border-[#0D685E] bg-[#E9FAF5] ring-2 ring-[#0D685E]/30'
                  : 'border-slate-100 bg-[#F8FCFA] hover:border-[#CBE4DC]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-extrabold text-[#0F172A]">{loc.name}</span>
                <span
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${badgeStyle}`}
                >
                  {loc.heat === 'high' && <Flame className="h-2.5 w-2.5" aria-hidden="true" />}
                  {loc.total}
                </span>
              </div>
              <div className="mt-1 truncate text-[10.5px] font-semibold text-[#475569]">
                {loc.topThreat}
              </div>
              {loc.livePending > 0 && (
                <div className="mt-1 text-[10px] font-bold text-[#B45309]">
                  +{loc.livePending} chờ duyệt
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
