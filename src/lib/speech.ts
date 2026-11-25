import type { RiskLevel } from '@/types';

const LEVEL_AUDIO_MAP: Record<RiskLevel | 'intro' | 'family' | 'autofill' | 'radar', string> = {
  danger: '/audio/pet_danger_police.mp3',
  warn: '/audio/pet_warn_link.mp3',
  unknown: '/audio/pet_unknown.mp3',
  safe: '/audio/pet_safe.mp3',
  intro: '/audio/pet_intro.mp3',
  family: '/audio/pet_family_pause.mp3',
  autofill: '/audio/pet_autofill.mp3',
  radar: '/audio/pet_radar_zalo.mp3',
};

let activeAudioEl: HTMLAudioElement | null = null;

export function stopVietnameseSpeech(): void {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (activeAudioEl) {
    activeAudioEl.pause();
    activeAudioEl.currentTime = 0;
    activeAudioEl = null;
  }
}

export function getAudioPathForKey(key: keyof typeof LEVEL_AUDIO_MAP): string {
  return LEVEL_AUDIO_MAP[key] ?? '/audio/pet_intro.mp3';
}

/**
 * 3-tier Vietnamese TTS helper:
 * 1. Web Speech API (vi-VN) — speaks dynamic Gemini analysis text
 * 2. Optional /api/tts (skipped if 501/unconfigured)
 * 3. Pre-recorded .mp3 fallback in public/audio/ for Zalo/iOS devices without Vietnamese voice
 */
export async function speakAlertVietnamese(
  text: string,
  fallbackKey: keyof typeof LEVEL_AUDIO_MAP = 'intro'
): Promise<'speech-synthesis' | 'mp3-fallback' | 'silent'> {
  if (typeof window === 'undefined') return 'silent';
  stopVietnameseSpeech();

  if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));

    if (viVoice) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        utterance.voice = viVoice;
        window.speechSynthesis.speak(utterance);
        return 'speech-synthesis';
      } catch {
        // Fall through to MP3 fallback
      }
    }
  }

  try {
    const audio = new Audio(getAudioPathForKey(fallbackKey));
    activeAudioEl = audio;
    await audio.play();
    return 'mp3-fallback';
  } catch {
    // Last-chance Web Speech attempt when voices array was lazy-loaded
    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
        return 'speech-synthesis';
      } catch {
        return 'silent';
      }
    }
    return 'silent';
  }
}
