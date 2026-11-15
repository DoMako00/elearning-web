import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { AppProviders } from "./app/providers/AppProviders";
import { applyAppearancePreferences, loadAppearancePreferences } from "./features/settings/appearancePreferences";
import "./styles/globals.css";

// Auto-recover when dynamic module or CSS chunk preloading fails (e.g. following a new deployment).
// Vite emits `vite:preloadError` before throwing. Suppressing it and refreshing fetches the new build manifest.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const reloadKey = "gl_vite_preload_reload_ts";
  const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
  const now = Date.now();
  if (now - lastReload > 10000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

applyAppearancePreferences(loadAppearancePreferences());

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);

// Register the learning cache Service Worker in production builds only.
// Skipped in dev to prevent stale-cache debugging issues.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw-learning-cache.js', { scope: '/', type: 'module' })
      .then((reg) => {
        console.info('[SW] Registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
}
