# Changelog

All notable changes to this project will be documented in this file.

## 3.1.0 - 2025-11-14

- Feature: One-time proactive warm-up after first install/download to pre-open engine (compiles and caches artifacts).
- Feature: App idle trigger runs silent warm-up when the selected model is already cached.
- Perf: Mark warm-up completion on `initComplete` and persist via `localStorage` to avoid redundant work.
- Perf: Defer non-critical UI (ChatBackground, SettingsPanel, ExportDialog) until needed for faster perceived load.
- DX: Prefetch heavy panel chunks during idle so they’re available offline.
- Tests: Updated Playwright tests for stable selectors and title; e2e suite now fully green.

## 3.0.0 - 2025-11-13

- Major: Offline-first reliability improvements, IndexedDB/Cache API detection, and autoload of cached models.
- UI: Sidebar hover fixes, overlays, compact input, HomePage glassmorphism.
- PWA: Favicon/manifest updates, improved caching strategies.
