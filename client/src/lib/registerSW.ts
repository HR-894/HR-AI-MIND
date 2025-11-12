let updateAvailableCallback: (() => void) | null = null;

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported in this browser");
    return null;
  }

  // Simple service worker registration without Workbox
  navigator.serviceWorker
    .register("/service-worker.js", { type: "module" })
    .then((registration) => {
      console.log("✅ Service worker registered successfully");

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("🎉 New version available!");
            showUpdatePrompt(() => {
              newWorker.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            });
          }
        });
      });

      // Check for updates every hour
      setInterval(() => {
        registration.update().catch((error) => {
          console.error("Failed to check for updates:", error);
        });
      }, 60 * 60 * 1000);
    })
    .catch((error) => {
      console.error("❌ Service worker registration failed:", error);
    });

  // Handle controller change
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("Service worker controller changed");
  });

  return null;
}

function showUpdatePrompt(onUpdate: () => void) {
  // Create a simple update notification
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #3B82F6;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: slideUp 0.3s ease-out;
  `;

  notification.innerHTML = `
    <style>
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    </style>
    <span style="font-weight: 500;">🎉 New version available!</span>
    <button id="update-btn" style="
      background: white;
      color: #3B82F6;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    ">Update Now</button>
    <button id="dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      font-size: 14px;
    ">Later</button>
  `;

  document.body.appendChild(notification);

  document.getElementById("update-btn")?.addEventListener("click", () => {
    notification.remove();
    onUpdate();
  });

  document.getElementById("dismiss-btn")?.addEventListener("click", () => {
    notification.remove();
  });
}

export function onUpdateAvailable(callback: () => void) {
  updateAvailableCallback = callback;
}
