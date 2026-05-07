importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyCLBpGrfH8V-G3M-k3s2MHGY2cIXlHCH3A",
  authDomain: "plansure-25934.firebaseapp.com",
  projectId: "plansure-25934",
  storageBucket: "plansure-25934.firebasestorage.app",
  messagingSenderId: "979825581498",
  appId: "1:979825581498:web:93cf1eb1ebc32adb3b9e4c",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log("[SW] Firebase messaging service worker initialized");

self.addEventListener("push", (event) => {
  console.log("[SW] Push event received:", event);

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log("[SW] Push payload:", payload);

      const notificationTitle =
        payload.notification?.title || "New Notification";
      const notificationOptions = {
        body: payload.notification?.body || "You have a new notification",
        icon: "/favicon.png",
        badge: "/favicon.png",
        tag: payload.data?.notificationId || Date.now().toString(),
        data: payload.data,
        requireInteraction: true,
      };

      event.waitUntil(
        self.registration.showNotification(
          notificationTitle,
          notificationOptions,
        ),
      );
    } catch (e) {
      console.log("[SW] Push data parse error:", e);
    }
  }
});

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: payload.data?.notificationId || Date.now().toString(),
    data: payload.data,
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  event.notification.close();

  const clickUrl = event.notification.data?.clickUrl || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if (clickUrl !== "/") {
              client.navigate(clickUrl);
            }
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(clickUrl);
        }
      }),
  );
});
