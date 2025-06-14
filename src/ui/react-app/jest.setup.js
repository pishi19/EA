import '@testing-library/jest-dom';

// Add TextEncoder/TextDecoder polyfills for MSW
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add fetch polyfill for MSW
global.fetch = require('node-fetch');

// Add BroadcastChannel polyfill for MSW
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

// A more aggressive mock for PointerEvent and related functions
global.PointerEvent = class PointerEvent extends Event {};
global.HTMLElement.prototype.hasPointerCapture = () => false;
global.HTMLElement.prototype.releasePointerCapture = () => {};
global.HTMLElement.prototype.scrollIntoView = () => {};

// Mock NextRequest properly with better compatibility
class MockNextRequest {
  constructor(url, options = {}) {
    this._url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body;
  }

  get url() {
    return this._url;
  }

  get nextUrl() {
    const urlObj = new URL(this._url);
    return {
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams,
      search: urlObj.search,
      href: urlObj.href
    };
  }

  async json() {
    if (this._body) {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
    return {};
  }

  async text() {
    return this._body || '';
  }
}

// Mock NextResponse
class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  static json(data, init = {}) {
    const response = new MockNextResponse(JSON.stringify(data), init);
    response.headers.set('content-type', 'application/json');
    return response;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return this.body || '';
  }
}

// Global mocks
global.NextRequest = MockNextRequest;
global.NextResponse = MockNextResponse;

// Mock file system with proper jest.fn() methods
const mockFs = {
  readFile: jest.fn(),
  readdir: jest.fn(),
  writeFile: jest.fn(),
  stat: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn()
};

// Create properly mocked fs/promises
jest.mock('fs/promises', () => mockFs);
jest.mock('fs', () => ({
  promises: mockFs,
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Expose mockFs for test use
global.mockFs = mockFs;

// Mock URL constructor for API route testing
global.URL = class MockURL {
  constructor(url, base) {
    this.href = url;
    this.searchParams = new URLSearchParams(url.split('?')[1] || '');
  }
}; 