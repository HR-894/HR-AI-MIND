# HRAI Mind v3 - Offline AI Chat Application

A fully offline-first AI chat application powered by WebGPU and WebLLM. Experience fast, private, and always-available AI conversations that run entirely in your browser.

## 🚀 Features

### Core Capabilities
- **100% Offline Operation** - After initial model download, works completely offline
- **WebGPU-Powered AI** - Local AI inference using WebLLM and Web Workers
- **Progressive Web App (PWA)** - Installable on any device, works like a native app
- **Multi-Session Chat** - Create and manage multiple conversation sessions
- **Speech Integration** - Text-to-Speech (TTS) and Speech-to-Text (STT) support
- **Smart Context Management** - Efficient context windowing for optimal performance
- **Privacy-First** - All data stays on your device, no cloud required

### Technical Features
- **Virtualized Message Rendering** - Smooth performance even with long conversations
- **Service Worker Caching** - Advanced caching strategies for complete offline support
- **IndexedDB Storage** - Persistent local data storage using Dexie.js
- **Real-Time Streaming** - See AI responses as they're generated
- **Dark Mode** - Beautiful light and dark themes
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 📋 Requirements

### Browser Requirements
- **Chrome/Edge 113+** - WebGPU support required
- **8GB+ RAM** - For running AI models
- **Modern GPU** - For optimal performance
- **IndexedDB** - For local data storage
- **Service Workers** - For offline functionality

> **Note:** Firefox and Safari don't support WebGPU yet. This app requires a Chromium-based browser.

## 🛠️ Installation

### For Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd OptimizeAttachments
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to `http://localhost:5000`

### For Production

1. **Build the application**
```bash
npm run build
```

2. **Start production server**
```bash
npm start
```

## 🎯 Usage

### First Time Setup
1. Open the application in your browser
2. Select an AI model from settings (Llama 3.2 1B/3B, Phi 3.5 Mini)
3. Wait for the model to download (1-3GB, one-time download)
4. Start chatting!

### Installing as PWA
1. Click the install button in the address bar (Chrome/Edge)
2. Or use the in-app install prompt
3. App will be added to your home screen/start menu
4. Launch like any native application

### Creating Chat Sessions
- Click "New Chat" to start a new conversation
- All sessions are saved automatically
- Switch between sessions from the sidebar
- Delete sessions you no longer need

### Adjusting Settings
- **Model**: Choose between different AI models
- **Temperature**: Control response randomness (0-2)
- **Max Tokens**: Set response length (1-4096)
- **Context Window**: Number of recent messages to include (1-50)
- **Theme**: Light, Dark, or System preference

## 📦 Project Structure

```
OptimizeAttachments/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Shadcn UI components
│   │   │   ├── PWAInstallPrompt.tsx
│   │   │   ├── NetworkStatus.tsx
│   │   │   └── ...
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   │   ├── db.ts    # Dexie database
│   │   │   ├── worker-client.ts
│   │   │   └── registerSW.ts
│   │   ├── pages/        # Page components
│   │   ├── workers/      # Web Workers
│   │   │   └── ai.worker.ts
│   │   └── App.tsx
│   └── index.html
├── public/               # Static assets
│   ├── manifest.json    # PWA manifest
│   ├── service-worker.js # Service worker
│   └── offline.html     # Offline fallback
├── server/              # Express backend (dev only)
├── shared/              # Shared types and schemas
└── package.json
```

## 🔧 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching

### AI & Storage
- **@mlc-ai/web-llm** - WebGPU-powered AI inference
- **Dexie.js** - IndexedDB wrapper for local storage
- **Web Workers** - Offload AI processing from main thread

### PWA & Offline
- **Workbox** - Service worker library
- **PWA Manifest** - App installation metadata
- **Cache API** - Advanced caching strategies

### Build Tools
- **Vite** - Fast build tool and dev server
- **esbuild** - JavaScript bundler

## 🎨 Features Deep Dive

### Offline-First Architecture
- **Service Worker Strategies**:
  - Cache First: Static resources, AI models
  - Network First: API calls (when online)
  - Stale While Revalidate: Documents
- **Offline Fallback**: Custom offline page when network unavailable
- **Background Sync**: Future support for syncing data when back online

### PWA Capabilities
- **Installable**: Add to home screen on any device
- **Standalone Mode**: Runs in its own window
- **Shortcuts**: Quick actions from app icon
- **Update Notifications**: Prompts when new version available
- **Network Status Indicator**: Shows online/offline status

### Performance Optimizations
- **Virtual Scrolling**: Handles thousands of messages efficiently
- **Code Splitting**: Lazy load components
- **Web Worker Processing**: AI runs without blocking UI
- **Optimized Caching**: Smart cache strategies reduce redundant downloads
- **IndexedDB**: Fast local data access

### Security
- **DOMPurify**: Sanitizes all markdown output
- **Zod Validation**: Type-safe settings management
- **XSS Protection**: Prevents malicious code execution
- **Local Processing**: No data sent to external servers

## 🔑 Available Models

1. **Llama 3.2 1B** - Fast, lightweight (1GB)
2. **Llama 3.2 3B** - Balanced performance (2GB)
3. **Phi 3.5 Mini** - Microsoft's efficient model (2GB)

## 📱 Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| WebGPU | ✅ 113+ | ❌ | ❌ |
| Service Workers | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ❌ | ✅ (iOS) |

## 🐛 Known Limitations

- WebGPU not yet available on Firefox or Safari
- First model download can take 5-30 minutes depending on connection
- Mobile devices may have limited GPU capabilities
- Speech recognition not available on all browsers
- Large models require significant RAM (8GB+ recommended)

## 📝 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run check

# Push database schema
npm run db:push
```

## 🔄 Updates

The app checks for updates every hour. When a new version is available:
1. You'll see an update notification
2. Click "Update Now" to install
3. App will reload with new version
4. All your data is preserved

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your needs!

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [WebLLM](https://github.com/mlc-ai/web-llm)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ for offline-first AI experiences**
