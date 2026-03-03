import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Native Capabilities Service
 * Provides cross-platform access to native device features
 * Falls back gracefully on web platforms
 */

// Platform detection
export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
export const isWeb = () => getPlatform() === 'web';

// Haptic feedback
export const haptics = {
  /**
   * Trigger impact haptic feedback
   */
  impact: async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNativePlatform()) return;
    
    const impactStyles: Record<string, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    
    try {
      await Haptics.impact({ style: impactStyles[style] });
    } catch (e) {
      console.warn('Haptic feedback not available:', e);
    }
  },

  /**
   * Trigger notification haptic feedback
   */
  notification: async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNativePlatform()) return;
    
    const notificationTypes: Record<string, NotificationType> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    
    try {
      await Haptics.notification({ type: notificationTypes[type] });
    } catch (e) {
      console.warn('Haptic notification not available:', e);
    }
  },

  /**
   * Trigger selection haptic feedback (light tap)
   */
  selection: async () => {
    if (!isNativePlatform()) return;
    
    try {
      await Haptics.selectionStart();
      await Haptics.selectionEnd();
    } catch (e) {
      console.warn('Haptic selection not available:', e);
    }
  },

  /**
   * Vibrate for a duration (Android only)
   */
  vibrate: async (duration: number = 300) => {
    if (!isNativePlatform()) return;
    
    try {
      await Haptics.vibrate({ duration });
    } catch (e) {
      console.warn('Vibration not available:', e);
    }
  },
};

// Status bar control
export const statusBar = {
  /**
   * Set status bar style
   */
  setStyle: async (style: 'dark' | 'light') => {
    if (!isNativePlatform()) return;
    
    try {
      await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
    } catch (e) {
      console.warn('StatusBar style not available:', e);
    }
  },

  /**
   * Set status bar background color (Android only)
   */
  setBackgroundColor: async (color: string) => {
    if (!isAndroid()) return;
    
    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (e) {
      console.warn('StatusBar background color not available:', e);
    }
  },

  /**
   * Show status bar
   */
  show: async () => {
    if (!isNativePlatform()) return;
    
    try {
      await StatusBar.show();
    } catch (e) {
      console.warn('StatusBar show not available:', e);
    }
  },

  /**
   * Hide status bar
   */
  hide: async () => {
    if (!isNativePlatform()) return;
    
    try {
      await StatusBar.hide();
    } catch (e) {
      console.warn('StatusBar hide not available:', e);
    }
  },
};

// Splash screen control
export const splashScreen = {
  /**
   * Hide the splash screen
   */
  hide: async (fadeOutDuration: number = 300) => {
    if (!isNativePlatform()) return;
    
    try {
      await SplashScreen.hide({ fadeOutDuration });
    } catch (e) {
      console.warn('SplashScreen hide not available:', e);
    }
  },

  /**
   * Show the splash screen
   */
  show: async () => {
    if (!isNativePlatform()) return;
    
    try {
      await SplashScreen.show({ autoHide: false });
    } catch (e) {
      console.warn('SplashScreen show not available:', e);
    }
  },
};

// Native camera access
export const nativeCamera = {
  /**
   * Check if native camera is available
   */
  isAvailable: () => isNativePlatform(),

  /**
   * Take a photo using native camera
   */
  takePhoto: async () => {
    if (!isNativePlatform()) {
      throw new Error('Native camera not available on web');
    }
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
      });
      
      return image.dataUrl;
    } catch (e) {
      console.error('Failed to take photo:', e);
      throw e;
    }
  },

  /**
   * Pick photo from gallery
   */
  pickFromGallery: async () => {
    if (!isNativePlatform()) {
      throw new Error('Native camera not available on web');
    }
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
      });
      
      return image.dataUrl;
    } catch (e) {
      console.error('Failed to pick photo:', e);
      throw e;
    }
  },

  /**
   * Request camera permissions
   */
  requestPermissions: async () => {
    if (!isNativePlatform()) return { camera: 'granted' as const };
    
    try {
      const permissions = await Camera.requestPermissions();
      return permissions;
    } catch (e) {
      console.error('Failed to request camera permissions:', e);
      throw e;
    }
  },
};

// Initialize native features on app start
export const initializeNativeCapabilities = async () => {
  if (!isNativePlatform()) {
    console.log('Running on web platform - native features disabled');
    return;
  }
  
  console.log(`Running on ${getPlatform()} platform - initializing native features`);
  
  try {
    // Set up status bar
    await statusBar.setStyle('dark');
    if (isAndroid()) {
      await statusBar.setBackgroundColor('#0a0a0a');
    }
    
    // Hide splash screen after a short delay
    setTimeout(() => {
      splashScreen.hide(300);
    }, 500);
    
    console.log('Native capabilities initialized successfully');
  } catch (e) {
    console.warn('Error initializing native capabilities:', e);
  }
};

// Export a hook-friendly object
export const nativeCapabilities = {
  isNative: isNativePlatform,
  platform: getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  haptics,
  statusBar,
  splashScreen,
  camera: nativeCamera,
  initialize: initializeNativeCapabilities,
};

export default nativeCapabilities;
