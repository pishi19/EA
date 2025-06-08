// Setup file for API route tests
require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
const path = require('path');

// Mock Next.js globals
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
  
  async json() {
    return JSON.parse(this.body);
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
  
  static json(data, init) {
    const response = new Response(JSON.stringify(data), init);
    response.json = async () => data;
    return response;
  }
};

global.Headers = class Headers extends Map {
  constructor(init) {
    super(Object.entries(init || {}));
  }
};

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock NextResponse for API route testing
const mockNextResponse = {
  json: jest.fn((data, init) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
    headers: new Map(),
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map(),
    })),
  }
};

jest.doMock('next/server', () => mockNextResponse);

// Mock path-utils to provide stable paths during testing
jest.doMock('@/lib/path-utils', () => {
  const testProjectRoot = path.resolve(__dirname, '../../..');
  return {
    PATHS: {
      PROJECT_ROOT: testProjectRoot,
      RUNTIME_DIR: path.join(testProjectRoot, 'runtime'),
      LOOPS_DIR: path.join(testProjectRoot, 'runtime', 'loops'),
      PHASES_DIR: path.join(testProjectRoot, 'runtime', 'phases'),
      WORKSTREAMS_DIR: path.join(testProjectRoot, 'runtime', 'workstreams'),
      PLAN_PATH: path.join(testProjectRoot, 'runtime', 'workstreams', 'roadmap', 'workstream_plan.md'),
      BACKUP_DIR: path.join(testProjectRoot, 'runtime', 'backups'),
      ROADMAP_YAML_PATH: path.join(testProjectRoot, 'runtime', 'system_roadmap.yaml'),
    },
    getProjectPath: (...segments) => path.join(testProjectRoot, ...segments),
    getRuntimePath: (...segments) => path.join(testProjectRoot, 'runtime', ...segments),
  };
}); 