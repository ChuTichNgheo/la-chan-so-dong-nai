import { runLayerOneRules } from '@/data/local-rules';
import type { AnalyzeResult } from '@/types';

/**
 * Runs deterministic Layer-1 offline rules first (<50ms), then calls /api/analyze
 * unless offlineMode is enabled. Falls back cleanly on network or API error.
 */
export async function analyzeContentHybrid(
  text: string,
  options?: { offlineMode?: boolean }
): Promise<AnalyzeResult> {
  const localResult = runLayerOneRules(text);

  if (options?.offlineMode) {
    return localResult;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, offline: false }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return localResult;
    }

    const data = (await response.json()) as AnalyzeResult;

    // Anti-False-Negative guardrail: never downgrade a local danger result to safe.
    if (localResult.level === 'danger' && data.level === 'safe') {
      return localResult;
    }

    return data;
  } catch {
    return localResult;
  }
}
