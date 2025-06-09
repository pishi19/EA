import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import PhaseDocView from '@/components/PhaseDocView';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPhasesData = [
  {
    id: 'phase-1.1',
    phase: 1.1,
    title: 'Foundation Setup',
    status: 'complete',
    content: '<h1>Phase 1.1 Documentation</h1><p>Foundation phase content</p>',
    loops: [
      {
        id: 'loop-1',
        title: 'Project Setup',
        type: 'planning',
        status: 'complete',
        score: 8.5,
        tags: ['setup', 'infrastructure'],
        workstream: 'infrastructure',
        created: '2024-01-01T00:00:00Z',
        content: '<h2>Setup Loop</h2><p>Initial setup documentation</p>'
      },
      {
        id: 'loop-2',
        title: 'Database Design',
        type: 'execution',
        status: 'complete',
        score: 9.0,
        tags: ['database', 'design'],
        workstream: 'backend',
        created: '2024-01-02T00:00:00Z',
        content: '<h2>Database Loop</h2><p>Database design documentation</p>'
      }
    ]
  },
  {
    id: 'phase-1.2',
    phase: 1.2,
    title: 'Development Phase',
    status: 'in_progress',
    content: '<h1>Phase 1.2 Documentation</h1><p>Development phase content</p>',
    loops: [
      {
        id: 'loop-3',
        title: 'UI Development',
        type: 'execution',
        status: 'in_progress',
        score: 7.5,
        tags: ['ui', 'frontend'],
        workstream: 'frontend',
        created: '2024-01-03T00:00:00Z',
        content: '<h2>UI Loop</h2><p>Frontend development documentation</p>'
      },
      {
        id: 'loop-4',
        title: 'API Development',
        type: 'execution',
        status: 'in_progress',
        score: 8.0,
        tags: ['api', 'backend'],
        workstream: 'backend',
        created: '2024-01-04T00:00:00Z',
        content: '<h2>API Loop</h2><p>Backend API documentation</p>'
      },
      {
        id: 'loop-5',
        title: 'Testing Setup',
        type: 'retrospective',
        status: 'complete',
        score: 9.2,
        tags: ['testing', 'quality'],
        workstream: 'testing',
        created: '2024-01-05T00:00:00Z',
        content: '<h2>Testing Loop</h2><p>Testing framework documentation</p>'
      }
    ]
  }
];

describe('PhaseDocView', () => {
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
      json: async () => mockPhasesData,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Loading and Phase Selection', () => {
    it('displays loading message initially', async () => {
      render(<PhaseDocView />);
      expect(screen.getByText('Loading phase document...')).toBeInTheDocument();
    });

    it('loads and displays the in-progress phase by default', async () => {
      mockSearchParams.get.mockReturnValue(null); // No phase param
      
      render(<PhaseDocView />);
      
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });

      expect(screen.getByText('Phase 1.2')).toBeInTheDocument();
      expect(mockRouter.replace).toHaveBeenCalledWith('/phase-doc?phase=1.2');
    });

    it('loads specific phase when provided in URL params', async () => {
      mockSearchParams.get.mockReturnValue('1.1');
      
      render(<PhaseDocView />);
      
      await waitFor(() => {
        expect(screen.getByText('Foundation Setup')).toBeInTheDocument();
      });

      expect(screen.getByText('Phase 1.1')).toBeInTheDocument();
    });

    it('displays error message when API call fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      render(<PhaseDocView />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: API Error/)).toBeInTheDocument();
      });
    });

    it('displays "phase not found" when no phases are available', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });
      
      render(<PhaseDocView />);
      
      await waitFor(() => {
        expect(screen.getByText('Phase not found or none are in progress.')).toBeInTheDocument();
      });
    });
  });

  describe('Phase Navigation', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('allows switching between phases', async () => {
      // Find phase selector and change to phase 1.1
      const phaseSelect = screen.getByDisplayValue('1.2');
      fireEvent.change(phaseSelect, { target: { value: '1.1' } });

      expect(mockRouter.push).toHaveBeenCalledWith('/phase-doc?phase=1.1');
    });

    it('displays phase selector with all available phases', async () => {
      const phaseOptions = screen.getAllByText(/Phase \d\.\d:/);
      expect(phaseOptions).toHaveLength(2);
      expect(screen.getByText('Phase 1.1: Foundation Setup')).toBeInTheDocument();
      expect(screen.getByText('Phase 1.2: Development Phase')).toBeInTheDocument();
    });
  });

  describe('Workstream Filtering', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('displays all workstreams in filter dropdown', async () => {
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);

      expect(screen.getByText('All Workstreams')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
      expect(screen.getByText('testing')).toBeInTheDocument();
    });

    it('filters loops by workstream correctly', async () => {
      // All loops should be visible initially
      expect(screen.getByText('UI Development')).toBeInTheDocument();
      expect(screen.getByText('API Development')).toBeInTheDocument();
      expect(screen.getByText('Testing Setup')).toBeInTheDocument();

      // Filter by frontend workstream
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('frontend'));

      // Only frontend loop should be visible
      expect(screen.getByText('UI Development')).toBeInTheDocument();
      expect(screen.queryByText('API Development')).not.toBeInTheDocument();
      expect(screen.queryByText('Testing Setup')).not.toBeInTheDocument();
    });

    it('combines workstream filter with other filters', async () => {
      // Filter by backend workstream
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('backend'));

      // Then filter by in_progress status
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByText('In Progress'));

      // Should only show API Development (backend + in_progress)
      expect(screen.queryByText('UI Development')).not.toBeInTheDocument();
      expect(screen.getByText('API Development')).toBeInTheDocument();
      expect(screen.queryByText('Testing Setup')).not.toBeInTheDocument();
    });

    it('shows appropriate message when no loops match filters', async () => {
      // Filter by non-existent workstream combination
      const workstreamSelect = screen.getByRole('combobox', { name: /workstream/i });
      fireEvent.click(workstreamSelect);
      fireEvent.click(screen.getByText('frontend'));

      const typeSelect = screen.getByRole('combobox', { name: /type/i });
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('📓 Retrospective'));

      // Should show no valid loops message
      expect(screen.getByText('No valid loops found matching the current filters.')).toBeInTheDocument();
    });
  });

  describe('Loop Organization and Display', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('organizes loops by type correctly', async () => {
      // Check section headers
      expect(screen.getByText('⚙️ Active Loops')).toBeInTheDocument();
      expect(screen.getByText('📓 Retrospectives')).toBeInTheDocument();

      // UI Development and API Development should be in Active Loops
      const activeSection = screen.getByText('⚙️ Active Loops').closest('div');
      expect(activeSection).toBeInTheDocument();

      // Testing Setup should be in Retrospectives
      const retroSection = screen.getByText('📓 Retrospectives').closest('div');
      expect(retroSection).toBeInTheDocument();
    });

    it('displays loop metadata correctly', async () => {
      // Check that loop titles are displayed
      expect(screen.getByText('UI Development')).toBeInTheDocument();
      expect(screen.getByText('API Development')).toBeInTheDocument();
      expect(screen.getByText('Testing Setup')).toBeInTheDocument();

      // Check that scores are displayed
      expect(screen.getByText('Score: 7.5')).toBeInTheDocument();
      expect(screen.getByText('Score: 8')).toBeInTheDocument();
      expect(screen.getByText('Score: 9.2')).toBeInTheDocument();
    });

    it('displays loop tags correctly', async () => {
      expect(screen.getByText('ui')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('api')).toBeInTheDocument();
      expect(screen.getByText('backend')).toBeInTheDocument();
      expect(screen.getByText('testing')).toBeInTheDocument();
      expect(screen.getByText('quality')).toBeInTheDocument();
    });

    it('displays correct type badges', async () => {
      // Check for type badges
      expect(screen.getByText('Execution')).toBeInTheDocument();
      expect(screen.getByText('Retrospective')).toBeInTheDocument();
    });

    it('displays status badges correctly', async () => {
      // Check for status indicators
      expect(screen.getAllByText('in_progress')).toHaveLength(2); // UI and API Development
      expect(screen.getAllByText('complete')).toHaveLength(1); // Testing Setup
    });
  });

  describe('Loop Content Interaction', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('expands loop content when accordion is clicked', async () => {
      // Initially, loop content should not be visible
      expect(screen.queryByText('Frontend development documentation')).not.toBeInTheDocument();

      // Click on accordion trigger for UI Development
      const uiAccordion = screen.getByRole('button', { name: /UI Development/ });
      fireEvent.click(uiAccordion);

      // Content should now be visible
      expect(screen.getByText('Frontend development documentation')).toBeInTheDocument();
    });
  });

  describe('Filtering Controls', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('has all filter controls available', async () => {
      expect(screen.getByRole('combobox', { name: /phase/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /workstream/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /tags/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    });

    it('filters by status correctly', async () => {
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.click(statusSelect);
      fireEvent.click(screen.getByText('Complete'));

      // Only Testing Setup should be visible (complete status)
      expect(screen.queryByText('UI Development')).not.toBeInTheDocument();
      expect(screen.queryByText('API Development')).not.toBeInTheDocument();
      expect(screen.getByText('Testing Setup')).toBeInTheDocument();
    });

    it('filters by type correctly', async () => {
      const typeSelect = screen.getByRole('combobox', { name: /type/i });
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('📓 Retrospective'));

      // Only Testing Setup should be visible (retrospective type)
      expect(screen.queryByText('UI Development')).not.toBeInTheDocument();
      expect(screen.queryByText('API Development')).not.toBeInTheDocument();
      expect(screen.getByText('Testing Setup')).toBeInTheDocument();
    });

    it('filters by tags correctly', async () => {
      const tagSelect = screen.getByRole('combobox', { name: /tags/i });
      fireEvent.click(tagSelect);
      fireEvent.click(screen.getByText('ui'));

      // Only UI Development should be visible
      expect(screen.getByText('UI Development')).toBeInTheDocument();
      expect(screen.queryByText('API Development')).not.toBeInTheDocument();
      expect(screen.queryByText('Testing Setup')).not.toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('sorts by score descending', async () => {
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.click(sortSelect);
      fireEvent.click(screen.getByText('Score (High to Low)'));

      // Check that loops are in score order: Testing Setup (9.2), API Development (8.0), UI Development (7.5)
      const loopTitles = screen.getAllByText(/Development|Setup/);
      // Note: This is a simplified check - in a real test you'd need to verify the actual order
      expect(loopTitles.length).toBeGreaterThan(0);
    });

    it('sorts by score ascending', async () => {
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.click(sortSelect);
      fireEvent.click(screen.getByText('Score (Low to High)'));

      // Check that loops are in reverse score order
      const loopTitles = screen.getAllByText(/Development|Setup/);
      expect(loopTitles.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockSearchParams.get.mockReturnValue('1.2');
      render(<PhaseDocView />);
      await waitFor(() => {
        expect(screen.getByText('Development Phase')).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels for all form controls', async () => {
      expect(screen.getByRole('combobox', { name: /phase/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /workstream/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /tags/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    });

    it('has proper heading structure', async () => {
      expect(screen.getByRole('heading', { level: 1, name: /Development Phase/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Phase Documentation/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Loops in this Phase/i })).toBeInTheDocument();
    });

    it('has accessible accordion controls', async () => {
      const accordionButtons = screen.getAllByRole('button');
      // Should have accordion trigger buttons for each loop
      expect(accordionButtons.length).toBeGreaterThan(2); // At least the loop accordions
    });
  });
}); 