import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../page';

// Mock the PhaseContextEditor component
jest.mock('@/components/PhaseContextEditor', () => {
  return function MockPhaseContextEditor({ onUpdate }: { onUpdate: (phase: string, context: any) => void }) {
    return (
      <div data-testid="phase-context-editor">
        <button 
          onClick={() => onUpdate('11', { test: 'context' })}
          data-testid="mock-update-context"
        >
          Update Context
        </button>
      </div>
    );
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

interface PhaseInfo {
  id: string;
  number: string;
  title: string;
  fullTitle: string;
  status?: string;
}

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPhases: PhaseInfo[] = [
    {
      id: 'phase-11',
      number: '11',
      title: 'Artefact Hierarchy, Filtering & Chat',
      fullTitle: 'Phase 11: Artefact Hierarchy, Filtering & Chat',
      status: 'active'
    },
    {
      id: 'phase-12',
      number: '12',
      title: 'Administration & Governance',
      fullTitle: 'Phase 12: Administration & Governance',
      status: 'active'
    },
    {
      id: 'phase-13',
      number: '13',
      title: 'Data Audit & Compliance',
      fullTitle: 'Phase 13: Data Audit & Compliance',
      status: 'planning'
    }
  ];

  describe('Page Structure and Layout', () => {
    it('should render the main title and description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      expect(screen.getByText('Ora System Administration')).toBeInTheDocument();
      expect(screen.getByText('Manage system configuration, user settings, and phase contexts')).toBeInTheDocument();
    });

    it('should render all admin overview cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Check for all 4 admin cards
      expect(screen.getByText('System Config')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Data Management')).toBeInTheDocument();
      expect(screen.getByText('Context Editor')).toBeInTheDocument();

      // Check card status indicators
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render phase context management section', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      expect(screen.getByText('Phase Context Management')).toBeInTheDocument();
      expect(screen.getByText(/Edit strategic context for each phase/)).toBeInTheDocument();
    });

    it('should render implementation status section', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      expect(screen.getByText('Task 12.5.1: Program Context Prompting - Implementation Status')).toBeInTheDocument();
      expect(screen.getByText('🎯 Validation Results')).toBeInTheDocument();
    });
  });

  describe('Phase Loading and Display', () => {
    it('should show loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AdminPage />);

      expect(screen.getByText('Loading phases...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should fetch and display phases on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Wait for phases to load
      await waitFor(() => {
        expect(screen.getByText('✅ Phase 11: Artefact Hierarchy, Filtering & Chat: Context Active')).toBeInTheDocument();
      });

      expect(screen.getByText('✅ Phase 12: Administration & Governance: Context Active')).toBeInTheDocument();
      expect(screen.getByText('✅ Phase 13: Data Audit & Compliance: Context Active')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AdminPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching phases:', expect.any(Error));
      });

      // Should not show phase badges when error occurs
      expect(screen.queryByText(/Phase 11:/)).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle empty phases response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Phase 11:/)).not.toBeInTheDocument();
      });

      // Should not show any phase badges
      expect(screen.queryByText('Context Active')).not.toBeInTheDocument();
    });

    it('should handle non-ok response from API', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      render(<AdminPage />);

      await waitFor(() => {
        // Should not crash and should hide loading state
        expect(screen.queryByText('Loading phases...')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Phase Context Editor Integration', () => {
    it('should render PhaseContextEditor component', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByTestId('phase-context-editor')).toBeInTheDocument();
      });
    });

    it('should handle context updates from PhaseContextEditor', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      await waitFor(() => {
        const updateButton = screen.getByTestId('mock-update-context');
        fireEvent.click(updateButton);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Phase 11 context updated:', { test: 'context' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Status and Implementation Features', () => {
    it('should show all implementation status items as complete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Check for completion badges
      const completeBadges = screen.getAllByText('✅ Complete');
      expect(completeBadges).toHaveLength(4);

      const validatedBadge = screen.getByText('✅ Validated');
      expect(validatedBadge).toBeInTheDocument();
    });

    it('should display validation results section', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Check validation bullet points
      expect(screen.getByText(/Phase context API returns structured data/)).toBeInTheDocument();
      expect(screen.getByText(/Chat responses now include strategic focus/)).toBeInTheDocument();
      expect(screen.getByText(/LLM reasoning is contextually aware/)).toBeInTheDocument();
      expect(screen.getByText(/Admin interface allows real-time context editing/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should have proper semantic structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ora System Administration');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Phase Context Management');
    });

    it('should have proper ARIA labels and roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Check for loading spinner with proper role
      await waitFor(() => {
        // After loading, check that main content is accessible
        expect(screen.getByRole('main') || screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should handle different screen sizes with grid layout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      render(<AdminPage />);

      // Check for responsive grid classes
      const gridContainer = screen.getByText('System Config').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-4');
    });
  });

  describe('Error Boundaries and Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'structure' })
      });

      render(<AdminPage />);

      // Should not crash and should handle gracefully
      await waitFor(() => {
        expect(screen.queryByText('Loading phases...')).not.toBeInTheDocument();
      });
    });

    it('should handle network timeouts', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(<AdminPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching phases:', expect.any(Error));
      }, { timeout: 2000 });

      consoleSpy.mockRestore();
    });

    it('should handle phases with missing properties', async () => {
      const incompletePhases = [
        { id: 'phase-1', number: '1' }, // Missing title and fullTitle
        { id: 'phase-2', number: '2', title: 'Test' } // Missing fullTitle
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => incompletePhases
      });

      render(<AdminPage />);

      // Should not crash and handle incomplete data
      await waitFor(() => {
        expect(screen.queryByText('Loading phases...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should only fetch phases once on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      const { rerender } = render(<AdminPage />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Re-render should not trigger additional fetch
      rerender(<AdminPage />);
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should cleanup effects on unmount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhases
      });

      const { unmount } = render(<AdminPage />);
      
      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
}); 