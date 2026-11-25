'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { CunAiGuideOverlay, type CunGuideStep } from '@/components/CunAiGuideOverlay';
import { CunAiSheet, type CunFlowId } from '@/components/CunAiSheet';
import { MobileShell } from '@/components/MobileShell';
import { runLayerOneRules } from '@/data/local-rules';
import { HomeScreen } from '@/features/m01-home/HomeScreen';
import { ScannerScreen } from '@/features/m02-scanner/ScannerScreen';
import { analyzeContentHybrid } from '@/lib/hybrid-scanner';
import { speakAlertVietnamese, stopVietnameseSpeech } from '@/lib/speech';
import type { AnalyzeResult, AppUserProfile, RiskLevel, ScreenId } from '@/types';

const ScreenFallback = () => (
  <div className="rounded-2xl border border-[#CBE4DC] bg-white p-4 text-xs text-[#475569]">
    Đang tải màn hình...
  </div>
);

const FamilyScreen = dynamic(
  () => import('@/features/m03-family/FamilyScreen').then((m) => m.FamilyScreen),
  { loading: ScreenFallback }
);
const ReportScreen = dynamic(
  () => import('@/features/m04-report/ReportScreen').then((m) => m.ReportScreen),
  { loading: ScreenFallback }
);
const VideosScreen = dynamic(
  () => import('@/features/m05-videos/VideosScreen').then((m) => m.VideosScreen),
  { loading: ScreenFallback }
);
const LearningScreen = dynamic(
  () => import('@/features/m06-learning/LearningScreen').then((m) => m.LearningScreen),
  { loading: ScreenFallback }
);
const RadarScreen = dynamic(
  () => import('@/features/m07-radar/RadarScreen').then((m) => m.RadarScreen),
  { loading: ScreenFallback }
);
const SystemScreen = dynamic(
  () => import('@/features/m08-system/SystemScreen').then((m) => m.SystemScreen),
  { loading: ScreenFallback }
);
const AccountScreen = dynamic(
  () => import('@/features/m09-account/AccountScreen').then((m) => m.AccountScreen),
  { loading: ScreenFallback }
);

const PRESET_INPUTS: Record<RiskLevel, string> = {
  danger:
    'Tôi là cán bộ công an Biên Hòa. Tài khoản của bác liên quan vụ án, hãy chuyển 50.000.000đ để xác minh ngay hôm nay nếu không sẽ bị khởi tố.',
  warn: 'Tuyển CTV việc nhẹ lương cao 300k/ngày, bấm link http://nhanqua-shopee-vn.xyz và nạp trước 200k mở nhiệm vụ.',
  unknown: 'Số điện thoại lạ 0384-991-882 gọi rủ đầu tư lãi cao.',
  safe: 'https://canhbao.ncsc.gov.vn',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function HomePage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('M01');
  const [seniorMode, setSeniorMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [wideRadar, setWideRadar] = useState(false);
  const [videoStartIdx, setVideoStartIdx] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [scanResult, setScanResult] = useState<AnalyzeResult | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUserProfile | null>(null);
  const [cunOpen, setCunOpen] = useState(false);
  const [guideStep, setGuideStep] = useState<CunGuideStep | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const flowTokenRef = useRef(0);

  useEffect(() => {
    let active = true;
    void fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: AppUserProfile | null } | null) => {
        if (active && data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function notify(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4000);
  }

  function stopGuide() {
    flowTokenRef.current += 1;
    setGuideStep(null);
    stopVietnameseSpeech();
  }

  async function handleAnalyze(text: string, autoSpeak = false) {
    const trimmed = text.trim();
    if (!trimmed) {
      notify('Bạn chưa nhập nội dung! Hãy dán tin nhắn, SĐT hoặc chọn 1 mẫu thử.');
      return;
    }
    setScannedText(trimmed);
    setActiveScreen('M02');
    setAnalyzing(true);
    const result = await analyzeContentHybrid(trimmed, { offlineMode });
    setScanResult(result);
    setAnalyzing(false);
    if (autoSpeak) void speakAlertVietnamese(result.speech, result.level);
  }

  async function handleAnalyzeImage(base64: string, mimeType: string, label: string) {
    setScannedText(label);
    setActiveScreen('M02');
    setAnalyzing(true);
    const result = await analyzeContentHybrid('', { offlineMode, imageBase64: base64, imageMimeType: mimeType });
    if (result.extractedText) setScannedText(result.extractedText);
    setScanResult(result);
    setAnalyzing(false);
  }

  function handlePreviewPreset(level: RiskLevel) {
    const text = PRESET_INPUTS[level];
    setScannedText(text);
    setScanResult(runLayerOneRules(text));
    setActiveScreen('M02');
  }

  async function runAnimatedPoliceFamilyFlow() {
    const token = ++flowTokenRef.current;
    const isAlive = () => flowTokenRef.current === token;

    setSeniorMode(false);
    setActiveScreen('M01');
    setGuideStep({ targetUi: 'chip-sample-police', caption: 'Cún chọn mẫu giả Công an...', phase: 'aim' });
    await sleep(650);
    if (!isAlive()) return;

    setGuideStep({ targetUi: 'chip-sample-police', caption: 'Cún vừa bấm mẫu Giả Công an!', phase: 'click' });
    await sleep(600);
    if (!isAlive()) return;

    await handleAnalyze(PRESET_INPUTS.danger, true);
    if (!isAlive()) return;

    setGuideStep({ targetUi: 'btn-speak-alert', caption: 'Cún đọc to cảnh báo NGUY HIỂM...', phase: 'click', mood: 'alert' });
    await sleep(1400);
    if (!isAlive()) return;

    setGuideStep({ targetUi: 'btn-ask-family-cta', caption: 'Cún bấm dẫn tới Hỏi người thân...', phase: 'click', mood: 'alert' });
    await sleep(750);
    if (!isAlive()) return;

    setActiveScreen('M03');
    setGuideStep({ targetUi: 'btn-confirm-send-family', caption: 'Cún dừng tại đây — Bác tự bấm gửi Chị Lan nhé!', phase: 'stop', mood: 'idle' });
  }

  async function handleRunCunFlow(flow: CunFlowId) {
    const token = ++flowTokenRef.current;
    const isAlive = () => flowTokenRef.current === token;

    if (flow === 'police-family') {
      void runAnimatedPoliceFamilyFlow();
      return;
    }
    if (flow === 'report-prefill') {
      setActiveScreen('M04');
      void speakAlertVietnamese('Cún đã mở sẵn phiếu báo cáo Công an để bác kiểm tra.', 'autofill');
      setGuideStep({ targetUi: 'btn-submit-report', caption: 'Cún dừng trước nút Gửi — Bạn kiểm tra rồi tự bấm nhé!', phase: 'stop' });
      return;
    }
    if (flow === 'senior-video') {
      setSeniorMode(true);
      setActiveScreen('M01');
      setGuideStep({ targetUi: 'btn-xem-video', caption: 'Cún bật Chữ lớn 65+ và bấm Xem Video...', phase: 'click' });
      await sleep(850);
      if (!isAlive()) return;
      setActiveScreen('M05');
      setGuideStep(null);
      return;
    }
    setActiveScreen('M07');
    void speakAlertVietnamese('Cún đã mở Radar cảnh báo Đồng Nai.', 'radar');
    setGuideStep({ targetUi: 'btn-zalo-export', caption: 'Bấm Xuất Zalo để tạo thẻ ảnh cảnh báo khu phố!', phase: 'stop' });
  }

  return (
    <MobileShell
      activeScreen={activeScreen}
      seniorMode={seniorMode}
      offlineMode={offlineMode}
      wideRadar={wideRadar}
      currentUser={currentUser}
      toastMessage={toastMsg}
      onNavigate={(s) => {
        stopGuide();
        setActiveScreen(s);
      }}
      onToggleSenior={() => {
        setSeniorMode((prev) => {
          const next = !prev;
          notify(next ? 'Đã bật Chế độ Người cao tuổi (65+)' : 'Đã quay về Chế độ Tiêu chuẩn');
          return next;
        });
      }}
      onOpenMascot={() => {
        stopGuide();
        setCunOpen(true);
      }}
    >
      {activeScreen === 'M01' && (
        <HomeScreen
          seniorMode={seniorMode}
          onNavigate={setActiveScreen}
          onAnalyze={(t) => void handleAnalyze(t)}
          onAnalyzeImage={(b64, mime, lbl) => void handleAnalyzeImage(b64, mime, lbl)}
          onNotify={notify}
          onSpeakWithCun={() => void runAnimatedPoliceFamilyFlow()}
        />
      )}
      {activeScreen === 'M02' && (
        <ScannerScreen
          scannedText={scannedText}
          result={scanResult}
          loading={analyzing}
          onNavigate={setActiveScreen}
          onPreviewPreset={handlePreviewPreset}
        />
      )}
      {activeScreen === 'M03' && (
        <FamilyScreen
          scannedText={scannedText}
          scanResult={scanResult}
          currentUser={currentUser}
          onUserUpdated={setCurrentUser}
          onNavigate={setActiveScreen}
          onNotify={notify}
        />
      )}
      {activeScreen === 'M04' && <ReportScreen scannedText={scannedText} onNotify={notify} />}
      {activeScreen === 'M05' && (
        <VideosScreen key={videoStartIdx} initialIndex={videoStartIdx} onNavigate={setActiveScreen} onNotify={notify} />
      )}
      {activeScreen === 'M06' && (
        <LearningScreen
          currentUser={currentUser}
          onUserUpdated={setCurrentUser}
          onOpenVideoAt={(idx) => {
            setVideoStartIdx(idx);
            setActiveScreen('M05');
          }}
          onNotify={notify}
        />
      )}
      {activeScreen === 'M07' && (
        <RadarScreen
          wideRadar={wideRadar}
          currentUser={currentUser}
          onToggleWide={() => setWideRadar((prev) => !prev)}
          onNavigate={setActiveScreen}
          onNotify={notify}
        />
      )}
      {activeScreen === 'M08' && (
        <SystemScreen
          offlineMode={offlineMode}
          onToggleOffline={() => {
            setOfflineMode((prev) => {
              const next = !prev;
              notify(next ? 'Đang giả lập mất mạng: dùng Tầng 1 Luật tất định' : 'Đã khôi phục kết nối Hybrid AI');
              return next;
            });
          }}
          onTryPoliceSample={() => void handleAnalyze(PRESET_INPUTS.danger, true)}
        />
      )}
      {activeScreen === 'M09' && (
        <AccountScreen
          currentUser={currentUser}
          onAuthChanged={setCurrentUser}
          onNavigate={setActiveScreen}
          onNotify={notify}
        />
      )}
      <CunAiSheet open={cunOpen} onClose={() => setCunOpen(false)} onRunFlow={(flow) => void handleRunCunFlow(flow)} />
      <CunAiGuideOverlay active={Boolean(guideStep)} step={guideStep} onStop={stopGuide} />
    </MobileShell>
  );
}
