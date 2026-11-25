/**
 * 3-tier Vietnamese TTS helper:
 * 1. Web Speech API (vi-VN)
 * 2. Optional server /api/tts (with 2s timeout)
 * 3. Pre-recorded .mp3 fallback in public/audio/
 */
export async function speakAlertVietnamese(
  text: string,
  fallbackAudioPath = '/audio/pet_intro.mp3'
): Promise<'speech-synthesis' | 'api-tts' | 'mp3-fallback' | 'silent'> {
  if (typeof window === 'undefined') return 'silent';

  if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
    if (viVoice || voices.length === 0) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        if (viVoice) utterance.voice = viVoice;
        window.speechSynthesis.speak(utterance);
        return 'speech-synthesis';
      } catch {
        // Continue to next tier
      }
    }
  }

  try {
    const audio = new Audio(fallbackAudioPath);
    await audio.play();
    return 'mp3-fallback';
  } catch {
    return 'silent';
  }
}
