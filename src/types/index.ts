export type ScreenId = 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06' | 'M07' | 'M08';

export type RiskLevel = 'danger' | 'warn' | 'unknown' | 'safe';

export interface AnalyzeRequest {
  text: string;
  offline?: boolean;
}

export interface AnalyzeResult {
  level: RiskLevel;
  badge: string;
  title: string;
  reasons: string[];
  highlights: string[];
  speech: string;
  source: 'hybrid' | 'db' | 'offline';
}

export type ReportStatus = 'pending' | 'approved' | 'rejected';

export interface ScamReport {
  id: string;
  type: string;
  target: string;
  targetMasked: string;
  area: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export interface CreateReportPayload {
  type: string;
  target: string;
  area: string;
  description: string;
}

export interface RadarBreakdownItem {
  label: string;
  count: number;
  percent: number;
  tone: 'danger' | 'primary' | 'amber' | 'muted';
}

export interface RadarStats {
  totalReports: number;
  fakeLinkPercent: number;
  pendingCount: number;
  breakdown: RadarBreakdownItem[];
}

export interface ReportsApiResponse {
  stats: RadarStats;
  queue: ScamReport[];
  recentApproved: ScamReport[];
  source: 'supabase' | 'fallback';
}

export interface NavTabItem {
  id: Extract<ScreenId, 'M01' | 'M02' | 'M06' | 'M07' | 'M05'>;
  label: string;
  iconName: 'home' | 'search' | 'gamepad' | 'bar-chart' | 'video';
  dataUi: string;
}

export interface HotlineItem {
  id: string;
  label: string;
  subLabel: string;
  href: string;
  kind: 'tel' | 'url';
}
