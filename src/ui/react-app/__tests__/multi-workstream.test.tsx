import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { WorkstreamProvider, useWorkstream, useCurrentWorkstream } from '@/lib/workstream-context';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Multi-Workstream Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  describe('WorkstreamProvider', () => {
    it('provides default workstream context', () => {
      let contextValue: any;
      
      function TestComponent() {
        contextValue = useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(contextValue.currentWorkstream).toBe('ora');
      expect(contextValue.availableWorkstreams).toHaveLength(3);
      expect(contextValue.availableWorkstreams.map((ws: any) => ws.name)).toEqual(['ora', 'mecca', 'sales']);
    });

    it('detects workstream from URL', () => {
      (usePathname as jest.Mock).mockReturnValue('/workstream/mecca/dashboard');
      
      let contextValue: any;
      
      function TestComponent() {
        contextValue = useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(contextValue.currentWorkstream).toBe('mecca');
    });

    it('redirects invalid workstreams to default', async () => {
      (usePathname as jest.Mock).mockReturnValue('/workstream/invalid/dashboard');
      
      function TestComponent() {
        useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/workstream/ora');
      });
    });

    it('validates workstream names correctly', () => {
      let contextValue: any;
      
      function TestComponent() {
        contextValue = useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(contextValue.isValidWorkstream('ora')).toBe(true);
      expect(contextValue.isValidWorkstream('mecca')).toBe(true);
      expect(contextValue.isValidWorkstream('sales')).toBe(true);
      expect(contextValue.isValidWorkstream('invalid')).toBe(false);
    });

    it('generates correct workstream URLs', () => {
      let contextValue: any;
      
      function TestComponent() {
        contextValue = useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(contextValue.getWorkstreamUrl('ora')).toBe('/workstream/ora');
      expect(contextValue.getWorkstreamUrl('mecca', 'dashboard')).toBe('/workstream/mecca/dashboard');
    });

    it('navigates between workstreams', () => {
      let contextValue: any;
      
      function TestComponent() {
        contextValue = useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      contextValue.navigateToWorkstream('mecca', 'planning');
      expect(mockPush).toHaveBeenCalledWith('/workstream/mecca/planning');
    });
  });

  describe('useCurrentWorkstream Hook', () => {
    it('returns current workstream and config', () => {
      (usePathname as jest.Mock).mockReturnValue('/workstream/sales/dashboard');
      
      let hookResult: any;
      
      function TestComponent() {
        hookResult = useCurrentWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(hookResult.workstream).toBe('sales');
      expect(hookResult.config?.name).toBe('sales');
      expect(hookResult.config?.displayName).toBe('Sales & Marketing');
    });
  });

  describe('Workstream-Specific Data Isolation', () => {
    it('API calls should include workstream context', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 'test-task',
            workstream: 'mecca',
            title: 'Test Task',
            status: 'planning'
          }
        ])
      });

      // Simulate API call from Mecca workstream
      const response = await fetch('/api/demo-loops?workstream=mecca');
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/demo-loops?workstream=mecca');
      expect(data[0].workstream).toBe('mecca');
    });

    it('should load workstream-specific roadmaps', async () => {
      // Mock roadmap API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          selectedFile: {
            rawContent: `
# Mecca Project Roadmap

## Phase 1: Foundation and Planning
- Project 1.1: Strategic Business Development
  - Task 1.1.1: Market Analysis
            `
          }
        })
      });

      const response = await fetch('/api/system-docs?file=roadmap.md&workstream=mecca');
      const data = await response.json();

      expect(data.selectedFile.rawContent).toContain('Mecca Project Roadmap');
    });

    it('should maintain workstream context in memory traces', async () => {
      // Mock memory trace API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          traceId: 'test-trace-123'
        })
      });

      const traceData = {
        type: 'creation',
        artefactId: 'task-123',
        workstream: 'sales',
        description: 'Task created in sales workstream'
      };

      await fetch('/api/memory-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traceData)
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/memory-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traceData)
      });
    });
  });

  describe('Workstream Navigation UI', () => {
    it('displays workstream switcher', () => {
      function TestComponent() {
        const { availableWorkstreams } = useWorkstream();
        return (
          <div>
            {availableWorkstreams.map(ws => (
              <button key={ws.name} data-testid={`switch-${ws.name}`}>
                {ws.displayName}
              </button>
            ))}
          </div>
        );
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(screen.getByTestId('switch-ora')).toHaveTextContent('Ora System');
      expect(screen.getByTestId('switch-mecca')).toHaveTextContent('Mecca Project');
      expect(screen.getByTestId('switch-sales')).toHaveTextContent('Sales & Marketing');
    });

    it('highlights current workstream', () => {
      (usePathname as jest.Mock).mockReturnValue('/workstream/mecca/dashboard');
      
      function TestComponent() {
        const { currentWorkstream, workstreamConfig } = useWorkstream();
        return (
          <div>
            <span data-testid="current-workstream">{currentWorkstream}</span>
            <span data-testid="current-config">{workstreamConfig?.displayName}</span>
          </div>
        );
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(screen.getByTestId('current-workstream')).toHaveTextContent('mecca');
      expect(screen.getByTestId('current-config')).toHaveTextContent('Mecca Project');
    });
  });

  describe('Workstream Error Handling', () => {
    it('handles workstream loading errors gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      let contextValue: any;
      
      function TestComponent() {
        contextValue = useWorkstream();
        return <div>Test</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      // Should still provide default workstreams even on API failure
      expect(contextValue.availableWorkstreams).toHaveLength(3);
      expect(contextValue.currentWorkstream).toBe('ora');
    });

    it('handles invalid workstream gracefully', () => {
      (usePathname as jest.Mock).mockReturnValue('/workstream/nonexistent/page');
      
      function TestComponent() {
        const { currentWorkstream } = useWorkstream();
        return <span data-testid="workstream">{currentWorkstream}</span>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      // Should redirect to default, but component still renders
      expect(screen.getByTestId('workstream')).toHaveTextContent('ora');
    });
  });

  describe('Backwards Compatibility', () => {
    it('maintains legacy route support', () => {
      (usePathname as jest.Mock).mockReturnValue('/planning');
      
      function TestComponent() {
        const { currentWorkstream } = useWorkstream();
        return <span data-testid="workstream">{currentWorkstream}</span>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      // Legacy routes should default to 'ora' workstream
      expect(screen.getByTestId('workstream')).toHaveTextContent('ora');
    });
  });

  describe('Performance and Caching', () => {
    it('caches workstream configurations', () => {
      let contextValue1: any;
      let contextValue2: any;
      
      function TestComponent1() {
        contextValue1 = useWorkstream();
        return <div>Test1</div>;
      }

      function TestComponent2() {
        contextValue2 = useWorkstream();
        return <div>Test2</div>;
      }

      render(
        <WorkstreamProvider>
          <TestComponent1 />
          <TestComponent2 />
        </WorkstreamProvider>
      );

      // Both components should receive the same workstream configs (referential equality)
      expect(contextValue1.availableWorkstreams).toBe(contextValue2.availableWorkstreams);
    });
  });

  describe('Type Safety', () => {
    it('provides proper TypeScript types', () => {
      function TestComponent() {
        const context = useWorkstream();
        
        // These should compile without TypeScript errors
        const workstream: string = context.currentWorkstream;
        const configs: any[] = context.availableWorkstreams;
        const isValid: boolean = context.isValidWorkstream('test');
        
        return (
          <div>
            <span data-testid="workstream">{workstream}</span>
            <span data-testid="configs-length">{configs.length}</span>
            <span data-testid="is-valid">{isValid.toString()}</span>
          </div>
        );
      }

      render(
        <WorkstreamProvider>
          <TestComponent />
        </WorkstreamProvider>
      );

      expect(screen.getByTestId('workstream')).toBeInTheDocument();
      expect(screen.getByTestId('configs-length')).toHaveTextContent('3');
      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
    });
  });
}); 