import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock the OpenAI API or LLM service if needed
global.fetch = jest.fn();

describe('/api/artefact-chat API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles valid chat request', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What should I work on next?',
        artefact: {
          id: 'test-task',
          title: 'Test Task',
          status: 'in_progress',
          phase: '11.3.1',
          tags: ['test'],
          summary: 'A test task for validation'
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  it('handles mutation detection correctly', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'mark this task as complete',
        artefact: {
          id: 'test-task',
          title: 'Test Task',
          status: 'in_progress',
          phase: '11.3.1',
          tags: ['test'],
          summary: 'A test task'
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('mutation');
    expect(data.mutation).toEqual({
      type: 'status',
      value: 'complete'
    });
  });

  it('provides context-aware responses', async () => {
    const longRunningTask = {
      id: 'old-task',
      title: 'Old Task',
      status: 'in_progress',
      phase: '10.1',
      tags: [],
      summary: 'An old task',
      created: '2025-01-01' // Old date
    };

    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What should I do with this task?',
        artefact: longRunningTask
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toMatch(/long.*running|review|update|progress/i);
  });

  it('handles blocked task context', async () => {
    const blockedTask = {
      id: 'blocked-task',
      title: 'Blocked Task',
      status: 'blocked',
      phase: '11.3.1',
      tags: ['blocked'],
      summary: 'A blocked task'
    };

    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'How can I unblock this?',
        artefact: blockedTask
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toMatch(/unblock|dependencies|blocker|resolve/i);
  });

  it('handles invalid JSON body', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
  });

  it('handles missing required fields', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test message'
        // Missing artefact field
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
  });

  it('handles empty message', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: '',
        artefact: {
          id: 'test-task',
          title: 'Test Task',
          status: 'in_progress'
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
  });

  it('detects tag addition mutations', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'add urgent tag to this task',
        artefact: {
          id: 'test-task',
          title: 'Test Task',
          status: 'in_progress',
          tags: []
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mutation).toEqual({
      type: 'tag',
      value: 'urgent'
    });
  });

  it('provides appropriate responses for complete tasks', async () => {
    const completeTask = {
      id: 'complete-task',
      title: 'Complete Task',
      status: 'complete',
      phase: '11.3.1',
      tags: [],
      summary: 'A completed task'
    };

    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What should I do next?',
        artefact: completeTask
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toMatch(/complete|finished|archive|next.*task/i);
  });

  it('handles consultation questions appropriately', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/artefact-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What are the dependencies and blockers for this task?',
        artefact: {
          id: 'complex-task',
          title: 'Complex Task',
          status: 'planning',
          phase: '12.1',
          tags: ['complex'],
          summary: 'A complex task with many dependencies'
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toMatch(/dependencies|requirements|blockers|prerequisite/i);
  });

  it('handles performance under load', async () => {
    const requests = Array(5).fill(null).map(() => 
      new NextRequest('http://localhost:3000/api/artefact-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Quick test message',
          artefact: {
            id: 'load-test-task',
            title: 'Load Test Task',
            status: 'in_progress'
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests.map(req => POST(req)));
    const endTime = Date.now();

    // All requests should complete successfully
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Should complete within reasonable time (adjust threshold as needed)
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds for 5 requests
  });
}); 