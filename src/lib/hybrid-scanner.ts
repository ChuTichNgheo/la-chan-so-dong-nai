import { runLayerOneRules } from '@/data/local-rules';
import type { AnalyzeResult } from '@/types';

/**
 * Runs deterministic Layer-1 offline rules first (<50ms), then calls /api/analyze
 * (supporting both text and screenshot imageBase64 for Gemini Vision OCR).
 */
export async function analyzeContentHybrid(
  text: string,
  options?: { offlineMode?: boolean; imageBase64?: string; imageMimeType?: string }
): Promise<AnalyzeResult> {
  const localResult = runLayerOneRules(text || 'Kiểm tra ảnh chụp màn hình');

  if (options?.offlineMode) {
    return localResult;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        offline: false,
        imageBase64: options?.imageBase64,
        imageMimeType: options?.imageMimeType,
      }),
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
