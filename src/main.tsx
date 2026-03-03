import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize native capabilities after React is mounted
const initializeNative = async () => {
  try {
    const { initializeNativeCapabilities, isNativePlatform } = await import("./services/nativeCapabilities");
    initializeNativeCapabilities();
    
    // Initialize push notifications after a delay (allows auth to initialize)
    if (isNativePlatform()) {
      setTimeout(async () => {
        try {
          const { initializePushNotifications } = await import("./services/pushNotifications");
          const token = await initializePushNotifications();
          if (token) {
            console.log('Push notifications initialized');
          }
        } catch (e) {
          console.log('Push notifications not available:', e);
        }
      }, 2000);
    }
  } catch (e) {
    console.log('Native capabilities not available:', e);
  }
};

// Render the app first
createRoot(document.getElementById("root")!).render(<App />);

// Then initialize native features
initializeNative();
