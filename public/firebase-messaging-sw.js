importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyA1ehcG5F-AgRWVIbeXk5xIcX2rARTs8pg",
  authDomain: "plansure-25934.firebaseapp.com",
  projectId: "plansure-25934",
  storageBucket: "plansure-25934.firebasestorage.app",
  messagingSenderId: "202707167252",
  appId: "1:202707167252:web:5d147053f0c6078c03df01",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log("[SW] Firebase messaging service worker initialized");

self.addEventListener("push", (event) => {
  console.log("[SW] Push event received:", event);

  if (event.data) {
    let notificationTitle = "New Notification";
    let notificationBody = "You have a new notification";
    let notificationData = {};

    // Try to parse as JSON first
    try {
      const payload = event.data.json();
      console.log("[SW] Push payload (JSON):", payload);

      // Handle data-only messages (data is at root level)
      if (payload.data) {
        notificationTitle = payload.data.title || "New Notification";
        notificationBody = payload.data.body || "You have a new notification";
        notificationData = payload.data;
      }
      // Handle notification messages
      else if (payload.notification) {
        notificationTitle = payload.notification.title || "New Notification";
        notificationBody = payload.notification.body || "You have a new notification";
        notificationData = payload.data || {};
      }
      // Handle flat structure
      else {
        notificationTitle = payload.title || "New Notification";
        notificationBody = payload.body || "You have a new notification";
        notificationData = payload;
      }
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      const text = event.data.text();
      console.log("[SW] Push payload (text):", text);
      notificationBody = text || "You have a new notification";
    }

    const notificationOptions = {
      body: notificationBody,
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: notificationData?.notificationId || Date.now().toString(),
      data: notificationData,
      requireInteraction: true,
    };

    console.log("[SW] Showing notification:", notificationTitle, notificationOptions);

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => console.log("[SW] Notification shown successfully"))
        .catch(err => console.error("[SW] Failed to show notification:", err))
    );
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
