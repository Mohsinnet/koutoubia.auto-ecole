import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["icons/*.png", "icons/*.svg"],
    manifest: {
      name: "سيارة التعليم الكتبية",
      short_name: "الكتبية",
      description: "السجل الرقمي لسيارة التعليم الكتبية - إدارة المترشحين والامتحانات",
      theme_color: "#0d3943",
      background_color: "#f6f3ed",
      display: "standalone",
      orientation: "portrait",
      scope: process.env.GITHUB_ACTIONS ? "/koutoubia.auto-ecole/" : "/",
      start_url: process.env.GITHUB_ACTIONS ? "/koutoubia.auto-ecole/" : "/",
      lang: "ar",
      dir: "rtl",
      categories: ["education", "business"],
      icons: [
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      ],
      shortcuts: [
        { name: "إضافة مترشح", short_name: "إضافة", description: "إضافة مترشح جديد", url: process.env.GITHUB_ACTIONS ? "/koutoubia.auto-ecole/" : "/", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
        { name: "التقارير", short_name: "التقارير", description: "عرض التقارير", url: process.env.GITHUB_ACTIONS ? "/koutoubia.auto-ecole/" : "/", icons: [{ src: "icons/icon-192.png", sizes: "192x192" }] },
      ],
      screenshots: [
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", form_factor: "narrow" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", form_factor: "wide" },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: "NetworkFirst",
          options: { cacheName: "supabase-cache", networkTimeoutSeconds: 10, expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
        },
      ],
      navigateFallbackDenylist: [/^\/api\//],
    },
    devOptions: { enabled: false },
  }),
];

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/koutoubia.auto-ecole/" : "/",
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "wouter"],
          supabase: ["@supabase/supabase-js"],
          ui: ["lucide-react", "sonner"],
        },
      },
    },
  },
  server: {
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});