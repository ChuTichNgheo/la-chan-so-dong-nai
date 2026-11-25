import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from 'lucide-react';
import { RISK_LEVEL_META } from '@/config/theme';
import type { RiskLevel } from '@/types';

interface AlertBadgeProps {
  level: RiskLevel;
  customLabel?: string;
}

const ICONS = {
  danger: ShieldAlert,
  warn: AlertTriangle,
  unknown: HelpCircle,
  safe: CheckCircle2,
} as const;

/**
 * Color-Not-Only 4-level risk indicator: always renders both icon and text label.
 */
export function AlertBadge({ level, customLabel }: AlertBadgeProps) {
  const meta = RISK_LEVEL_META[level];
  const Icon = ICONS[level];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.bgClass} ${meta.borderClass} ${meta.textClass}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{customLabel ?? meta.label}</span>
    </div>
  );
}
