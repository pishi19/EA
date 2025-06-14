import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Mock external dependencies
jest.mock('fs/promises', () => global.mockFs);
jest.mock('../../../lib/workstream-api', () => ({
  generateWorkstreamChatResponse: jest.fn(),
  buildWorkstreamLLMContext: jest.fn()
}));

const mockWorkstreamApi = require('../../../lib/workstream-api');

describe('/api/contextual-chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    global.mockFs.readFile.mockResolvedValue(`---
title: "Test Loop"
uuid: "test-uuid-123"
workstream: "ora"
phase: "11"
status: "in_progress"
---

# Test Content

This is test content for the loop.`);

    mockWorkstreamApi.generateWorkstreamChatResponse.mockResolvedValue({
      response: 'Test AI response',
      context: {
        workstream: 'ora',
        artefact: 'test-artefact',
        relevantData: ['test-data']
      }
    });

    mockWorkstreamApi.buildWorkstreamLLMContext.mockReturnValue({
      workstream: 'ora',
      systemContext: 'Test system context',
      domainContext: 'Test domain context'
    });
  });

  describe('POST /api/contextual-chat', () => {
    test('handles chat request successfully', async () => {
      const requestBody = {
        message: 'What is the status of this task?',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.response).toBe('Test AI response');
      expect(data.context).toBeDefined();
    });

    test('validates required fields', async () => {
      const requestBody = {
        // Missing required fields
        contextType: 'loop'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('message');
    });

    test('handles file read errors gracefully', async () => {
      global.mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('handles malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid JSON');
    });

    test('handles AI service errors', async () => {
      mockWorkstreamApi.generateWorkstreamChatResponse.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('AI service');
    });

    test('validates workstream parameter', async () => {
      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md'
        // Missing workstream
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('workstream');
    });

    test('handles different context types', async () => {
      const contextTypes = ['loop', 'task', 'project', 'phase'];

      for (const contextType of contextTypes) {
        const requestBody = {
          message: `Test message for ${contextType}`,
          contextType,
          contextId: `test-${contextType}`,
          filePath: `runtime/workstreams/ora/artefacts/test-${contextType}.md`,
          workstream: 'ora'
        };

        const request = new NextRequest('http://localhost/api/contextual-chat', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'content-type': 'application/json' }
        });

        const response = await POST(request);
        
        expect(response.status).toBe(201);
      }
    });

    test('includes workstream context in AI request', async () => {
      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      await POST(request);

      expect(mockWorkstreamApi.buildWorkstreamLLMContext).toHaveBeenCalledWith(
        'ora',
        expect.any(Object)
      );
    });

    test('handles empty message gracefully', async () => {
      const requestBody = {
        message: '',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('message');
    });

    test('logs interactions properly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI response generated')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('GET /api/contextual-chat', () => {
    test('retrieves chat history successfully', async () => {
      const chatHistory = [
        {
          id: 'msg-1',
          message: 'Previous message',
          response: 'Previous response',
          timestamp: '2025-01-20T10:00:00Z'
        }
      ];

      global.mockFs.readFile.mockResolvedValue(JSON.stringify(chatHistory));

      const request = new NextRequest(
        'http://localhost/api/contextual-chat?contextType=loop&contextId=test-task&filePath=test.md'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].message).toBe('Previous message');
    });

    test('handles missing chat history file', async () => {
      global.mockFs.readFile.mockRejectedValue(new Error('ENOENT: file not found'));

      const request = new NextRequest(
        'http://localhost/api/contextual-chat?contextType=loop&contextId=test-task&filePath=test.md'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toEqual([]);
    });

    test('validates required query parameters', async () => {
      const request = new NextRequest(
        'http://localhost/api/contextual-chat?contextType=loop'
        // Missing contextId and filePath
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    test('handles malformed chat history JSON', async () => {
      global.mockFs.readFile.mockResolvedValue('invalid json content');

      const request = new NextRequest(
        'http://localhost/api/contextual-chat?contextType=loop&contextId=test-task&filePath=test.md'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toEqual([]);
    });

    test('sorts chat history by timestamp', async () => {
      const chatHistory = [
        {
          id: 'msg-2',
          message: 'Second message',
          response: 'Second response',
          timestamp: '2025-01-20T11:00:00Z'
        },
        {
          id: 'msg-1',
          message: 'First message',
          response: 'First response',
          timestamp: '2025-01-20T10:00:00Z'
        }
      ];

      global.mockFs.readFile.mockResolvedValue(JSON.stringify(chatHistory));

      const request = new NextRequest(
        'http://localhost/api/contextual-chat?contextType=loop&contextId=test-task&filePath=test.md'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages[0].message).toBe('First message');
      expect(data.messages[1].message).toBe('Second message');
    });
  });

  describe('Error Handling', () => {
    test('handles unsupported HTTP methods', async () => {
      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'DELETE'
      });

      // Should return 405 Method Not Allowed or handle gracefully
      expect(async () => {
        await POST(request);
      }).not.toThrow();
    });

    test('handles very large request bodies', async () => {
      const largeMessage = 'x'.repeat(100000); // 100KB message
      const requestBody = {
        message: largeMessage,
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      // Should handle large requests gracefully
      expect(response.status).toBeLessThan(500);
    });

    test('handles concurrent requests properly', async () => {
      const requestBody = {
        message: 'Concurrent test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const createRequest = () => new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      // Make 5 concurrent requests
      const promises = Array.from({ length: 5 }, () => POST(createRequest()));
      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });

  describe('Response Format', () => {
    test('returns properly formatted successful response', async () => {
      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('context');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('id');
    });

    test('sets correct content-type headers', async () => {
      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('includes proper CORS headers', async () => {
      const requestBody = {
        message: 'Test message',
        contextType: 'loop',
        contextId: 'test-task',
        filePath: 'runtime/workstreams/ora/artefacts/test-task.md',
        workstream: 'ora'
      };

      const request = new NextRequest('http://localhost/api/contextual-chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);

      // Should include CORS headers for cross-origin requests
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });
}); 