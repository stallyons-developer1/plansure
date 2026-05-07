import { useState, useEffect, useCallback } from "react";
import {
  requestNotificationPermission,
  onForegroundMessage,
  isFirebaseConfigured,
} from "../config/firebase";
import { fcmAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface PushNotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  permissionStatus: NotificationPermission | "unsupported";
  requestPermission: () => Promise<boolean>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const { isAuthenticated } = useAuth();
  const [isSupported] = useState(
    () => "Notification" in window && "serviceWorker" in navigator,
  );
  const [isConfigured] = useState(() => isFirebaseConfigured());
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    NotificationPermission | "unsupported"
  >(isSupported ? Notification.permission : "unsupported");

  useEffect(() => {
    if (isSupported && isAuthenticated && isConfigured) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(async (registration) => {
          if (registration.installing) {
            await new Promise<void>((resolve) => {
              registration.installing!.addEventListener("statechange", (e) => {
                if ((e.target as ServiceWorker).state === "activated") {
                  resolve();
                }
              });
            });
          }
        })
        .catch((err) => console.error("[Push] SW registration failed:", err));
    }
  }, [isSupported, isAuthenticated, isConfigured]);

  useEffect(() => {
    if (!isSupported || !isAuthenticated || !isEnabled || !isConfigured) return;

    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const notification = payload as PushNotificationPayload;

      if (notification.notification?.title) {
        new Notification(notification.notification.title, {
          body: notification.notification.body,
          icon: "/favicon.png",
        });
      }
    });

    return unsubscribe;
  }, [isSupported, isAuthenticated, isEnabled, isConfigured]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isConfigured) return false;

    try {
      const token = await requestNotificationPermission();

      if (!token) {
        setPermissionStatus(Notification.permission);
        return false;
      }

      const deviceInfo = `${navigator.userAgent.split(" ").slice(-2).join(" ")} on ${navigator.platform}`;
      const response = await fcmAPI.registerToken(token, deviceInfo);

      setIsEnabled(true);
      setPermissionStatus("granted");
      localStorage.setItem("plansure_push_enabled", "true");
      localStorage.setItem("plansure_fcm_token", token);

      return true;
    } catch (err) {
      console.error("[Push] Error:", err);
      return false;
    }
  }, [isSupported, isConfigured]);

  useEffect(() => {
    if (!isAuthenticated || !isSupported || !isConfigured) return;

    const hasAsked = localStorage.getItem("plansure_push_asked");

    if (!hasAsked && Notification.permission === "default") {
      const timer = setTimeout(() => {
        requestPermission();
        localStorage.setItem("plansure_push_asked", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (Notification.permission === "granted") {
      const storedToken = localStorage.getItem("plansure_fcm_token");
      if (storedToken) {
        setIsEnabled(true);
        fcmAPI.registerToken(storedToken).catch(() => {});
      } else {
        requestPermission();
      }
    }
  }, [isAuthenticated, isSupported, isConfigured, requestPermission]);

  return {
    isSupported,
    isEnabled,
    permissionStatus,
    requestPermission,
  };
};
