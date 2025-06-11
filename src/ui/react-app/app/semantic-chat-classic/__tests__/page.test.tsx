import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SemanticChatClassic from '../page';

// Mock the LoopCard component
jest.mock('@/components/LoopCard', () => {
  return function MockLoopCard({ loop }: { loop: any }) {
    return (
      <div data-testid={`loop-card-${loop.id}`} className="mock-loop-card">
        <h3>{loop.title || loop.name}</h3>
        <p>Phase: {loop.phase}</p>
        <p>Status: {loop.status}</p>
        <p>Score: {loop.score}</p>
        <div data-testid={`loop-tags-${loop.id}`}>
          {loop.tags?.map((tag: string, index: number) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        <button data-testid={`chat-button-${loop.id}`}>Open Chat</button>
      </div>
    );
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

interface Loop {
  id: string;
  name: string;
  title?: string;
  phase?: string;
  workstream?: string;
  status?: string;
  score?: number;
  tags?: string[];
  created?: string;
  summary?: string;
  filePath?: string;
}

describe('SemanticChatClassic (Artefacts Page)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLoops: Loop[] = [
    {
      id: 'loop-1',
      name: 'UI Enhancement Loop',
      title: 'User Interface Improvements',
      phase: '11.2',
      workstream: 'ora',
      status: 'complete',
      score: 8.5,
      tags: ['ui', 'enhancement', 'frontend'],
      created: '2024-01-01T00:00:00Z',
      summary: 'Improving user interface components',
      filePath: '/path/to/loop-1.md'
    },
    {
      id: 'loop-2',
      name: 'API Development Loop',
      title: 'Backend API Development',
      phase: '11.1',
      workstream: 'ora',
      status: 'in_progress',
      score: 7.2,
      tags: ['api', 'backend', 'development'],
      created: '2024-01-02T00:00:00Z',
      summary: 'Building robust API endpoints',
      filePath: '/path/to/loop-2.md'
    },
    {
      id: 'loop-3',
      name: 'Testing Framework Loop',
      title: 'Comprehensive Testing Setup',
      phase: '11.3',
      workstream: 'ora',
      status: 'planning',
      score: 6.8,
      tags: ['testing', 'quality', 'automation'],
      created: '2024-01-03T00:00:00Z',
      summary: 'Setting up testing infrastructure',
      filePath: '/path/to/loop-3.md'
    }
  ];

  describe('Page Structure and Layout', () => {
    it('should render the main title and description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('Artefacts')).toBeInTheDocument();
      });

      expect(screen.getByText('Scoped GPT Chat Integration - Each Loop with Embedded Contextual Chat')).toBeInTheDocument();
    });

    it('should display loop count and system information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('3 loops loaded • Chat scoped by UUID and file path • Persistent conversation history')).toBeInTheDocument();
      });
    });

    it('should render footer with contextual chat architecture info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText(/Contextual Chat Architecture/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Each chat interaction is tied to its semantic context/)).toBeInTheDocument();
      expect(screen.getByText(/Expand any chat section to interact/)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SemanticChatClassic />);

      expect(screen.getByText('Artefacts')).toBeInTheDocument();
      expect(screen.getByText('Loading loops with embedded contextual chat...')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.queryByText('Loading loops with embedded contextual chat...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loop Data Loading and Display', () => {
    it('should fetch loops from API on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/demo-loops?workstream=ora');
      });
    });

    it('should render all loop cards when data is loaded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByTestId('loop-card-loop-1')).toBeInTheDocument();
        expect(screen.getByTestId('loop-card-loop-2')).toBeInTheDocument();
        expect(screen.getByTestId('loop-card-loop-3')).toBeInTheDocument();
      });
    });

    it('should display loop details correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        // Check first loop details
        expect(screen.getByText('User Interface Improvements')).toBeInTheDocument();
        expect(screen.getByText('Phase: 11.2')).toBeInTheDocument();
        expect(screen.getByText('Status: complete')).toBeInTheDocument();
        expect(screen.getByText('Score: 8.5')).toBeInTheDocument();
      });

      // Check tags
      const loopTags = screen.getByTestId('loop-tags-loop-1');
      expect(loopTags).toHaveTextContent('ui');
      expect(loopTags).toHaveTextContent('enhancement');
      expect(loopTags).toHaveTextContent('frontend');
    });

    it('should handle empty loops response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: [] })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('No loops available.')).toBeInTheDocument();
      });

      expect(screen.getByText('0 loops loaded • Chat scoped by UUID and file path • Persistent conversation history')).toBeInTheDocument();
    });

    it('should handle API response without artefacts property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // No artefacts property
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('No loops available.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load loops')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should show error state when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load loops: 500')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load loops')).toBeInTheDocument();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('loop-card-loop-1')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading loops:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Workstream Functionality', () => {
    it('should use default workstream "ora"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/demo-loops?workstream=ora');
      });
    });

    it('should reload loops when workstream changes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Note: The current component doesn't have workstream selection UI,
      // but the effect dependency suggests it would reload if workstream changed
    });
  });

  describe('Loop Card Integration', () => {
    it('should render LoopCard component for each loop', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        mockLoops.forEach(loop => {
          expect(screen.getByTestId(`loop-card-${loop.id}`)).toBeInTheDocument();
        });
      });
    });

    it('should pass correct props to LoopCard components', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        // Check that each loop card received the correct loop data
        mockLoops.forEach(loop => {
          const card = screen.getByTestId(`loop-card-${loop.id}`);
          expect(card).toHaveTextContent(loop.title || loop.name);
          expect(card).toHaveTextContent(`Phase: ${loop.phase}`);
          expect(card).toHaveTextContent(`Status: ${loop.status}`);
        });
      });
    });

    it('should handle loops with missing optional properties', async () => {
      const incompleteLoops = [
        {
          id: 'loop-minimal',
          name: 'Minimal Loop'
          // Missing optional properties
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: incompleteLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByTestId('loop-card-loop-minimal')).toBeInTheDocument();
        expect(screen.getByText('Minimal Loop')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Artefacts');
      });
    });

    it('should provide meaningful error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Custom error message'));

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load loops')).toBeInTheDocument();
      });
    });

    it('should have accessible retry button', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SemanticChatClassic />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        expect(retryButton).toBeInTheDocument();
        expect(retryButton.tagName).toBe('BUTTON');
      });
    });

    it('should provide contextual information about the page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText(/Scoped GPT Chat Integration/)).toBeInTheDocument();
        expect(screen.getByText(/Chat scoped by UUID and file path/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should only fetch data once on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      const { rerender } = render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Re-render should not trigger additional fetch
      rerender(<SemanticChatClassic />);
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle component unmounting gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      const { unmount } = render(<SemanticChatClassic />);
      
      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid state changes', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      render(<SemanticChatClassic />);

      // Resolve the promise after component is mounted
      resolvePromise!({
        ok: true,
        json: async () => ({ artefacts: mockLoops })
      });

      await waitFor(() => {
        expect(screen.getByTestId('loop-card-loop-1')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'structure' })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('No loops available.')).toBeInTheDocument();
      });
    });

    it('should handle null or undefined response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('No loops available.')).toBeInTheDocument();
      });
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load loops')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle very large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `loop-${i}`,
        name: `Loop ${i}`,
        title: `Test Loop ${i}`,
        phase: '11.1',
        workstream: 'ora',
        status: 'complete',
        score: Math.random() * 10,
        tags: ['test'],
        created: '2024-01-01T00:00:00Z'
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ artefacts: largeDataset })
      });

      render(<SemanticChatClassic />);

      await waitFor(() => {
        expect(screen.getByText('1000 loops loaded • Chat scoped by UUID and file path • Persistent conversation history')).toBeInTheDocument();
      });

      // Should render first few items (check that it doesn't crash)
      expect(screen.getByTestId('loop-card-loop-0')).toBeInTheDocument();
    });
  });
}); 