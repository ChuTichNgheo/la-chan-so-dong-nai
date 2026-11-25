'use client';

import { TrendingUp } from 'lucide-react';
import type { RadarStats } from '@/types';

interface WeeklyTrendChartProps {
  stats: RadarStats;
}

export function WeeklyTrendChart({ stats }: WeeklyTrendChartProps) {
  const liveBonus = Math.max(0, stats.totalReports - 120);
  const days = [
    { label: 'T2', count: 14 },
    { label: 'T3', count: 18 },
    { label: 'T4', count: 16 },
    { label: 'T5', count: 22 },
    { label: 'T6', count: 19 },
    { label: 'T7', count: 15 },
    { label: 'CN', count: 16 + liveBonus, isToday: true },
  ];

  const maxCount = Math.max(...days.map((d) => d.count), 24);
  const peak = days.reduce((best, curr) => (curr.count > best.count ? curr : best), days[0]);

  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 shadow-[0_6px_22px_rgba(13,104,94,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-[#0D685E]" aria-hidden="true" />
          <h2 className="text-sm font-extrabold text-[#0F172A]">Xu hướng cảnh báo 7 ngày</h2>
        </div>
        <span className="tabular-nums rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#B91C1C]">
          Cao điểm: {peak.label} ({peak.count} vụ)
        </span>
      </div>

      <div className="grid h-32 grid-cols-7 items-end gap-2 pt-3">
        {days.map((d) => {
          const heightPct = Math.max(18, Math.round((d.count / maxCount) * 100));
          return (
            <div key={d.label} className="flex h-full flex-col items-center justify-end gap-1">
              <span className="tabular-nums text-[10px] font-extrabold text-[#475569]">{d.count}</span>
              <div className="flex h-20 w-full items-end overflow-hidden rounded-t-xl bg-[#F1F5F9]">
                <div
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    d.isToday
                      ? 'bg-gradient-to-t from-[#B91C1C] to-[#F59E0B]'
                      : d.count === peak.count
                      ? 'bg-[#0D685E]'
                      : 'bg-[#14B8A6]/80'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span
                className={`text-[10.5px] font-bold ${
                  d.isToday ? 'text-[#B91C1C]' : 'text-[#475569]'
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
