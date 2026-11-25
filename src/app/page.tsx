'use client';

import { useState } from 'react';
import { MobileShell } from '@/components/MobileShell';
import { HomeScreen } from '@/features/m01-home/HomeScreen';
import { ScannerScreen } from '@/features/m02-scanner/ScannerScreen';
import { FamilyScreen } from '@/features/m03-family/FamilyScreen';
import { ReportScreen } from '@/features/m04-report/ReportScreen';
import { VideosScreen } from '@/features/m05-videos/VideosScreen';
import { LearningScreen } from '@/features/m06-learning/LearningScreen';
import { RadarScreen } from '@/features/m07-radar/RadarScreen';
import { SystemScreen } from '@/features/m08-system/SystemScreen';
import { analyzeContentHybrid } from '@/lib/hybrid-scanner';
import type { AnalyzeResult, ScreenId } from '@/types';

export default function HomePage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('M01');
  const [seniorMode, setSeniorMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [wideRadar, setWideRadar] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<AnalyzeResult | null>(null);

  async function handleAnalyze(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setScanResult(null);
      setActiveScreen('M02');
      return;
    }
    setActiveScreen('M02');
    setAnalyzing(true);
    const result = await analyzeContentHybrid(trimmed, { offlineMode });
    setScanResult(result);
    setAnalyzing(false);
  }

  return (
    <MobileShell
      activeScreen={activeScreen}
      seniorMode={seniorMode}
      offlineMode={offlineMode}
      wideRadar={wideRadar}
      onNavigate={setActiveScreen}
      onToggleSenior={() => setSeniorMode((prev) => !prev)}
      onOpenMascot={() => setActiveScreen('M08')}
    >
      {activeScreen === 'M01' && (
        <HomeScreen
          seniorMode={seniorMode}
          onNavigate={setActiveScreen}
          onAnalyze={handleAnalyze}
        />
      )}
      {activeScreen === 'M02' && (
        <ScannerScreen
          result={scanResult}
          loading={analyzing}
          onNavigate={setActiveScreen}
        />
      )}
      {activeScreen === 'M03' && <FamilyScreen />}
      {activeScreen === 'M04' && <ReportScreen />}
      {activeScreen === 'M05' && <VideosScreen />}
      {activeScreen === 'M06' && <LearningScreen />}
      {activeScreen === 'M07' && (
        <RadarScreen wideRadar={wideRadar} onToggleWide={() => setWideRadar((prev) => !prev)} />
      )}
      {activeScreen === 'M08' && (
        <SystemScreen
          offlineMode={offlineMode}
          onToggleOffline={() => setOfflineMode((prev) => !prev)}
        />
      )}
    </MobileShell>
  );
}
