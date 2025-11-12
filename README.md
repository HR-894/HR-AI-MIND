# HRAI Mind v3 - Offline AI Chat Application

[![CI](https://github.com/HR-894/HR-AI-MIND/actions/workflows/ci.yml/badge.svg)](https://github.com/HR-894/HR-AI-MIND/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tests](https://img.shields.io/badge/Tests-71%2B%20Passing-brightgreen.svg)](https://github.com/HR-894/HR-AI-MIND)
[![Production Ready](https://img.shields.io/badge/Production-Ready%20100%25-success.svg)](https://github.com/HR-894/HR-AI-MIND)
[![Accessibility](https://img.shields.io/badge/A11y-WCAG%202.1%20AA-blue.svg)](./ACCESSIBILITY.md)

A fully offline-first AI chat application powered by WebGPU and WebLLM. Experience fast, private, and always-available AI conversations that run entirely in your browser.

> **✨ 100% Production Ready** - Comprehensive testing, WCAG 2.1 AA accessibility, optimized performance, and complete documentation.

> **⚠️ WebGPU Required:** This application requires a Chromium-based browser with WebGPU support (Chrome 113+, Edge 113+). Firefox and Safari are not currently supported.

## 📸 Screenshots

### 🏠 Home Page
<img width="1920" alt="Home Page - HR AI MIND landing page with features" src="https://github.com/user-attachments/assets/1a61fac9-99d9-4be1-a400-ba96d0590bfe" />

*Beautiful landing page showcasing offline AI capabilities, privacy features, and modern technology stack*

### 💬 Chat Interface  
<img width="1920" alt="Chat Interface - Conversation with AI" src="https://github.com/user-attachments/assets/e64d7a98-800c-4b18-9769-3904e77d0f7e" />

*Clean, optimized chat interface with sidebar, message bubbles, and real-time AI responses*

### 🤖 Model Selection
<img width="1920" alt="Model Selection - Download AI models" src="https://github.com/user-attachments/assets/65e2793f-5352-4aa8-a508-8d0ed64247a9" />

*Model download manager with detailed specifications for Llama 3.2 1B, Llama 3.2 3B, and Phi 3.5 Mini*

### ⚙️ Settings Panel

#### General Settings
<img width="1920" alt="Settings - General tab configuration" src="https://github.com/user-attachments/assets/6fb228c7-9c73-4949-912f-c587d7fb1569" />

*Comprehensive settings for AI model selection, temperature, max tokens, context window, and theme*

#### Persona Settings
<img width="1918" alt="Settings - Persona customization" src="https://github.com/user-attachments/assets/2b1cf8cc-e16c-45bb-9c67-9dee5f67e12a" />

*AI persona customization with quick presets, response length, tone, and custom system prompts*

#### Performance Settings
<img width="1920" alt="Settings - Performance controls" src="https://github.com/user-attachments/assets/31b578a3-54f1-4421-8ae7-a9a11eb68237" />

*Advanced generation controls with Top P, frequency penalty, presence penalty, and performance metrics*

#### Storage Settings
<img width="1920" alt="Settings - Storage management" src="https://github.com/user-attachments/assets/bfc939e9-c40b-42d3-a4ac-db130af5bab2" />

*Storage management with cache control, IndexedDB monitoring, and PWA tools for persistent storage*

### 📱 Mobile Responsive
<img width="1920" alt="Mobile responsive design" src="https://github.com/user-attachments/assets/811ae893-3f6c-436f-a744-c0d0749d0cf6" />

*Fully responsive design optimized for mobile devices with intuitive touch controls*

---

## 🌟 Demo

<!-- TODO: Add live demo link when deployed
[**Try Live Demo →**](https://your-demo-url.com)
-->

> **Note:** Demo link coming soon. For now, follow the installation instructions below.

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
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start               # Start production server

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run E2E tests with Playwright
npm run test:e2e:ui     # Run E2E tests with UI
npm run test:all        # Run all tests (unit + E2E)

# Code Quality
npm run check           # TypeScript type checking
npm run lint            # Run ESLint
npm audit               # Check for security vulnerabilities
```

## 🔄 Updates

The app checks for updates every hour. When a new version is available:
1. You'll see an update notification
2. Click "Update Now" to install
3. App will reload with new version
4. All your data is preserved

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting PRs.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - See LICENSE file for details

## � Additional Documentation

- **[PRODUCTION_READY.md](./PRODUCTION_READY.md)** - 100% production readiness report
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - WCAG 2.1 compliance & accessibility features
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for all platforms
- **[OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md)** - Performance optimizations & benchmarks
- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** - Initial comprehensive code audit

## �🙏 Acknowledgments

- Built with [WebLLM](https://github.com/mlc-ai/web-llm)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Virtualization by [TanStack Virtual](https://tanstack.com/virtual)

---

**Made with ❤️ for offline-first AI experiences**

**Status: 🎯 100% Production Ready** | **Version: 3.0.0** | **Tests: 71+ Passing** | **A11y: WCAG 2.1 AA**
