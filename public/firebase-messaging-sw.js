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

self.addEventListener("push", (event) => {
  if (event.data) {
    let notificationTitle = "New Notification";
    let notificationBody = "You have a new notification";
    let notificationData = {};

    try {
      const payload = event.data.json();

      if (payload.data) {
        notificationTitle = payload.data.title || "New Notification";
        notificationBody = payload.data.body || "You have a new notification";
        notificationData = payload.data;
      } else if (payload.notification) {
        notificationTitle = payload.notification.title || "New Notification";
        notificationBody =
          payload.notification.body || "You have a new notification";
        notificationData = payload.data || {};
      } else {
        notificationTitle = payload.title || "New Notification";
        notificationBody = payload.body || "You have a new notification";
        notificationData = payload;
      }
    } catch (e) {
      const text = event.data.text();
      notificationBody = text || "You have a new notification";
    }

    const notificationOptions = {
      body: notificationBody,
      icon: "https://testplansure.netlify.app/favicon.png",
      badge: "https://testplansure.netlify.app/favicon.png",
      tag: "plansure-" + Date.now().toString(),
      data: notificationData,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };
    event.waitUntil(
      self.registration
        .showNotification(notificationTitle, notificationOptions)
        .then(() => console.log("[SW] Notification shown successfully"))
        .catch((err) =>
          console.error("[SW] Failed to show notification:", err),
        ),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
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
