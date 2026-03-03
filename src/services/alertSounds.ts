import { haptics } from "@/services/nativeCapabilities";

// Alert sound URLs - using data URIs for instant playback
// These are short, attention-grabbing tones
const DANGER_SOUND_URL = "/sounds/danger-alert.mp3";
const WARNING_SOUND_URL = "/sounds/warning-alert.mp3";

// Preloaded audio elements for instant playback
let dangerAudio: HTMLAudioElement | null = null;
let warningAudio: HTMLAudioElement | null = null;

// User preference key
const SOUND_PREFERENCE_KEY = "toxic_alert_sounds_enabled";

/**
 * Check if alert sounds are enabled in user preferences
 */
export const isSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(SOUND_PREFERENCE_KEY);
  // Default to true if not set
  return stored === null ? true : stored === "true";
};

/**
 * Set whether alert sounds are enabled
 */
export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
};

/**
 * Preload audio files for instant playback
 */
export const preloadAlertSounds = (): void => {
  try {
    if (!dangerAudio) {
      dangerAudio = new Audio(DANGER_SOUND_URL);
      dangerAudio.preload = "auto";
      dangerAudio.volume = 0.8;
    }
    if (!warningAudio) {
      warningAudio = new Audio(WARNING_SOUND_URL);
      warningAudio.preload = "auto";
      warningAudio.volume = 0.6;
    }
  } catch (error) {
    console.warn("Could not preload alert sounds:", error);
  }
};

/**
 * Play the danger alert sound for high-risk ingredients
 */
export const playDangerAlert = async (): Promise<void> => {
  if (!isSoundEnabled()) return;
  
  try {
    // Trigger haptic feedback first (immediate)
    haptics.notification("error");
    
    // Play audio
    if (dangerAudio) {
      dangerAudio.currentTime = 0;
      await dangerAudio.play();
    } else {
      const audio = new Audio(DANGER_SOUND_URL);
      audio.volume = 0.8;
      await audio.play();
    }
  } catch (error) {
    console.warn("Could not play danger alert:", error);
    // Still try haptic even if audio fails
    haptics.notification("error");
  }
};

/**
 * Play the warning alert sound for moderate-risk ingredients
 */
export const playWarningAlert = async (): Promise<void> => {
  if (!isSoundEnabled()) return;
  
  try {
    // Trigger haptic feedback first (immediate)
    haptics.notification("warning");
    
    // Play audio
    if (warningAudio) {
      warningAudio.currentTime = 0;
      await warningAudio.play();
    } else {
      const audio = new Audio(WARNING_SOUND_URL);
      audio.volume = 0.6;
      await audio.play();
    }
  } catch (error) {
    console.warn("Could not play warning alert:", error);
    // Still try haptic even if audio fails
    haptics.notification("warning");
  }
};

/**
 * Play appropriate alert based on risk level
 * @param hasHighRisk - Whether high-risk ingredients were detected
 * @param hasModeratRisk - Whether moderate-risk ingredients were detected
 */
export const playToxicAlert = async (
  hasHighRisk: boolean,
  hasModerateRisk: boolean
): Promise<void> => {
  if (hasHighRisk) {
    await playDangerAlert();
  } else if (hasModerateRisk) {
    await playWarningAlert();
  }
};

// Preload sounds on module load
if (typeof window !== "undefined") {
  preloadAlertSounds();
}
