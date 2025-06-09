import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContextualChatDemo from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockLoopsData = [
  {
    id: 'loop-1',
    name: 'Test Loop 1',
    title: 'UI Enhancement Planning',
    phase: '1.2',
    workstream: 'ui-development',
    status: 'complete',
    score: 8.5,
    tags: ['planning', 'ui', 'enhancement'],
    created: '2024-01-01T00:00:00Z',
    uuid: 'uuid-1',
    summary: 'Planning document for UI enhancements',
    filePath: '/runtime/loops/loop-1.md'
  },
  {
    id: 'loop-2',
    name: 'Test Loop 2',
    title: 'Backend API Development',
    phase: '1.3',
    workstream: 'backend-development',
    status: 'in_progress',
    score: 7.2,
    tags: ['api', 'backend', 'development'],
    created: '2024-01-02T00:00:00Z',
    uuid: 'uuid-2',
    summary: 'API development retrospective',
    filePath: '/runtime/loops/loop-2.md'
  },
  {
    id: 'loop-3',
    name: 'Test Loop 3',
    title: 'Testing Framework Setup',
    phase: '1.1',
    workstream: 'testing',
    status: 'complete',
    score: 9.1,
    tags: ['testing', 'framework', 'setup'],
    created: '2024-01-03T00:00:00Z',
    uuid: 'uuid-3',
    summary: 'Setting up comprehensive testing framework',
    filePath: '/runtime/loops/loop-3.md'
  }
];

describe('ContextualChatDemo', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockLoopsData,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Loading', () => {
    it('displays loading message initially', async () => {
      render(<ContextualChatDemo />);
      expect(screen.getByText('Loading contextual artefacts...')).toBeInTheDocument();
    });

    it('loads and displays artefacts after successful API call', async () => {
      render(<ContextualChatDemo />);
      
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });

      expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      expect(screen.getByText('Backend API Development')).toBeInTheDocument();
      expect(screen.getByText('Testing Framework Setup')).toBeInTheDocument();
    });

    it('displays error message when API call fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      render(<ContextualChatDemo />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: API Error/)).toBeInTheDocument();
      });
    });

    it('displays error message when API returns non-ok response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      render(<ContextualChatDemo />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: Failed to load loops: 500/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    beforeEach(async () => {
      render(<ContextualChatDemo />);
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });
    });

    it('filters by workstream correctly', async () => {
      // Find and click workstream filter
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      
      // Select ui-development workstream
      fireEvent.click(screen.getByText('ui-development'));
      
      // Should only show UI Enhancement Planning
      expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      expect(screen.queryByText('Backend API Development')).not.toBeInTheDocument();
      expect(screen.queryByText('Testing Framework Setup')).not.toBeInTheDocument();
    });

    it('filters by program (phase) correctly', async () => {
      // Find and click program filter
      const programSelect = screen.getByRole('combobox', { name: /program/i });
      fireEvent.click(programSelect);
      
      // Select Phase 1.2
      fireEvent.click(screen.getByText('Phase 1.2'));
      
      // Should only show UI Enhancement Planning
      expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      expect(screen.queryByText('Backend API Development')).not.toBeInTheDocument();
      expect(screen.queryByText('Testing Framework Setup')).not.toBeInTheDocument();
    });

    it('filters by project (tags) correctly', async () => {
      // Find and click project filter
      const projectSelect = screen.getByRole('combobox', { name: /project/i });
      fireEvent.click(projectSelect);
      
      // Select 'testing' tag
      fireEvent.click(screen.getByText('testing'));
      
      // Should only show Testing Framework Setup
      expect(screen.queryByText('UI Enhancement Planning')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend API Development')).not.toBeInTheDocument();
      expect(screen.getByText('Testing Framework Setup')).toBeInTheDocument();
    });

    it('filters by status correctly', async () => {
      // Find and click status filter
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      
      // Select 'In Progress'
      fireEvent.click(screen.getByText('In Progress'));
      
      // Should only show Backend API Development
      expect(screen.queryByText('UI Enhancement Planning')).not.toBeInTheDocument();
      expect(screen.getByText('Backend API Development')).toBeInTheDocument();
      expect(screen.queryByText('Testing Framework Setup')).not.toBeInTheDocument();
    });

    it('combines multiple filters correctly', async () => {
      // Apply workstream filter first
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('backend-development'));
      
      // Then apply status filter
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByText('In Progress'));
      
      // Should only show Backend API Development (matches both filters)
      expect(screen.queryByText('UI Enhancement Planning')).not.toBeInTheDocument();
      expect(screen.getByText('Backend API Development')).toBeInTheDocument();
      expect(screen.queryByText('Testing Framework Setup')).not.toBeInTheDocument();
    });

    it('shows "no results" message when filters match no items', async () => {
      // Apply filters that match nothing
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('ui-development'));
      
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByText('In Progress'));
      
      // Should show no results message
      expect(screen.getByText('No artefacts match the current filters.')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(async () => {
      render(<ContextualChatDemo />);
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });
    });

    it('sorts by score descending', async () => {
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.click(sortSelect);
      fireEvent.click(screen.getByText('Score (High→Low)'));
      
      // Check order: Testing Framework Setup (9.1), UI Enhancement Planning (8.5), Backend API Development (7.2)
      const artefacts = screen.getAllByText(/Planning|Development|Setup/);
      expect(artefacts[0]).toHaveTextContent('Testing Framework Setup');
      expect(artefacts[1]).toHaveTextContent('UI Enhancement Planning');
      expect(artefacts[2]).toHaveTextContent('Backend API Development');
    });

    it('sorts by title alphabetically', async () => {
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.click(sortSelect);
      fireEvent.click(screen.getByText('Title (A→Z)'));
      
      // Check alphabetical order
      const artefacts = screen.getAllByText(/Planning|Development|Setup/);
      expect(artefacts[0]).toHaveTextContent('Backend API Development');
      expect(artefacts[1]).toHaveTextContent('Testing Framework Setup');
      expect(artefacts[2]).toHaveTextContent('UI Enhancement Planning');
    });
  });

  describe('Clear Filters Functionality', () => {
    beforeEach(async () => {
      render(<ContextualChatDemo />);
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });
    });

    it('clears all filters when Clear Filters button is clicked', async () => {
      // Apply some filters first
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('ui-development'));
      
      // Verify filter is applied
      expect(screen.queryByText('Backend API Development')).not.toBeInTheDocument();
      
      // Click Clear Filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);
      
      // All artefacts should be visible again
      expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      expect(screen.getByText('Backend API Development')).toBeInTheDocument();
      expect(screen.getByText('Testing Framework Setup')).toBeInTheDocument();
    });

    it('clears filters from no-results state', async () => {
      // Apply conflicting filters
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('ui-development'));
      
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByText('In Progress'));
      
      // Should show no results
      expect(screen.getByText('No artefacts match the current filters.')).toBeInTheDocument();
      
      // Click Clear All Filters from no-results message
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      fireEvent.click(clearButton);
      
      // All artefacts should be visible again
      expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      expect(screen.getByText('Backend API Development')).toBeInTheDocument();
      expect(screen.getByText('Testing Framework Setup')).toBeInTheDocument();
    });
  });

  describe('Type Badges', () => {
    beforeEach(async () => {
      render(<ContextualChatDemo />);
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });
    });

    it('displays correct type badges based on tags', async () => {
      // Planning badge for loop with planning tags
      expect(screen.getByText('Planning')).toBeInTheDocument();
      
      // Execution badge should be default for other loops
      const executionBadges = screen.getAllByText('Execution');
      expect(executionBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Display', () => {
    beforeEach(async () => {
      render(<ContextualChatDemo />);
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });
    });

    it('displays correct total and filtered counts', async () => {
      expect(screen.getByText('Total:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total artefacts
      expect(screen.getByText('Filtered:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Filtered count (initially same as total)
    });

    it('updates filtered count when filters are applied', async () => {
      // Apply workstream filter
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('ui-development'));
      
      // Should show 1 filtered result
      await waitFor(() => {
        expect(screen.getByText('Filtered:')).toBeInTheDocument();
        const filteredCounts = screen.getAllByText('1');
        expect(filteredCounts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Retry Functionality', () => {
    it('allows retrying when initial load fails', async () => {
      // Mock initial failure
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
      
      render(<ContextualChatDemo />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: Network Error/)).toBeInTheDocument();
      });
      
      // Mock successful retry
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoopsData,
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      });
    });

    it('allows retrying from loading state', async () => {
      // Mock slow/hanging request
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<ContextualChatDemo />);
      
      expect(screen.getByText('Loading contextual artefacts...')).toBeInTheDocument();
      
      // Mock successful retry
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoopsData,
      });
      
      const retryButton = screen.getByRole('button', { name: /retry loading/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('UI Enhancement Planning')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<ContextualChatDemo />);
      await waitFor(() => {
        expect(screen.getByText('Semantic Chat Demo')).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels for form controls', () => {
      expect(screen.getByRole('combobox', { name: /workstream/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /program/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /project/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      expect(screen.getByRole('heading', { level: 1, name: /semantic chat demo/i })).toBeInTheDocument();
    });
  });
}); 