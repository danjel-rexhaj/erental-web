import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NavigationRoute } from "workbox-routing";

// registerType: "autoUpdate" (vite.config.js) means a new deploy should take over immediately,
// same as the plain web build -- without these, a hand-written injectManifest worker only
// activates once every open tab of the site is closed, leaving people on stale JS/CSS/HTML
// indefinitely if they keep a tab open (this codebase's generateSW default handled it
// automatically; a hand-rolled sw.js has to opt in explicitly).
self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA offline fallback -- serve the cached shell for any navigation except API calls (those must
// hit the network or fail, never get silently answered with index.html).
// Real files opened directly (sitemap.xml, robots.txt, ...) are never app routes: let those go to
// the network, or the browser shows the app instead of the file.
registerRoute(new NavigationRoute(createHandlerBoundToURL("/app.html"), { denylist: [/^\/api/, /\/[^/]+\.[a-z0-9]+$/i] }));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }

  const title = data.title || "ERental";
  const options = {
    body: data.body || "",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    data: { url: data.url || "/" },
  };

  // Number on the installed app's icon -- only where the OS supports it (iOS home-screen apps,
  // desktop); Android shows its own dot for any pending notification instead.
  const badge = data.unread > 0 && self.navigator.setAppBadge ? self.navigator.setAppBadge(data.unread).catch(() => {}) : null;

  event.waitUntil(Promise.all([self.registration.showNotification(title, options), badge]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "notification-click", url });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
