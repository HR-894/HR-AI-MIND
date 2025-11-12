import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute, setCatchHandler, setDefaultHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RangeRequestsPlugin } from "workbox-range-requests";
import { ExpirationPlugin } from "workbox-expiration";

// Clean up old caches
cleanupOutdatedCaches();

// Precache and route
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache the offline page during service worker install
self.addEventListener("install", (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open("offline-v1").then(async (cache) => {
      console.log('[SW] Caching offline.html');
      try {
        await cache.addAll(["/offline.html"]);
        console.log('[SW] offline.html cached successfully');
      } catch (error) {
        console.error('[SW] Failed to cache offline.html:', error);
      }
    })
  );
  self.skipWaiting();
});

// Activate immediately
self.addEventListener("activate", (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[SW] Claiming clients');
    })
  );
});

// App shell routing with offline fallback
const appShellHandler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(appShellHandler);
registerRoute(navigationRoute);

// Static resources (scripts, styles, workers) - Cache First with faster network timeout
registerRoute(
  ({ request }) => 
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "worker",
  new CacheFirst({
    cacheName: "static-resources-v2",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days - longer cache
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Images and fonts - Cache First with long expiration
registerRoute(
  ({ request }) => 
    request.destination === "image" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: "assets-v2",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 180 * 24 * 60 * 60, // 180 days - very long cache
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// AI Model binaries - Cache First with Range support and permanent caching
registerRoute(
  ({ url }) => {
    return url.pathname.includes("model") || 
           url.pathname.includes(".wasm") ||
           url.pathname.includes(".bin") ||
           url.pathname.includes(".params") ||
           url.hostname.includes("huggingface.co") ||
           url.hostname.includes("cdn-lfs");
  },
  new CacheFirst({
    cacheName: "model-binaries-v2",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200, 206], // 206 for range requests
      }),
      new RangeRequestsPlugin(),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: false, // Don't auto-delete models
      }),
    ],
  })
);

// API calls - Network First (fallback to cache if offline)
registerRoute(
  ({ url }) => url.pathname.startsWith("/api"),
  new NetworkFirst({
    cacheName: "api-cache-v1",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Documents - Stale While Revalidate (show cached, update in background)
registerRoute(
  ({ request }) => request.destination === "document",
  new StaleWhileRevalidate({
    cacheName: "documents-v1",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Catch handler for offline fallback with debug logging
setCatchHandler(async ({ event }) => {
  console.log('[SW] Catch handler triggered for:', event.request.url, 'Mode:', event.request.mode);
  
  // Return offline page for navigation requests
  if (event.request.mode === "navigate") {
    console.log('[SW] Attempting to serve offline.html');
    const cache = await caches.open("offline-v1");
    const cachedResponse = await cache.match("/offline.html");
    if (cachedResponse) {
      console.log('[SW] Successfully serving offline.html');
      return cachedResponse;
    }
    console.log('[SW] offline.html not found in cache');
  }
  
  // Try to serve from any cache as fallback
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(event.request);
    if (response) {
      console.log('[SW] Found cached response in:', cacheName);
      return response;
    }
  }
  
  // Return a generic offline response for other requests
  console.log('[SW] No cached response found, returning 503');
  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: new Headers({
      "Content-Type": "text/plain",
    }),
  });
});

// Handle skip waiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle sync events (for future background sync)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Placeholder for future background sync implementation
  console.log("Background sync triggered");
}
