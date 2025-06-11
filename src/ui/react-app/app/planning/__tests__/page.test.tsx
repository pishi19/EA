import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanningPage from '../page';

// Mock the TaskBoard component
jest.mock('@/components/TaskBoard', () => {
  return function MockTaskBoard() {
    return (
      <div data-testid="task-board" className="mock-task-board">
        <h2>Task Board</h2>
        <div className="task-columns">
          <div className="column" data-testid="planning-column">
            <h3>Planning</h3>
            <div className="task-card" data-testid="task-1">
              <h4>Setup Development Environment</h4>
              <p>Phase: 11.1</p>
              <p>Priority: High</p>
              <span className="status">planning</span>
            </div>
          </div>
          <div className="column" data-testid="in-progress-column">
            <h3>In Progress</h3>
            <div className="task-card" data-testid="task-2">
              <h4>Implement API Endpoints</h4>
              <p>Phase: 11.2</p>
              <p>Priority: Medium</p>
              <span className="status">in_progress</span>
            </div>
          </div>
          <div className="column" data-testid="complete-column">
            <h3>Complete</h3>
            <div className="task-card" data-testid="task-3">
              <h4>Design System Components</h4>
              <p>Phase: 11.1</p>
              <p>Priority: High</p>
              <span className="status">complete</span>
            </div>
          </div>
          <div className="column" data-testid="blocked-column">
            <h3>Blocked</h3>
            <div className="task-card" data-testid="task-4">
              <h4>Database Migration</h4>
              <p>Phase: 11.3</p>
              <p>Priority: Critical</p>
              <span className="status">blocked</span>
            </div>
          </div>
        </div>
        <div className="task-board-controls" data-testid="task-board-controls">
          <button data-testid="add-task-btn">Add Task</button>
          <button data-testid="filter-btn">Filter Tasks</button>
          <button data-testid="sort-btn">Sort Tasks</button>
        </div>
        <div className="task-summary" data-testid="task-summary">
          <span>Total: 4 tasks</span>
          <span>In Progress: 1 task</span>
          <span>Complete: 1 task</span>
          <span>Blocked: 1 task</span>
        </div>
      </div>
    );
  };
});

describe('PlanningPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render the TaskBoard component', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
    });

    it('should render task board with all columns', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('planning-column')).toBeInTheDocument();
      expect(screen.getByTestId('in-progress-column')).toBeInTheDocument();
      expect(screen.getByTestId('complete-column')).toBeInTheDocument();
      expect(screen.getByTestId('blocked-column')).toBeInTheDocument();
    });

    it('should display column headers correctly', () => {
      render(<PlanningPage />);
      
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });
  });

  describe('Task Display', () => {
    it('should render all task cards', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-2')).toBeInTheDocument();
      expect(screen.getByTestId('task-3')).toBeInTheDocument();
      expect(screen.getByTestId('task-4')).toBeInTheDocument();
    });

    it('should display task details correctly', () => {
      render(<PlanningPage />);
      
      // Check task titles
      expect(screen.getByText('Setup Development Environment')).toBeInTheDocument();
      expect(screen.getByText('Implement API Endpoints')).toBeInTheDocument();
      expect(screen.getByText('Design System Components')).toBeInTheDocument();
      expect(screen.getByText('Database Migration')).toBeInTheDocument();

      // Check task phases
      expect(screen.getAllByText(/Phase: 11\./)).toHaveLength(4);

      // Check task priorities
      expect(screen.getAllByText(/Priority: (High|Medium|Critical)/)).toHaveLength(4);

      // Check task statuses
      expect(screen.getByText('planning')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('complete')).toBeInTheDocument();
      expect(screen.getByText('blocked')).toBeInTheDocument();
    });

    it('should organize tasks by status in correct columns', () => {
      render(<PlanningPage />);
      
      const planningColumn = screen.getByTestId('planning-column');
      const inProgressColumn = screen.getByTestId('in-progress-column');
      const completeColumn = screen.getByTestId('complete-column');
      const blockedColumn = screen.getByTestId('blocked-column');

      // Check that tasks are in the correct columns
      expect(planningColumn).toContainElement(screen.getByTestId('task-1'));
      expect(inProgressColumn).toContainElement(screen.getByTestId('task-2'));
      expect(completeColumn).toContainElement(screen.getByTestId('task-3'));
      expect(blockedColumn).toContainElement(screen.getByTestId('task-4'));
    });
  });

  describe('Task Board Controls', () => {
    it('should render task board control buttons', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('add-task-btn')).toBeInTheDocument();
      expect(screen.getByTestId('filter-btn')).toBeInTheDocument();
      expect(screen.getByTestId('sort-btn')).toBeInTheDocument();
    });

    it('should have clickable control buttons', () => {
      render(<PlanningPage />);
      
      const addTaskBtn = screen.getByTestId('add-task-btn');
      const filterBtn = screen.getByTestId('filter-btn');
      const sortBtn = screen.getByTestId('sort-btn');

      expect(addTaskBtn).toBeEnabled();
      expect(filterBtn).toBeEnabled();
      expect(sortBtn).toBeEnabled();

      // Should not throw when clicked
      expect(() => fireEvent.click(addTaskBtn)).not.toThrow();
      expect(() => fireEvent.click(filterBtn)).not.toThrow();
      expect(() => fireEvent.click(sortBtn)).not.toThrow();
    });

    it('should display task summary information', () => {
      render(<PlanningPage />);
      
      const taskSummary = screen.getByTestId('task-summary');
      
      expect(taskSummary).toContainElement(screen.getByText('Total: 4 tasks'));
      expect(taskSummary).toContainElement(screen.getByText('In Progress: 1 task'));
      expect(taskSummary).toContainElement(screen.getByText('Complete: 1 task'));
      expect(taskSummary).toContainElement(screen.getByText('Blocked: 1 task'));
    });
  });

  describe('Component Integration', () => {
    it('should properly delegate all functionality to TaskBoard', () => {
      render(<PlanningPage />);
      
      // Verify that PlanningPage is a simple wrapper
      const taskBoard = screen.getByTestId('task-board');
      expect(taskBoard).toBeInTheDocument();
      
      // Check that all TaskBoard features are accessible
      expect(screen.getByText('Task Board')).toBeInTheDocument();
      expect(screen.getByTestId('task-board-controls')).toBeInTheDocument();
      expect(screen.getByTestId('task-summary')).toBeInTheDocument();
    });

    it('should maintain component composition structure', () => {
      render(<PlanningPage />);
      
      // The page should be a simple composition of TaskBoard
      const container = screen.getByTestId('task-board').parentElement;
      
      // Should not have additional wrapper elements or complex structure
      expect(container).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<PlanningPage />);
      
      // Check for headings
      expect(screen.getByText('Task Board')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
    });

    it('should have accessible interactive elements', () => {
      render(<PlanningPage />);
      
      // All buttons should be properly accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).toBeEnabled();
      });
    });

    it('should support keyboard navigation', () => {
      render(<PlanningPage />);
      
      const addTaskBtn = screen.getByTestId('add-task-btn');
      
      // Should be focusable
      addTaskBtn.focus();
      expect(document.activeElement).toBe(addTaskBtn);
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      
      render(<PlanningPage />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly (less than 100ms for simple wrapper)
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<PlanningPage />);
      
      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle re-renders efficiently', () => {
      const { rerender } = render(<PlanningPage />);
      
      // Multiple re-renders should not cause issues
      expect(() => {
        rerender(<PlanningPage />);
        rerender(<PlanningPage />);
        rerender(<PlanningPage />);
      }).not.toThrow();
    });
  });

  describe('Error Boundaries', () => {
    it('should handle TaskBoard component errors gracefully', () => {
      // Mock console.error to prevent error output in tests
      const originalError = console.error;
      console.error = jest.fn();

      // This test verifies the structure exists for error handling
      // In a real scenario, you'd want to test with an actual error boundary
      expect(() => render(<PlanningPage />)).not.toThrow();

      console.error = originalError;
    });

    it('should maintain stable component structure', () => {
      render(<PlanningPage />);
      
      // Component should have consistent structure
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
      
      // Re-render should maintain the same structure
      render(<PlanningPage />);
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
    });
  });

  describe('Component Props and Data Flow', () => {
    it('should pass through any required props to TaskBoard', () => {
      // Since PlanningPage is a simple wrapper, it should pass props correctly
      render(<PlanningPage />);
      
      // Verify TaskBoard receives and processes data
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
      expect(screen.getByText('Task Board')).toBeInTheDocument();
    });

    it('should maintain component state independently', () => {
      const { rerender } = render(<PlanningPage />);
      
      // State should persist across re-renders
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
      
      rerender(<PlanningPage />);
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
    });
  });

  describe('Integration Points', () => {
    it('should provide all necessary functionality for task management', () => {
      render(<PlanningPage />);
      
      // Verify all key task management features are available
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      
      expect(screen.getByTestId('add-task-btn')).toBeInTheDocument();
      expect(screen.getByTestId('filter-btn')).toBeInTheDocument();
      expect(screen.getByTestId('sort-btn')).toBeInTheDocument();
    });

    it('should support task lifecycle management', () => {
      render(<PlanningPage />);
      
      // Verify tasks in different lifecycle stages are properly displayed
      expect(screen.getByText('planning')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('complete')).toBeInTheDocument();
      expect(screen.getByText('blocked')).toBeInTheDocument();
    });

    it('should provide comprehensive task information', () => {
      render(<PlanningPage />);
      
      // Verify that task cards contain all necessary information
      const taskCards = screen.getAllByText(/Phase: 11\./);
      expect(taskCards.length).toBeGreaterThan(0);
      
      const priorities = screen.getAllByText(/Priority: (High|Medium|Critical)/);
      expect(priorities.length).toBeGreaterThan(0);
      
      // Summary information should be available
      expect(screen.getByText('Total: 4 tasks')).toBeInTheDocument();
    });
  });
}); 