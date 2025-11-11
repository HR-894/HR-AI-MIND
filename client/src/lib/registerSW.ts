import { Workbox } from "workbox-window";

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const wb = new Workbox("/service-worker.js");

    wb.addEventListener("installed", (event) => {
      if (event.isUpdate) {
        console.log("New service worker installed, refresh to update");
      } else {
        console.log("Service worker installed for the first time");
      }
    });

    wb.addEventListener("activated", (event) => {
      if (!event.isUpdate) {
        console.log("Service worker activated");
      }
    });

    wb.addEventListener("waiting", () => {
      console.log("New service worker waiting to activate");
      wb.messageSkipWaiting();
    });

    wb.register().catch((error) => {
      console.error("Service worker registration failed:", error);
    });

    return wb;
  }

  return null;
}
