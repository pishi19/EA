require('@testing-library/jest-dom');

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

// Mock Next.js Request and Response for API route testing
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body;
  }

  async json() {
    return JSON.parse(this._body || '{}');
  }

  async text() {
    return this._body || '';
  }
};

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

// Mock URL constructor for API route testing
global.URL = class MockURL {
  constructor(url, base) {
    this.href = url;
    this.searchParams = new URLSearchParams(url.split('?')[1] || '');
  }
}; 