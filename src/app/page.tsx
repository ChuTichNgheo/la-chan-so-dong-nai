'use client';

import { useState } from 'react';
import { CunAiSheet, type CunFlowId } from '@/components/CunAiSheet';
import { MobileShell } from '@/components/MobileShell';
import { runLayerOneRules } from '@/data/local-rules';
import { HomeScreen } from '@/features/m01-home/HomeScreen';
import { ScannerScreen } from '@/features/m02-scanner/ScannerScreen';
import { FamilyScreen } from '@/features/m03-family/FamilyScreen';
import { ReportScreen } from '@/features/m04-report/ReportScreen';
import { VideosScreen } from '@/features/m05-videos/VideosScreen';
import { LearningScreen } from '@/features/m06-learning/LearningScreen';
import { RadarScreen } from '@/features/m07-radar/RadarScreen';
import { SystemScreen } from '@/features/m08-system/SystemScreen';
import { analyzeContentHybrid } from '@/lib/hybrid-scanner';
import { speakAlertVietnamese } from '@/lib/speech';
import type { AnalyzeResult, RiskLevel, ScreenId } from '@/types';

const PRESET_INPUTS: Record<RiskLevel, string> = {
  danger:
    'Tôi là cán bộ công an Biên Hòa. Tài khoản của bác liên quan vụ án, hãy chuyển 50.000.000đ để xác minh ngay hôm nay nếu không sẽ bị khởi tố.',
  warn: 'Tuyển CTV việc nhẹ lương cao 300k/ngày, bấm link http://nhanqua-shopee-vn.xyz và nạp trước 200k mở nhiệm vụ.',
  unknown: 'Số điện thoại lạ 0384-991-882 gọi rủ đầu tư lãi cao.',
  safe: 'https://canhbao.ncsc.gov.vn',
};

export default function HomePage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('M01');
  const [seniorMode, setSeniorMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [wideRadar, setWideRadar] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [scanResult, setScanResult] = useState<AnalyzeResult | null>(null);
  const [cunOpen, setCunOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function notify(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4000);
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
    if (autoSpeak) {
      void speakAlertVietnamese(result.speech, result.level);
    }
  }

  function handlePreviewPreset(level: RiskLevel) {
    const text = PRESET_INPUTS[level];
    setScannedText(text);
    setScanResult(runLayerOneRules(text));
    setActiveScreen('M02');
  }

  function handleSpeakWithCun() {
    notify('Cún AI đang kiểm tra kịch bản giả công an và đọc to cảnh báo cho bác...');
    void handleAnalyze(PRESET_INPUTS.danger, true);
  }

  function handleRunCunFlow(flow: CunFlowId) {
    if (flow === 'police-family') {
      handleSpeakWithCun();
      return;
    }
    if (flow === 'report-prefill') {
      setActiveScreen('M04');
      void speakAlertVietnamese('Cún đã mở sẵn phiếu báo cáo Công an để bác kiểm tra.', 'autofill');
      notify('Cún AI đã dẫn tới Phiếu báo cáo M04 — bạn kiểm tra rồi tự bấm gửi nhé.');
      return;
    }
    if (flow === 'senior-video') {
      setSeniorMode(true);
      setActiveScreen('M05');
      notify('Đã bật Chữ lớn 65+ và mở Video cảnh báo lừa đảo!');
      return;
    }
    setActiveScreen('M07');
    void speakAlertVietnamese('Cún đã mở Radar cảnh báo Đồng Nai.', 'radar');
    notify('Đã mở Radar Đồng Nai — bạn có thể bấm Xuất Zalo để tạo thẻ ảnh khu phố.');
  }

  return (
    <MobileShell
      activeScreen={activeScreen}
      seniorMode={seniorMode}
      offlineMode={offlineMode}
      wideRadar={wideRadar}
      toastMessage={toastMsg}
      onNavigate={setActiveScreen}
      onToggleSenior={() => {
        setSeniorMode((prev) => {
          const next = !prev;
          notify(next ? 'Đã bật Chế độ Người cao tuổi (65+)' : 'Đã quay về Chế độ Tiêu chuẩn');
          return next;
        });
      }}
      onOpenMascot={() => setCunOpen(true)}
    >
      {activeScreen === 'M01' && (
        <HomeScreen
          seniorMode={seniorMode}
          onNavigate={setActiveScreen}
          onAnalyze={(t) => void handleAnalyze(t)}
          onNotify={notify}
          onSpeakWithCun={handleSpeakWithCun}
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
          onToggleOffline={() => {
            setOfflineMode((prev) => {
              const next = !prev;
              notify(
                next
                  ? 'Đang giả lập mất mạng: dùng Tầng 1 Luật tất định'
                  : 'Đã khôi phục kết nối Hybrid AI'
              );
              return next;
            });
          }}
        />
      )}
      <CunAiSheet
        open={cunOpen}
        onClose={() => setCunOpen(false)}
        onRunFlow={handleRunCunFlow}
      />
    </MobileShell>
  );
}
