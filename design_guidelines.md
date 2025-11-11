# HRAI Mind v3 Design Guidelines

## Design Approach

**Selected Approach:** Design System with Chat Interface Best Practices  
**Primary References:** ChatGPT (conversation flow), Linear (typography precision), Notion (sidebar organization)  
**Rationale:** Utility-focused AI chat application requiring clarity, performance, and established patterns for optimal user productivity.

---

## Core Design Principles

1. **Clarity Over Decoration** - Every element serves a functional purpose
2. **Performance-First** - Minimal animations to support virtualized rendering
3. **Information Hierarchy** - Clear distinction between user, assistant, and system states
4. **Accessibility** - Keyboard navigation, screen reader support, high contrast ratios

---

## Typography System

**Primary Font:** `Inter` (via Google Fonts CDN)  
**Monospace Font:** `JetBrains Mono` (for code blocks)

**Hierarchy:**
- **App Title/Headers:** `text-xl font-semibold` (20px, 600 weight)
- **Session Titles:** `text-base font-medium` (16px, 500 weight)
- **Message Content:** `text-sm` (14px, 400 weight)
- **Code Blocks:** `text-sm font-mono` (14px, monospace)
- **Metadata/Timestamps:** `text-xs` (12px, 400 weight)
- **Button Labels:** `text-sm font-medium` (14px, 500 weight)

---

## Layout System

**Spacing Primitives:** Tailwind units of `2, 3, 4, 6, 8, 12` (e.g., `p-4`, `gap-6`, `mt-8`)

**Grid Structure:**
- **Desktop (lg:):** Three-column layout - `Sidebar (280px) | Chat Area (flex-1) | Settings Panel (320px, collapsible)`
- **Tablet (md:):** Two-column - `Sidebar (collapsible) | Chat Area (flex-1)`
- **Mobile:** Single column with hamburger menu for sidebar access

**Container Constraints:**
- Message bubbles: `max-w-3xl` for readability
- Code blocks: `max-w-full` with horizontal scroll if needed
- Input area: Full width with `max-w-4xl` centered

---

## Component Library

### Navigation & Structure

**Sidebar (Session Management):**
- Fixed width 280px on desktop, slide-over on mobile
- Scrollable session list with virtualization for 100+ sessions
- Session items: `py-3 px-4` with `rounded-lg` hover state
- "New Chat" button prominently at top: `w-full py-2.5`
- Active session indicator: Left border accent

**Top Bar:**
- Height: `h-14`
- Model status indicator (loading/ready/error)
- Settings icon button (top-right)
- Current session title (truncated with ellipsis)

### Core UI Elements

**Message Bubbles:**
- User messages: Right-aligned, distinct background treatment
- Assistant messages: Left-aligned, full-width with avatar space
- Padding: `p-4` for message content
- Border radius: `rounded-2xl` for bubbles
- Gap between messages: `space-y-4`

**Code Blocks:**
- Syntax highlighting container with header showing language
- Copy button (top-right corner of code block)
- Padding: `p-4`
- Border radius: `rounded-lg`
- Horizontal scroll for overflow

**Input Area:**
- Fixed bottom position (sticky)
- Multi-line textarea with auto-expand (max 4-5 lines)
- Send button and Stop button side-by-side
- Voice input button (STT) adjacent to textarea
- Padding: `p-4` around input container

### Forms & Controls

**Settings Panel:**
- Slide-in from right on desktop, full-screen modal on mobile
- Form sections with clear labels
- Input fields: `h-10 px-3 rounded-md`
- Dropdowns: `h-10 px-3 rounded-md`
- Checkboxes/toggles: `h-6` aligned with labels
- Section spacing: `space-y-6`

**Buttons:**
- Primary (Send): `h-10 px-6 rounded-lg font-medium`
- Secondary (Stop/Cancel): `h-10 px-4 rounded-lg`
- Icon buttons: `h-10 w-10 rounded-lg` (Settings, Voice, Copy)
- New Chat: `h-10 w-full rounded-lg font-medium`

### Data Display

**Loading States:**
- Model loading: Skeleton pulse animation for message area
- Streaming response: Typing indicator (three animated dots)
- Message sending: Disabled input with subtle opacity change

**Status Indicators:**
- Model ready: Small dot indicator (8px diameter)
- Loading: Spinning circle (16px)
- Error: Alert icon with inline error message
- Offline mode: Banner notification at top

**Metrics Display:**
- Token count: `text-xs` below input area
- Response time: `text-xs` in message metadata
- Model info: Compact card in settings

### Overlays & Modals

**Error Boundary:**
- Full-screen centered error message
- Reload button and error details (collapsible)
- Padding: `p-8`

**Toast Notifications:**
- Fixed bottom-right position (desktop) or top-center (mobile)
- Auto-dismiss after 4 seconds
- Width: `max-w-sm`
- Padding: `p-4`
- Border radius: `rounded-lg`

---

## Performance Considerations

**Animation Policy:**
- **Avoid:** Page transitions, message entrance animations, scroll-triggered effects
- **Use Sparingly:** Button hover states (opacity/scale), loading spinners, toast slide-in
- **Never:** Auto-scroll animations (instant jump for performance)

**Virtualization Requirements:**
- Message list must use `VariableSizeList` with measured heights
- No animations on virtualized items
- Scroll position restoration on history load must be instant

---

## Responsive Behavior

**Breakpoints:**
- Mobile: `< 768px` - Single column, slide-over sidebar
- Tablet: `768px - 1024px` - Collapsible sidebar + chat
- Desktop: `> 1024px` - Full three-column layout

**Mobile Optimizations:**
- Larger touch targets: Minimum `h-12 w-12` for icon buttons
- Bottom-sheet style settings panel
- Simplified toolbar (essential actions only)
- Textarea expands to comfortable height

---

## Accessibility Standards

- All interactive elements keyboard accessible (Tab navigation)
- Focus indicators: `ring-2 ring-offset-2` on focus
- ARIA labels for icon buttons
- Semantic HTML: `<main>`, `<aside>`, `<nav>`, `<article>` for messages
- Color contrast ratio: Minimum 4.5:1 for text
- Screen reader announcements for streaming responses
- Skip to content link for keyboard users

---

## Images

**No Hero Images** - This is a functional chat application, not a marketing site. All visual space prioritizes chat functionality and message readability.