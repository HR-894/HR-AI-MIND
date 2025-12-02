# Contributing to HR AI Mind

First off, thank you for considering contributing to HRAI Mind v3! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs** if possible
* **Include your browser version and operating system**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior** and **explain the behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtful, comprehensive tests
* Document new code
* End all files with a newline

## Development Setup

### Prerequisites

* Node.js 18+ or Bun 1.0+
* Git
* A Chromium-based browser with WebGPU support (Chrome 121+, Edge 121+)

### Setup Steps

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/HR-AI-MIND.git`
3. Navigate to the directory: `cd HR-AI-MIND`
4. Install dependencies: `npm install` or `bun install`
5. Create a branch: `git checkout -b feature/your-feature-name`

### Running the Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5000`

### Building for Production

```bash
npm run build
# or
bun build
```

### Running Tests

```bash
npm test
# or
bun test
```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Consider starting the commit message with an applicable emoji:
    * ✨ `:sparkles:` when adding a new feature
    * 🐛 `:bug:` when fixing a bug
    * 📝 `:memo:` when adding documentation
    * 🎨 `:art:` when improving the format/structure of the code
    * ⚡️ `:zap:` when improving performance
    * 🔒 `:lock:` when dealing with security
    * ⬆️ `:arrow_up:` when upgrading dependencies
    * ⬇️ `:arrow_down:` when downgrading dependencies
    * 🔧 `:wrench:` when updating configuration files

### TypeScript Styleguide

* Use TypeScript for all new files
* Prefer interfaces over type aliases when possible
* Use explicit return types for functions
* Avoid `any` - use `unknown` if you must
* Use meaningful variable and function names
* Add JSDoc comments for complex functions
* Follow the existing code style (we use Prettier)

### Component Structure

* One component per file
* Use functional components with hooks
* Extract complex logic into custom hooks
* Keep components small and focused (< 200 lines)
* Use meaningful prop names with TypeScript interfaces

### State Management

* Use Zustand for global state (appStore.ts)
* Use React Query for server state
* Use custom hooks (useChatSessions, useAIWorker) for complex logic
* Avoid local state that should be global
* Keep state as close to where it's used as possible

## Architecture Guidelines

### File Organization

```
client/
  src/
    components/     # Reusable UI components
    hooks/          # Custom React hooks
    lib/            # Utility functions and clients
    pages/          # Route components
    store/          # Zustand store
    workers/        # Web Workers
```

### Best Practices

1. **Separation of Concerns**: Keep UI logic separate from business logic
2. **DRY Principle**: Don't repeat yourself - extract reusable logic
3. **Performance**: Use React.memo, useMemo, useCallback where appropriate
4. **Accessibility**: Ensure components are keyboard-navigable and screen-reader friendly
5. **Error Handling**: Always handle errors gracefully with user feedback
6. **Testing**: Write tests for critical paths and edge cases

## Project-Specific Guidelines

### Working with WebLLM

* All AI worker interactions must go through `useAIWorker` hook
* Never import `workerClient` directly in components
* Handle all worker states (idle, loading, ready, error)
* Always provide user feedback for long-running operations

### Database Operations

* Use Dexie.js for all IndexedDB operations
* Always use transactions for multiple operations
* Handle quota errors gracefully
* Clean up orphaned data when deleting sessions

### PWA Considerations

* Test offline functionality
* Ensure service worker properly caches models
* Update manifest.json when changing app metadata
* Test on mobile devices

## Questions?

Feel free to open an issue with the "question" label if you have any questions about contributing!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
