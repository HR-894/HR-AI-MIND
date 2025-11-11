import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RangeRequestsPlugin } from "workbox-range-requests";

precacheAndRoute(self.__WB_MANIFEST || []);

const appShellHandler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(appShellHandler);
registerRoute(navigationRoute);

registerRoute(
  ({ request }) => 
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "worker",
  new CacheFirst({
    cacheName: "static-resources",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => {
    return url.pathname.includes("model") || 
           url.pathname.includes(".wasm") ||
           url.pathname.includes(".bin") ||
           url.hostname.includes("huggingface.co");
  },
  new CacheFirst({
    cacheName: "model-binaries",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new RangeRequestsPlugin(),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === "document",
  new NetworkFirst({
    cacheName: "documents",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
