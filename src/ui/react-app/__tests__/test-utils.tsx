import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { WorkstreamProvider } from '@/lib/workstream-context';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock global fetch
global.fetch = jest.fn();

// Default workstream configurations for testing
const mockWorkstreams = [
  { name: 'ora', displayName: 'Ora System', description: 'Autonomous agent platform' },
  { name: 'mecca', displayName: 'Mecca Project', description: 'Strategic business development' },
  { name: 'sales', displayName: 'Sales Workstream', description: 'Customer acquisition' }
];

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  workstream?: string;
  workstreams?: Array<{name: string, displayName: string, description: string}>;
}

// Custom render function that includes WorkstreamProvider
export function renderWithWorkstream(
  ui: React.ReactElement,
  {
    workstream = 'ora',
    workstreams = mockWorkstreams,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WorkstreamProvider defaultWorkstream={workstream}>
        {children}
      </WorkstreamProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API responses
export const mockApiResponses = {
  phases: [
    { id: '11', number: '11', title: 'Artefact Hierarchy and Filtering', fullTitle: 'Phase 11: Artefact Hierarchy and Filtering' },
    { id: '12', number: '12', title: 'Administration & Governance', fullTitle: 'Phase 12: Administration & Governance' },
    { id: '13', number: '13', title: 'Data Audit & Compliance', fullTitle: 'Phase 13: Data Audit & Compliance' },
    { id: '14', number: '14', title: 'Semantic/LLM Feature Enhancements', fullTitle: 'Phase 14: Semantic/LLM Feature Enhancements' },
    { id: '15', number: '15', title: 'Data Flow Integrity, Policy & Systems Safeguards', fullTitle: 'Phase 15: Data Flow Integrity, Policy & Systems Safeguards' }
  ],
  demoLoops: {
    artefacts: [
      {
        id: 'test-artefact-1',
        title: 'Test Task 1',
        type: 'task',
        status: 'in_progress',
        workstream: 'ora',
        program: 'Phase 11 – Artefact Hierarchy and Filtering',
        project: 'Project 11.1: Artefact Schema and Canonicalization',
        tags: ['test', 'urgent'],
        created: '2025-01-01',
        filePath: 'runtime/workstreams/ora/artefacts/test-task-1.md'
      },
      {
        id: 'test-artefact-2',
        title: 'Test Task 2',
        type: 'task',
        status: 'complete',
        workstream: 'ora',
        program: 'Phase 12 – Administration & Governance',
        project: 'Project 12.1: Admin Interface',
        tags: ['test'],
        created: '2025-01-02',
        filePath: 'runtime/workstreams/ora/artefacts/test-task-2.md'
      }
    ]
  },
  systemDocs: {
    files: ['roadmap.md', 'alignment-protocol.md', 'architecture-decisions.md'],
    selectedFile: {
      content: '# Test Roadmap\n\nThis is a test roadmap content.',
      name: 'roadmap.md'
    }
  }
};

// Setup fetch mocks
export function setupFetchMocks() {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/phases')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponses.phases)
        });
      }
      
      if (url.includes('/api/demo-loops')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponses.demoLoops)
        });
      }
      
      if (url.includes('/api/system-docs')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponses.systemDocs)
        });
      }
      
      // Default 404 for unknown endpoints
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
  });
}

// Mock workstream API functions
export const mockWorkstreamApi = {
  extractWorkstreamContext: jest.fn().mockResolvedValue({
    workstream: 'ora',
    isValid: true,
    source: 'default'
  }),
  createWorkstreamResponse: jest.fn(),
  createWorkstreamErrorResponse: jest.fn(),
  logWorkstreamOperation: jest.fn().mockResolvedValue(undefined)
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithWorkstream as render }; 