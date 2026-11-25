export type ScreenId = 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06' | 'M07' | 'M08' | 'M09';

export type RiskLevel = 'danger' | 'warn' | 'unknown' | 'safe';

export type UserRole = 'user' | 'admin';

export interface AppUserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isLocked: boolean;
  trustedName: string;
  trustedPhone: string;
  gameScore: number;
  gameBadge: string;
}

export interface ScanHistoryItem {
  id: string;
  snippet: string;
  riskLevel: RiskLevel;
  title: string;
  createdAt: string;
}

export interface DynamicRule {
  id: string;
  pattern: string;
  level: Exclude<RiskLevel, 'unknown'>;
  note: string;
  createdAt: string;
}

export interface UrlInspectionReport {
  originalUrl: string;
  resolvedUrl?: string;
  hostname: string;
  flags: string[];
  risk: RiskLevel;
}

export interface AnalyzeRequest {
  text: string;
  offline?: boolean;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface AnalyzeResult {
  level: RiskLevel;
  badge: string;
  title: string;
  reasons: string[];
  highlights: string[];
  speech: string;
  extractedText?: string;
  urlReports?: UrlInspectionReport[];
  communityMatches?: number;
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
  reporterId?: string | null;
  createdAt: string;
}

export interface CreateReportPayload {
  type: string;
  target: string;
  area: string;
  description: string;
}

export interface FamilyAlertItem {
  id: string;
  senderId?: string | null;
  senderName: string;
  targetPhone: string;
  riskLevel: RiskLevel;
  snippet: string;
  status: 'sent' | 'acknowledged';
  acknowledgedBy?: string | null;
  createdAt: string;
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
