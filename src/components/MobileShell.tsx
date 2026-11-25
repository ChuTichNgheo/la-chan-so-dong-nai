'use client';

import type { ReactNode } from 'react';
import {
  BarChart3,
  Gamepad2,
  Home,
  Info,
  Search,
  Settings,
  ShieldCheck,
  Video,
  WifiOff,
} from 'lucide-react';
import { BOTTOM_NAV_TABS, SCREEN_TAB_MAP } from '@/config/navigation';
import type { AppUserProfile, ScreenId, UiMode } from '@/types';
import { BrandLogo } from './BrandLogo';
import { CunAiMascot } from './CunAiMascot';

interface MobileShellProps {
  activeScreen: ScreenId;
  seniorMode: boolean;
  offlineMode: boolean;
  wideRadar: boolean;
  uiMode: UiMode;
  currentUser: AppUserProfile | null;
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
  uiMode,
  currentUser,
  toastMessage,
  onNavigate,
  onToggleSenior,
  onOpenMascot,
  children,
}: MobileShellProps) {
  const activeTab = SCREEN_TAB_MAP[activeScreen];
  const isVideoScreen = activeScreen === 'M05';

  const containerWidth = isVideoScreen
    ? 'max-w-[430px]'
    : wideRadar && activeScreen === 'M07'
    ? 'max-w-[960px]'
    : 'max-w-[480px] md:max-w-[640px]';

  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-slate-100">
      <div
        className={`relative mx-auto flex h-dvh w-full flex-col overflow-hidden shadow-xl transition-all ${
          isVideoScreen ? 'bg-[#071316]' : 'bg-[#F4FBF8]'
        } ${containerWidth} ${seniorMode ? 'senior-mode' : ''}`}
      >
        {!isVideoScreen && (
          <header className="z-20 flex shrink-0 items-center justify-between gap-1.5 bg-white/95 px-3 py-2.5 backdrop-blur-md shadow-[0_1px_12px_rgba(13,104,94,0.05)] sm:px-4">
            <BrandLogo />
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleSenior}
                data-screen={activeScreen}
                data-ui="btn-toggle-senior"
                aria-pressed={seniorMode}
                className={`min-h-[34px] whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold transition sm:min-h-[36px] sm:px-3 sm:text-xs ${
                  seniorMode
                    ? 'bg-[#0D685E] text-white shadow-sm'
                    : 'bg-[#E9FAF5] text-[#0D685E]'
                }`}
              >
                Chữ lớn 65+
              </button>
              <button
                type="button"
                onClick={() => onNavigate('M09')}
                data-screen={activeScreen}
                data-ui="btn-header-account"
                className={`inline-flex min-h-[34px] whitespace-nowrap items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition sm:min-h-[36px] sm:px-3 sm:text-xs ${
                  activeScreen === 'M09'
                    ? 'bg-[#0D685E] text-white'
                    : currentUser?.role === 'admin'
                    ? 'bg-[#FEF3C7] text-[#92400E]'
                    : 'bg-slate-100 text-[#0F172A]'
                }`}
              >
                {currentUser?.role === 'admin' ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="max-w-[78px] truncate">
                  {currentUser
                    ? currentUser.role === 'admin'
                      ? 'Quản trị'
                      : currentUser.username
                    : 'Cài đặt'}
                </span>
                {uiMode === 'tech' && (
                  <span className="hidden rounded bg-[#0D685E]/15 px-1 text-[9px] font-extrabold text-[#0D685E] sm:inline">
                    TECH
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {offlineMode && (
          <div className="flex shrink-0 items-center justify-center gap-1.5 bg-[#FFFBEB] px-3 py-1.5 text-xs font-bold text-[#92400E]">
            <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Đang chạy Ngoại tuyến (Luật an toàn trên máy)</span>
          </div>
        )}

        {toastMessage && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-3 top-14 z-40 flex items-center gap-2 rounded-2xl bg-[#0F172A]/95 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur"
          >
            <Info className="h-4 w-4 shrink-0 text-[#FCD34D]" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main
          id="app-scroll-main"
          className={
            isVideoScreen
              ? 'relative flex-1 overflow-hidden p-0'
              : 'flex-1 overflow-y-auto px-4 pt-3.5 pb-28'
          }
        >
          <div key={activeScreen} className={isVideoScreen ? 'h-full w-full' : 'animate-screen-enter'}>
            {children}
          </div>
        </main>

        {!isVideoScreen && (
          <CunAiMascot onClick={onOpenMascot} screenId={activeScreen} />
        )}

        <nav
          aria-label="Điều hướng chính"
          className={`z-20 grid shrink-0 grid-cols-5 px-2 py-1.5 backdrop-blur-xl ${
            isVideoScreen
              ? 'border-t border-white/10 bg-[#071316]/95 text-white'
              : 'bg-white/95 shadow-[0_-4px_20px_rgba(13,104,94,0.06)]'
          }`}
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
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-bold transition active:scale-95 ${
                  isVideoScreen
                    ? isActive
                      ? 'text-[#34D399]'
                      : 'text-white/65 hover:text-white'
                    : isActive
                    ? 'bg-[#E9FAF5] text-[#0D685E]'
                    : 'text-[#64748B] hover:bg-slate-100/70'
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
