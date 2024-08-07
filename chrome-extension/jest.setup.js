require("@testing-library/jest-dom");

// Mock chrome.storage.local
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
};
