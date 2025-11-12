import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web APIs not available in jsdom
if (!global.crypto?.randomUUID) {
  Object.defineProperty(global.crypto, 'randomUUID', {
    value: () => Math.random().toString(36).substring(2, 15),
    writable: true,
  });
}

// Mock navigator.gpu for WebGPU tests
Object.defineProperty(navigator, 'gpu', {
  writable: true,
  value: undefined,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IndexedDB for Dexie tests
const indexedDB = require('fake-indexeddb');
const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// Suppress console errors during tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {});
