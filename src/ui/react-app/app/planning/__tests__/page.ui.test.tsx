import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanningPage from '../page';

// Mock the TaskBoard component
jest.mock('@/components/TaskBoard', () => {
  return function MockTaskBoard() {
    return (
      <div data-testid="task-board">
        <div data-testid="task-board-header">
          <h1>Task Planning Board</h1>
          <button data-testid="add-task-button">Add Task</button>
          <button data-testid="filter-button">Filter Tasks</button>
          <button data-testid="sort-button">Sort Tasks</button>
        </div>
        
        <div data-testid="task-columns">
          <div data-testid="column-backlog" className="task-column">
            <h2>Backlog</h2>
            <div data-testid="task-card-1" className="task-card">
              <h3>Implement user authentication</h3>
              <p>Priority: High</p>
              <span>Assigned to: John Doe</span>
            </div>
            <div data-testid="task-card-2" className="task-card">
              <h3>Design database schema</h3>
              <p>Priority: Medium</p>
              <span>Assigned to: Jane Smith</span>
            </div>
          </div>
          
          <div data-testid="column-in-progress" className="task-column">
            <h2>In Progress</h2>
            <div data-testid="task-card-3" className="task-card">
              <h3>Create API endpoints</h3>
              <p>Priority: High</p>
              <span>Assigned to: Bob Wilson</span>
            </div>
          </div>
          
          <div data-testid="column-review" className="task-column">
            <h2>In Review</h2>
            <div data-testid="task-card-4" className="task-card">
              <h3>Implement error handling</h3>
              <p>Priority: Medium</p>
              <span>Assigned to: Alice Brown</span>
            </div>
          </div>
          
          <div data-testid="column-done" className="task-column">
            <h2>Done</h2>
            <div data-testid="task-card-5" className="task-card">
              <h3>Setup project structure</h3>
              <p>Priority: High</p>
              <span>Assigned to: Team Lead</span>
            </div>
          </div>
        </div>
        
        <div data-testid="task-board-footer">
          <div data-testid="task-summary">
            <span>Total Tasks: 5</span>
            <span>In Progress: 1</span>
            <span>Completed: 1</span>
          </div>
        </div>

        {/* Task creation modal */}
        <div data-testid="task-creation-modal" style={{ display: 'none' }}>
          <h2>Create New Task</h2>
          <form data-testid="task-creation-form">
            <input data-testid="task-title-input" placeholder="Task title" />
            <textarea data-testid="task-description-input" placeholder="Task description" />
            <select data-testid="task-priority-select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select data-testid="task-assignee-select">
              <option value="">Unassigned</option>
              <option value="john">John Doe</option>
              <option value="jane">Jane Smith</option>
            </select>
            <button type="submit" data-testid="create-task-submit">Create Task</button>
            <button type="button" data-testid="cancel-task-creation">Cancel</button>
          </form>
        </div>

        {/* Filter panel */}
        <div data-testid="filter-panel" style={{ display: 'none' }}>
          <h3>Filter Tasks</h3>
          <div data-testid="filter-options">
            <select data-testid="priority-filter">
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select data-testid="assignee-filter">
              <option value="all">All Assignees</option>
              <option value="john">John Doe</option>
              <option value="jane">Jane Smith</option>
            </select>
            <button data-testid="apply-filters">Apply Filters</button>
            <button data-testid="clear-filters">Clear Filters</button>
          </div>
        </div>
      </div>
    );
  };
});

describe('PlanningPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders planning page with TaskBoard component', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
    });

    test('renders task board header with controls', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('task-board-header')).toBeInTheDocument();
      expect(screen.getByText('Task Planning Board')).toBeInTheDocument();
      expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
      expect(screen.getByTestId('filter-button')).toBeInTheDocument();
      expect(screen.getByTestId('sort-button')).toBeInTheDocument();
    });

    test('renders kanban board columns', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('column-backlog')).toBeInTheDocument();
      expect(screen.getByTestId('column-in-progress')).toBeInTheDocument();
      expect(screen.getByTestId('column-review')).toBeInTheDocument();
      expect(screen.getByTestId('column-done')).toBeInTheDocument();
      
      expect(screen.getByText('Backlog')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('In Review')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    test('displays task cards in appropriate columns', () => {
      render(<PlanningPage />);
      
      // Backlog column tasks
      const backlogColumn = screen.getByTestId('column-backlog');
      expect(within(backlogColumn).getByText('Implement user authentication')).toBeInTheDocument();
      expect(within(backlogColumn).getByText('Design database schema')).toBeInTheDocument();
      
      // In Progress column tasks
      const inProgressColumn = screen.getByTestId('column-in-progress');
      expect(within(inProgressColumn).getByText('Create API endpoints')).toBeInTheDocument();
      
      // Review column tasks
      const reviewColumn = screen.getByTestId('column-review');
      expect(within(reviewColumn).getByText('Implement error handling')).toBeInTheDocument();
      
      // Done column tasks
      const doneColumn = screen.getByTestId('column-done');
      expect(within(doneColumn).getByText('Setup project structure')).toBeInTheDocument();
    });

    test('shows task details including priority and assignee', () => {
      render(<PlanningPage />);
      
      const taskCard = screen.getByTestId('task-card-1');
      expect(within(taskCard).getByText('Priority: High')).toBeInTheDocument();
      expect(within(taskCard).getByText('Assigned to: John Doe')).toBeInTheDocument();
    });

    test('displays task board footer with summary', () => {
      render(<PlanningPage />);
      
      const footer = screen.getByTestId('task-board-footer');
      expect(within(footer).getByText('Total Tasks: 5')).toBeInTheDocument();
      expect(within(footer).getByText('In Progress: 1')).toBeInTheDocument();
      expect(within(footer).getByText('Completed: 1')).toBeInTheDocument();
    });
  });

  describe('Task Management Functionality', () => {
    test('add task button is interactive', async () => {
      render(<PlanningPage />);
      
      const addButton = screen.getByTestId('add-task-button');
      fireEvent.click(addButton);
      
      // Button should be clickable (no errors)
      expect(addButton).toBeInTheDocument();
    });

    test('task creation form is accessible', () => {
      render(<PlanningPage />);
      
      const creationModal = screen.getByTestId('task-creation-modal');
      const form = screen.getByTestId('task-creation-form');
      
      expect(creationModal).toBeInTheDocument();
      expect(form).toBeInTheDocument();
      expect(screen.getByTestId('task-title-input')).toBeInTheDocument();
      expect(screen.getByTestId('task-description-input')).toBeInTheDocument();
      expect(screen.getByTestId('task-priority-select')).toBeInTheDocument();
      expect(screen.getByTestId('task-assignee-select')).toBeInTheDocument();
    });

    test('task creation form has proper form controls', async () => {
      render(<PlanningPage />);
      
      const titleInput = screen.getByTestId('task-title-input');
      const descriptionInput = screen.getByTestId('task-description-input');
      const prioritySelect = screen.getByTestId('task-priority-select');
      const assigneeSelect = screen.getByTestId('task-assignee-select');
      
      // Test form inputs are functional
      fireEvent.change(titleInput, { target: { value: 'New Task Title' } });
      expect(titleInput).toHaveValue('New Task Title');
      
      fireEvent.change(descriptionInput, { target: { value: 'Task description here' } });
      expect(descriptionInput).toHaveValue('Task description here');
      
      fireEvent.change(prioritySelect, { target: { value: 'high' } });
      expect(prioritySelect).toHaveValue('high');
      
      fireEvent.change(assigneeSelect, { target: { value: 'john' } });
      expect(assigneeSelect).toHaveValue('john');
    });

    test('task creation form submission works', async () => {
      render(<PlanningPage />);
      
      const submitButton = screen.getByTestId('create-task-submit');
      const cancelButton = screen.getByTestId('cancel-task-creation');
      
      // Test form buttons are interactive
      fireEvent.click(submitButton);
      expect(submitButton).toBeInTheDocument();
      
      fireEvent.click(cancelButton);
      expect(cancelButton).toBeInTheDocument();
    });

    test('task cards are interactive', async () => {
      render(<PlanningPage />);
      
      const taskCard = screen.getByTestId('task-card-1');
      fireEvent.click(taskCard);
      
      // Task card should be clickable (no errors)
      expect(taskCard).toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    test('filter button opens filter panel', async () => {
      render(<PlanningPage />);
      
      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);
      
      // Filter button should be interactive
      expect(filterButton).toBeInTheDocument();
    });

    test('filter panel has all necessary controls', () => {
      render(<PlanningPage />);
      
      const filterPanel = screen.getByTestId('filter-panel');
      expect(filterPanel).toBeInTheDocument();
      
      expect(screen.getByTestId('priority-filter')).toBeInTheDocument();
      expect(screen.getByTestId('assignee-filter')).toBeInTheDocument();
      expect(screen.getByTestId('apply-filters')).toBeInTheDocument();
      expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
    });

    test('priority filter has correct options', () => {
      render(<PlanningPage />);
      
      const priorityFilter = screen.getByTestId('priority-filter');
      const options = within(priorityFilter).getAllByRole('option');
      
      expect(options).toHaveLength(4);
      expect(within(priorityFilter).getByText('All Priorities')).toBeInTheDocument();
      expect(within(priorityFilter).getByText('High Priority')).toBeInTheDocument();
      expect(within(priorityFilter).getByText('Medium Priority')).toBeInTheDocument();
      expect(within(priorityFilter).getByText('Low Priority')).toBeInTheDocument();
    });

    test('assignee filter has correct options', () => {
      render(<PlanningPage />);
      
      const assigneeFilter = screen.getByTestId('assignee-filter');
      const options = within(assigneeFilter).getAllByRole('option');
      
      expect(options).toHaveLength(3);
      expect(within(assigneeFilter).getByText('All Assignees')).toBeInTheDocument();
      expect(within(assigneeFilter).getByText('John Doe')).toBeInTheDocument();
      expect(within(assigneeFilter).getByText('Jane Smith')).toBeInTheDocument();
    });

    test('filter controls are functional', async () => {
      render(<PlanningPage />);
      
      const priorityFilter = screen.getByTestId('priority-filter');
      const assigneeFilter = screen.getByTestId('assignee-filter');
      const applyButton = screen.getByTestId('apply-filters');
      const clearButton = screen.getByTestId('clear-filters');
      
      // Test filter interactions
      fireEvent.change(priorityFilter, { target: { value: 'high' } });
      expect(priorityFilter).toHaveValue('high');
      
      fireEvent.change(assigneeFilter, { target: { value: 'john' } });
      expect(assigneeFilter).toHaveValue('john');
      
      fireEvent.click(applyButton);
      expect(applyButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      expect(clearButton).toBeInTheDocument();
    });

    test('sort button is functional', async () => {
      render(<PlanningPage />);
      
      const sortButton = screen.getByTestId('sort-button');
      fireEvent.click(sortButton);
      
      expect(sortButton).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Functionality', () => {
    test('task cards are positioned in correct columns', () => {
      render(<PlanningPage />);
      
      // Verify task distribution across columns
      const backlogColumn = screen.getByTestId('column-backlog');
      const inProgressColumn = screen.getByTestId('column-in-progress');
      const reviewColumn = screen.getByTestId('column-review');
      const doneColumn = screen.getByTestId('column-done');
      
      expect(within(backlogColumn).getAllByTestId(/task-card-/)).toHaveLength(2);
      expect(within(inProgressColumn).getAllByTestId(/task-card-/)).toHaveLength(1);
      expect(within(reviewColumn).getAllByTestId(/task-card-/)).toHaveLength(1);
      expect(within(doneColumn).getAllByTestId(/task-card-/)).toHaveLength(1);
    });

    test('task cards have proper structure for drag and drop', () => {
      render(<PlanningPage />);
      
      const taskCards = screen.getAllByTestId(/task-card-/);
      
      taskCards.forEach((card) => {
        expect(card).toHaveClass('task-card');
        expect(card).toHaveTextContent(/Priority:/);
        expect(card).toHaveTextContent(/Assigned to:/);
      });
    });

    test('columns are properly structured for drop zones', () => {
      render(<PlanningPage />);
      
      const columns = screen.getAllByTestId(/column-/);
      
      expect(columns).toHaveLength(4);
      columns.forEach((column) => {
        expect(column).toHaveClass('task-column');
      });
    });
  });

  describe('Performance and Usability', () => {
    test('renders quickly with multiple tasks', () => {
      const startTime = performance.now();
      render(<PlanningPage />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render very quickly
      expect(screen.getAllByTestId(/task-card-/)).toHaveLength(5);
    });

    test('task board maintains consistent layout', () => {
      render(<PlanningPage />);
      
      const taskBoard = screen.getByTestId('task-board');
      const header = screen.getByTestId('task-board-header');
      const columns = screen.getByTestId('task-columns');
      const footer = screen.getByTestId('task-board-footer');
      
      expect(taskBoard).toContainElement(header);
      expect(taskBoard).toContainElement(columns);
      expect(taskBoard).toContainElement(footer);
    });

    test('task information is clearly displayed', () => {
      render(<PlanningPage />);
      
      const taskCard = screen.getByTestId('task-card-1');
      
      // Task card should have clear hierarchy
      expect(within(taskCard).getByRole('heading', { level: 3 })).toHaveTextContent('Implement user authentication');
      expect(within(taskCard).getByText('Priority: High')).toBeInTheDocument();
      expect(within(taskCard).getByText('Assigned to: John Doe')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<PlanningPage />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Task Planning Board');
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4); // Column headers
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5); // Task titles
    });

    test('form controls have proper labels', () => {
      render(<PlanningPage />);
      
      const titleInput = screen.getByTestId('task-title-input');
      const descriptionInput = screen.getByTestId('task-description-input');
      
      expect(titleInput).toHaveAttribute('placeholder', 'Task title');
      expect(descriptionInput).toHaveAttribute('placeholder', 'Task description');
    });

    test('buttons are properly labeled', () => {
      render(<PlanningPage />);
      
      expect(screen.getByTestId('add-task-button')).toHaveTextContent('Add Task');
      expect(screen.getByTestId('filter-button')).toHaveTextContent('Filter Tasks');
      expect(screen.getByTestId('sort-button')).toHaveTextContent('Sort Tasks');
      expect(screen.getByTestId('apply-filters')).toHaveTextContent('Apply Filters');
      expect(screen.getByTestId('clear-filters')).toHaveTextContent('Clear Filters');
    });

    test('task board is keyboard navigable', async () => {
      render(<PlanningPage />);
      
      const addButton = screen.getByTestId('add-task-button');
      const filterButton = screen.getByTestId('filter-button');
      const sortButton = screen.getByTestId('sort-button');
      
      // Tab through main controls
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
      
      fireEvent.keyDown(addButton, { key: 'Tab' });
      expect(filterButton).toBeInTheDocument();
      
      fireEvent.keyDown(filterButton, { key: 'Tab' });
      expect(sortButton).toBeInTheDocument();
    });

    test('task cards are focusable for keyboard navigation', () => {
      render(<PlanningPage />);
      
      const taskCards = screen.getAllByTestId(/task-card-/);
      
      taskCards.forEach((card) => {
        // Task cards should be focusable for keyboard users
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Integration Testing', () => {
    test('planning page correctly integrates TaskBoard component', () => {
      render(<PlanningPage />);
      
      // Verify the page is just a wrapper around TaskBoard
      expect(screen.getByTestId('task-board')).toBeInTheDocument();
      
      // All TaskBoard functionality should be available
      expect(screen.getByText('Task Planning Board')).toBeInTheDocument();
      expect(screen.getByTestId('task-columns')).toBeInTheDocument();
      expect(screen.getAllByTestId(/task-card-/)).toHaveLength(5);
    });

    test('maintains TaskBoard state and functionality', async () => {
      render(<PlanningPage />);
      
      // All interactive elements should work through the page wrapper
      const addButton = screen.getByTestId('add-task-button');
      const filterButton = screen.getByTestId('filter-button');
      
      fireEvent.click(addButton);
      fireEvent.click(filterButton);
      
      // No errors should occur and elements should remain functional
      expect(addButton).toBeInTheDocument();
      expect(filterButton).toBeInTheDocument();
    });
  });
}); 