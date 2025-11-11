# HRAI Mind v3

## Overview
HRAI Mind v3 is an offline-first AI chat application powered by WebGPU and WebLLM. The application runs AI inference entirely in the browser using Web Workers, providing a fast, private, and always-available chat experience.

## Recent Changes (January 2025)
- **v3.0.0** - Complete rebuild with offline-first architecture
  - Implemented WebLLM inference in dedicated Web Worker
  - Added multi-session chat with Dexie IndexedDB
  - Integrated virtualized message rendering with react-window
  - Implemented PWA with Workbox service worker for offline model caching
  - Added speech-to-text and text-to-speech capabilities
  - Implemented smart context windowing (system + last N messages)
  - Added stop button with partial response preservation
  - Implemented sanitized Markdown rendering with DOMPurify
  - Added Zod-based settings validation with automatic fallback

## Project Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **UI Library**: Shadcn UI + Tailwind CSS
- **Routing**: Wouter
- **State Management**: React hooks + TanStack Query
- **Database**: Dexie.js (IndexedDB wrapper)
- **AI Inference**: @mlc-ai/web-llm (WebGPU)
- **Markdown**: marked + DOMPurify for XSS protection

### Key Components
- `ChatPage` - Main chat interface with sidebar and message list
- `MessageList` - Virtualized message rendering with react-window
- `ChatInput` - Input area with STT support
- `SettingsPanel` - Configuration for model, temperature, context window
- `AppSidebar` - Session management with Shadcn Sidebar
- `ErrorBoundary` - Global error handling

### Web Worker Architecture
- `ai.worker.ts` - Runs WebLLM inference off main thread
- `worker-client.ts` - Singleton client for UI-worker communication
- Streaming token emission for real-time responses
- AbortController support for stopping generation mid-stream

### Database Schema (Dexie)
- **chatSessions** - Conversation metadata (id, title, timestamps)
- **chatMessages** - Individual messages (id, sessionId, role, content, timestamp)
- **metrics** - Performance tracking (tokens, response time)

### PWA & Offline Support
- Service worker with Workbox
- Runtime caching for static assets
- HTTP Range request support for model binaries
- Full offline functionality after first model download

## User Preferences
- Theme: Light/Dark/System (persisted to localStorage)
- Model selection: Llama 3.2 1B/3B, Phi 3.5 Mini
- Temperature: 0-2 (controls randomness)
- Max tokens: 1-4096 (response length)
- Context window: 1-50 messages
- STT/TTS: Enable/disable speech features

## Development Workflow
1. **Start Dev Server**: `npm run dev` (runs both frontend and backend)
2. **Build**: `npm run build`
3. **Type Check**: TypeScript strict mode enabled with `noUncheckedIndexedAccess`

## Technical Highlights

### Performance Optimizations
- AI inference runs in Web Worker (no UI freeze)
- Virtualized message list with VariableSizeList
- Dynamic height measurement with ResizeObserver
- Pagination (50 messages per page) with infinite scroll
- No animations on virtualized items
- React.memo on MessageList to prevent unnecessary rerenders

### Security
- DOMPurify sanitization of all Markdown output
- No inline scripts, styles, or dangerous attributes allowed
- Zod validation for all settings with safeParse
- XSS protection on user and AI content

### Context Windowing
- Never sends full chat history
- Sends system prompt + last N messages (configurable)
- Prevents token budget overflow
- Maintains conversation coherence

### Stop Button Behavior
- Triggers worker.interruptGenerate()
- Saves partial streamed response to database
- Updates session timestamp
- Shows toast notification

### Auto-Scroll Stability
- Scrolls to bottom on message send
- Maintains bottom position during streaming
- Scroll-to-bottom after loading first page of history
- No scroll animations (instant for performance)

## Browser Requirements
- WebGPU support (Chrome 113+, Edge 113+)
- IndexedDB support
- Service Worker support for offline features
- Optional: Web Speech API for STT/TTS

## File Structure
```
client/
  src/
    components/        # React components
      ui/             # Shadcn UI primitives
      AppSidebar.tsx  # Session management
      ChatInput.tsx   # Input with STT
      MessageList.tsx # Virtualized messages
      SettingsPanel.tsx
    lib/              # Utilities
      db.ts           # Dexie database
      worker-client.ts # Worker communication
      markdown.ts     # Sanitization
      settings.ts     # Persistence
      speech.ts       # STT/TTS
    pages/
      ChatPage.tsx    # Main application
    workers/
      ai.worker.ts    # WebLLM inference
shared/
  schema.ts           # TypeScript types + Zod schemas
public/
  service-worker.js   # PWA offline support
```

## Known Limitations
- WebGPU not available on Firefox or Safari yet
- Model files are large (1-3GB) - first download takes time
- Speech recognition not available on all browsers
- Mobile performance depends on device GPU capabilities
