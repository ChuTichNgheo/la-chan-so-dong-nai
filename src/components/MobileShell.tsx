'use client';

import type { ReactNode } from 'react';
import { BarChart3, Flag, Gamepad2, Home, Info, Search, Video, WifiOff } from 'lucide-react';
import { BOTTOM_NAV_TABS, SCREEN_TAB_MAP } from '@/config/navigation';
import type { ScreenId } from '@/types';
import { BrandLogo } from './BrandLogo';
import { CunAiMascot } from './CunAiMascot';

interface MobileShellProps {
  activeScreen: ScreenId;
  seniorMode: boolean;
  offlineMode: boolean;
  wideRadar: boolean;
  toastMessage: string | null;
  onNavigate: (screen: ScreenId) => void;
  onToggleSenior: () => void;
  onOpenMascot: () => void;
  children: ReactNode;
}

const TAB_ICONS = {
  home: Home,
  search: Search,
  gamepad: Gamepad2,
  'bar-chart': BarChart3,
  video: Video,
} as const;

export function MobileShell({
  activeScreen,
  seniorMode,
  offlineMode,
  wideRadar,
  toastMessage,
  onNavigate,
  onToggleSenior,
  onOpenMascot,
  children,
}: MobileShellProps) {
  const activeTab = SCREEN_TAB_MAP[activeScreen];
  const containerWidth = wideRadar && activeScreen === 'M07' ? 'max-w-[960px]' : 'max-w-[430px]';

  return (
    <div className="flex min-h-dvh w-full justify-center bg-slate-100">
      <div
        className={`relative flex min-h-dvh w-full flex-col bg-[#F4FBF8] shadow-xl transition-all ${containerWidth} ${
          seniorMode ? 'senior-mode' : ''
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#CBE4DC] bg-white/95 px-3 py-2.5 backdrop-blur">
          <BrandLogo />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleSenior}
              data-screen={activeScreen}
              data-ui="btn-toggle-senior"
              aria-pressed={seniorMode}
              className={`min-h-[38px] rounded-full border px-2.5 text-xs font-bold transition ${
                seniorMode
                  ? 'border-[#0D685E] bg-[#0D685E] text-white'
                  : 'border-[#CBE4DC] bg-[#E9FAF5] text-[#0D685E]'
              }`}
            >
              Chữ lớn 65+
            </button>
            <button
              type="button"
              onClick={() => onNavigate('M04')}
              data-screen={activeScreen}
              data-ui="btn-header-report"
              className={`inline-flex min-h-[38px] items-center gap-1 rounded-full border px-2.5 text-xs font-bold transition ${
                activeScreen === 'M04'
                  ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                  : 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]'
              }`}
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              Báo cáo
            </button>
          </div>
        </header>

        {offlineMode && (
          <div className="flex items-center justify-center gap-1.5 border-b border-[#D97706] bg-[#FFFBEB] px-3 py-1.5 text-xs font-bold text-[#92400E]">
            <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Đang chạy Ngoại tuyến (Tầng 1 Luật tất định)</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-3.5 pt-3.5 pb-24">{children}</main>

        {toastMessage && (
          <div
            role="status"
            className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white shadow-lg"
          >
            <Info className="h-4 w-4 shrink-0 text-[#FCD34D]" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}

        {activeScreen !== 'M05' && (
          <CunAiMascot onClick={onOpenMascot} screenId={activeScreen} />
        )}

        <nav
          aria-label="Điều hướng chính"
          className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-[#CBE4DC] bg-white/85 px-1 py-1.5 backdrop-blur-md"
        >
          {BOTTOM_NAV_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.iconName];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                data-screen={activeScreen}
                data-ui={tab.dataUi}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-bold transition ${
                  isActive
                    ? 'bg-[#E9FAF5] text-[#0D685E]'
                    : 'text-[#475569] hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
