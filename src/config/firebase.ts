import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = (): FirebaseApp | null => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
};

export const getFirebaseMessaging = (): Messaging | null => {
  if (
    !messaging &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator
  ) {
    try {
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) return null;
      messaging = getMessaging(firebaseApp);
    } catch {
      return null;
    }
  }
  return messaging;
};

export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  try {
    if (!("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.ready;
    console.log("[Firebase] Service worker ready:", registration.scope);

    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.log("[Firebase] No VAPID key configured");
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    console.log("[Firebase] Token generated successfully");
    return token;
  } catch (error) {
    console.error("[Firebase] Token generation error:", error);
    return null;
  }
};

export const onForegroundMessage = (
  callback: (payload: unknown) => void,
): (() => void) => {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    return () => {};
  }

  return onMessage(messagingInstance, callback);
};

export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
};

export { getToken };
