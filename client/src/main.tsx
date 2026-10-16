import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Clear the stale PWA cache once after the UI release so browsers that kept an
// older Service Worker receive the current GitHub Pages bundle immediately.
const CACHE_RESET_KEY = "koutoubia-cache-reset-2026-10-16-filters";
if (typeof window !== "undefined" && !localStorage.getItem(CACHE_RESET_KEY)) {
  localStorage.setItem(CACHE_RESET_KEY, "1");
  void navigator.serviceWorker?.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));
  void window.caches?.keys().then((keys) => Promise.all(keys.filter((key) => key.includes("workbox") || key.includes("koutoubia")).map((key) => window.caches.delete(key))));
}

createRoot(document.getElementById("root")!).render(<App />);
