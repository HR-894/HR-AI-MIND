import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // We handle registration manually
      strategies: "injectManifest",
      srcDir: "public",
      filename: "service-worker.js",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm}"],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100MB for AI models
      },
      manifest: {
        name: "HRAI Mind v3 - Offline AI Chat",
        short_name: "HRAI Mind",
        description: "Offline-first AI chat powered by WebGPU and WebLLM",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#3B82F6",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["productivity", "utilities"],
        shortcuts: [
          {
            name: "New Chat",
            short_name: "New Chat",
            description: "Start a new AI conversation",
            url: "/",
            icons: [{ src: "/favicon.png", sizes: "192x192" }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/huggingface\.co\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "huggingface-models",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200, 206],
              },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Optimize chunks for faster loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router': ['wouter'],
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip',
          ],
          'ui-sidebar': [
            '@/components/ui/sidebar',
            '@/components/ui/button',
            '@/components/ui/input',
          ],
          'database': ['dexie', 'dexie-react-hooks'],
          'markdown': ['marked', 'marked-highlight', 'highlight.js'],
          'ai-worker': ['@mlc-ai/web-llm'],
        },
      },
    },
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    // Source maps for debugging (disable for smaller builds)
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      'dexie',
      'dexie-react-hooks',
      '@tanstack/react-query',
    ],
    exclude: ['@mlc-ai/web-llm'], // Exclude large AI library from pre-bundling
  },
});
