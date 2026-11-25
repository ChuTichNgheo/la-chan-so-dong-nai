/**
 * Unified Gemini API Client for Lá Chắn Số Đồng Nai:
 * - Supports Multi-Key rotation (`GEMINI_API_KEYS=key1,key2` + `GEMINI_API_KEY`)
 * - Automatic Model Fallback (`GEMINI_MODEL` -> `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-3-flash-preview`)
 * - In-memory TTL Response Cache (10 minutes) to prevent 429 rate-limits during live demos
 * - Safe JSON extraction stripping accidental markdown fences
 */

export interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export interface GeminiCallOptions {
  parts: GeminiPart[];
  jsonMode?: boolean;
  temperature?: number;
  timeoutMs?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
}

export interface GeminiCallResult {
  text: string;
  model: string;
  cached: boolean;
}

interface CacheEntry {
  text: string;
  model: string;
  expiresAt: number;
}

const RESPONSE_CACHE = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 200;
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let keyCursor = 0;

function getConfiguredApiKeys(): string[] {
  const keys: string[] = [];
  const multi = process.env.GEMINI_API_KEYS;
  if (multi) {
    for (const k of multi.split(',')) {
      const clean = k.trim();
      if (clean && !keys.includes(clean)) keys.push(clean);
    }
  }
  const single = process.env.GEMINI_API_KEY?.trim();
  if (single && !keys.includes(single)) {
    keys.unshift(single);
  }
  return keys;
}

function getModelFallbackChain(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const chain = [
    preferred || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3-flash-preview',
  ];
  return Array.from(new Set(chain.filter(Boolean)));
}

function readCache(key?: string): CacheEntry | null {
  if (!key) return null;
  const hit = RESPONSE_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    RESPONSE_CACHE.delete(key);
    return null;
  }
  return hit;
}

function writeCache(key: string | undefined, text: string, model: string, ttlMs: number) {
  if (!key) return;
  if (RESPONSE_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = RESPONSE_CACHE.keys().next().value;
    if (firstKey) RESPONSE_CACHE.delete(firstKey);
  }
  RESPONSE_CACHE.set(key, { text, model, expiresAt: Date.now() + ttlMs });
}

export function hasGeminiKeyConfigured(): boolean {
  return getConfiguredApiKeys().length > 0;
}

export function extractCleanJson<T>(rawText: string): T | null {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    const objStart = rawText.indexOf('{');
    const objEnd = rawText.lastIndexOf('}');
    if (objStart >= 0 && objEnd > objStart) {
      try {
        return JSON.parse(rawText.slice(objStart, objEnd + 1)) as T;
      } catch {
        return null;
      }
    }
    const arrStart = rawText.indexOf('[');
    const arrEnd = rawText.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return JSON.parse(rawText.slice(arrStart, arrEnd + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function callGemini(options: GeminiCallOptions): Promise<GeminiCallResult | null> {
  const cached = readCache(options.cacheKey);
  if (cached) {
    return { text: cached.text, model: cached.model, cached: true };
  }

  const keys = getConfiguredApiKeys();
  if (keys.length === 0) return null;

  const models = getModelFallbackChain();
  const timeoutMs = options.timeoutMs ?? 9000;
  const temperature = options.temperature ?? 0.25;
  const generationConfig: Record<string, unknown> = { temperature };
  if (options.jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  // Rotate starting key so concurrent load spreads evenly
  const startKeyIdx = keyCursor % keys.length;
  keyCursor = (keyCursor + 1) % keys.length;

  for (const model of models) {
    for (let attempt = 0; attempt < keys.length; attempt += 1) {
      const apiKey = keys[(startKeyIdx + attempt) % keys.length];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model
          )}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: options.parts }],
              generationConfig,
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timer);

        if (!res.ok) {
          // 429 or 5xx -> rotate to next key or fallback model
          continue;
        }

        const payload = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          writeCache(
            options.cacheKey,
            text,
            model,
            options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS
          );
          return { text, model, cached: false };
        }
      } catch {
        clearTimeout(timer);
        // Timeout or transient network failure -> try next model/key
      }
    }
  }

  return null;
}

export async function callGeminiJson<T>(
  options: GeminiCallOptions
): Promise<{ data: T; model: string; cached: boolean } | null> {
  const res = await callGemini({ ...options, jsonMode: true });
  if (!res) return null;
  const parsed = extractCleanJson<T>(res.text);
  if (!parsed) return null;
  return { data: parsed, model: res.model, cached: res.cached };
}
