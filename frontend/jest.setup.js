require('@testing-library/jest-dom');

// Mock TextEncoder/TextDecoder which is used by React Router v7
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Increase timeout for async operations
jest.setTimeout(30000);

const { act } = require('react-dom/test-utils');

// Configure React concurrent mode for testing
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Configure Jest DOM environment for async testing
window.fetch = global.fetch;

// Configure testing environment with real timers for async tests
jest.useFakeTimers({ advanceTimers: true, doNotFake: ['nextTick', 'setImmediate'] });

// Add proper RAF polyfill
globalThis.requestAnimationFrame = (cb) => {
  const start = Date.now();
  return setTimeout(() => cb(start), 0);
};

// Configure async utils
require('@testing-library/dom').configure({
  asyncUtilTimeout: 2000,
  eventWrapper: (cb) => {
    let result;
    act(() => {
      result = cb();
    });
    return result;
  },
});

// Suppress specific console warnings
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && (
      args[0].includes('inside a test was not wrapped in act') ||
      args[0].includes('not configured to support act')
    )
  ) {
    return;
  }
  originalError.call(console, ...args);
};
