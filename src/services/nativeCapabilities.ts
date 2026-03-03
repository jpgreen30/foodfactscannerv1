// Web-only stub for native capabilities (no Capacitor needed)
// All functions are no-ops on web platform

export const isNativePlatform = () => false;
export const getPlatform = () => 'web';
export const isIOS = () => false;
export const isAndroid = () => false;
export const isWeb = () => true;

// Haptic feedback (no-op)
export const haptics = {
  impact: async () => {},
  notification: async () => {},
  selection: async () => {},
  vibrate: async () => {},
};

// Status bar control (no-op)
export const statusBar = {
  setStyle: async () => {},
  setBackgroundColor: async () => {},
  show: async () => {},
  hide: async () => {},
};

// Splash screen control (no-op)
export const splashScreen = {
  hide: async () => {},
  show: async () => {},
};

// Native camera access (returns error on web)
export const nativeCamera = {
  isAvailable: () => false,
  takePhoto: async () => { throw new Error('Native camera not available on web'); },
  pickFromGallery: async () => { throw new Error('Native camera not available on web'); },
  requestPermissions: async () => ({ camera: 'granted' as const }),
};

// Initialize (no-op)
export const initializeNativeCapabilities = async () => {
  console.log('Running on web platform - native features disabled');
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
