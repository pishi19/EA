import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskMutationControls, TaskCard } from '../task-mutation-controls';

// Mock dependencies
global.fetch = jest.fn();

describe('TaskMutationControls', () => {
    const mockOnAddTask = jest.fn();
    const mockOnEditTask = jest.fn();
    const mockOnDeleteTask = jest.fn();

    const defaultProps = {
        variant: 'inline' as const,
        onAddTask: mockOnAddTask,
        onEditTask: mockOnEditTask,
        onDeleteTask: mockOnDeleteTask,
        loading: false
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true })
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('TaskMutationControls - Inline Variant', () => {
        it('should render inline controls with all buttons', () => {
            render(<TaskMutationControls {...defaultProps} />);

            expect(screen.getByLabelText('Add new task')).toBeInTheDocument();
            expect(screen.getByText('Add Task')).toBeInTheDocument();
        });

        it('should handle add task button click', async () => {
            const user = userEvent.setup();
            render(<TaskMutationControls {...defaultProps} />);

            const addButton = screen.getByLabelText('Add new task');
            await user.click(addButton);

            expect(mockOnAddTask).toHaveBeenCalled();
        });

        it('should show loading state', () => {
            render(<TaskMutationControls {...defaultProps} loading={true} />);

            const addButton = screen.getByLabelText('Add new task');
            expect(addButton).toBeDisabled();
        });

        it('should handle keyboard shortcut Ctrl+N', async () => {
            const user = userEvent.setup();
            render(<TaskMutationControls {...defaultProps} />);

            await user.keyboard('{Control>}n{/Control}');

            expect(mockOnAddTask).toHaveBeenCalled();
        });
    });

    describe('TaskMutationControls - Overlay Variant', () => {
        it('should render overlay controls with floating action button', () => {
            render(<TaskMutationControls {...defaultProps} variant="overlay" />);

            expect(screen.getByLabelText('Quick actions')).toBeInTheDocument();
        });

        it('should show tooltip on hover', async () => {
            const user = userEvent.setup();
            render(<TaskMutationControls {...defaultProps} variant="overlay" />);

            const actionButton = screen.getByLabelText('Quick actions');
            await user.hover(actionButton);

            await waitFor(() => {
                expect(screen.getByText('Task Actions')).toBeInTheDocument();
            });
        });
    });

    describe('TaskMutationControls - Sidebar Variant', () => {
        it('should render sidebar controls with vertical layout', () => {
            render(<TaskMutationControls {...defaultProps} variant="sidebar" />);

            expect(screen.getByText('Task Actions')).toBeInTheDocument();
            expect(screen.getByText('Add')).toBeInTheDocument();
        });

        it('should handle add button in sidebar', async () => {
            const user = userEvent.setup();
            render(<TaskMutationControls {...defaultProps} variant="sidebar" />);

            const addButton = screen.getByText('Add');
            await user.click(addButton);

            expect(mockOnAddTask).toHaveBeenCalled();
        });
    });

    describe('Global keyboard shortcuts', () => {
        it('should handle global Ctrl+E shortcut for edit', async () => {
            const user = userEvent.setup();
            
            // Mock that there's a selected task in the global state
            const originalGetElementById = document.getElementById;
            document.getElementById = jest.fn().mockReturnValue({
                dataset: { taskId: 'test-task-id' }
            });

            render(<TaskMutationControls {...defaultProps} />);

            await user.keyboard('{Control>}e{/Control}');

            expect(mockOnEditTask).toHaveBeenCalled();

            // Restore
            document.getElementById = originalGetElementById;
        });

        it('should handle global Delete key for delete', async () => {
            const user = userEvent.setup();
            
            // Mock selected task
            const originalGetElementById = document.getElementById;
            document.getElementById = jest.fn().mockReturnValue({
                dataset: { taskId: 'test-task-id' }
            });

            render(<TaskMutationControls {...defaultProps} />);

            await user.keyboard('{Delete}');

            expect(mockOnDeleteTask).toHaveBeenCalled();

            // Restore
            document.getElementById = originalGetElementById;
        });

        it('should not trigger shortcuts when input is focused', async () => {
            const user = userEvent.setup();
            render(
                <div>
                    <input data-testid="test-input" />
                    <TaskMutationControls {...defaultProps} />
                </div>
            );

            const input = screen.getByTestId('test-input');
            await user.click(input);

            await user.keyboard('{Control>}n{/Control}');

            expect(mockOnAddTask).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should handle disabled state', () => {
            render(<TaskMutationControls {...defaultProps} disabled={true} />);

            const addButton = screen.getByLabelText('Add new task');
            expect(addButton).toBeDisabled();
        });

        it('should handle missing callbacks gracefully', () => {
            const propsWithoutCallbacks = {
                variant: 'inline' as const,
                loading: false
            };

            expect(() => {
                render(<TaskMutationControls {...propsWithoutCallbacks} />);
            }).not.toThrow();
        });
    });
});

describe('TaskCard', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    const defaultTask = {
        id: 'test-task-id',
        title: 'Test Task',
        description: 'Test task description',
        status: 'in_progress' as const,
        phase: '11.2.3',
        workstream: 'testing',
        tags: ['test', 'task'],
        uuid: 'test-uuid'
    };

    const defaultProps = {
        task: defaultTask,
        onEdit: mockOnEdit,
        onDelete: mockOnDelete,
        showControls: true
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render task card with basic information', () => {
        render(<TaskCard {...defaultProps} />);

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Test task description')).toBeInTheDocument();
        expect(screen.getByText('in_progress')).toBeInTheDocument();
        expect(screen.getByText('Phase 11.2.3')).toBeInTheDocument();
        expect(screen.getByText('testing')).toBeInTheDocument();
    });

    it('should render tags', () => {
        render(<TaskCard {...defaultProps} />);

        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByText('task')).toBeInTheDocument();
    });

    it('should show action buttons when showControls is true', () => {
        render(<TaskCard {...defaultProps} />);

        expect(screen.getByLabelText('Edit task')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete task')).toBeInTheDocument();
    });

    it('should hide action buttons when showControls is false', () => {
        render(<TaskCard {...defaultProps} showControls={false} />);

        expect(screen.queryByLabelText('Edit task')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Delete task')).not.toBeInTheDocument();
    });

    it('should handle edit button click', async () => {
        const user = userEvent.setup();
        render(<TaskCard {...defaultProps} />);

        const editButton = screen.getByLabelText('Edit task');
        await user.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledWith(defaultTask);
    });

    it('should handle delete button click', async () => {
        const user = userEvent.setup();
        render(<TaskCard {...defaultProps} />);

        const deleteButton = screen.getByLabelText('Delete task');
        await user.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith(defaultTask);
    });

    it('should apply custom className', () => {
        const { container } = render(
            <TaskCard {...defaultProps} className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should handle task without description', () => {
        const taskWithoutDescription = {
            ...defaultTask,
            description: undefined
        };

        render(<TaskCard {...defaultProps} task={taskWithoutDescription} />);

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.queryByText('Test task description')).not.toBeInTheDocument();
    });

    it('should handle task without tags', () => {
        const taskWithoutTags = {
            ...defaultTask,
            tags: []
        };

        render(<TaskCard {...defaultProps} task={taskWithoutTags} />);

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should display status with correct styling', () => {
        const completedTask = {
            ...defaultTask,
            status: 'complete' as const
        };

        render(<TaskCard {...defaultProps} task={completedTask} />);

        const statusBadge = screen.getByText('complete');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should display blocked status with warning styling', () => {
        const blockedTask = {
            ...defaultTask,
            status: 'blocked' as const
        };

        render(<TaskCard {...defaultProps} task={blockedTask} />);

        const statusBadge = screen.getByText('blocked');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should display planning status with default styling', () => {
        const planningTask = {
            ...defaultTask,
            status: 'planning' as const
        };

        render(<TaskCard {...defaultProps} task={planningTask} />);

        const statusBadge = screen.getByText('planning');
        expect(statusBadge).toBeInTheDocument();
        expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should handle long task titles gracefully', () => {
        const taskWithLongTitle = {
            ...defaultTask,
            title: 'This is a very long task title that should be handled gracefully by the component without breaking the layout'
        };

        render(<TaskCard {...defaultProps} task={taskWithLongTitle} />);

        expect(screen.getByText(/This is a very long task title/)).toBeInTheDocument();
    });

    it('should handle special characters in task data', () => {
        const taskWithSpecialChars = {
            ...defaultTask,
            title: 'Task with "quotes" & <symbols>',
            description: 'Description with special chars: @#$%^&*()',
            workstream: 'workstream-with-dashes',
            tags: ['tag-with-dash', 'tag_with_underscore']
        };

        render(<TaskCard {...defaultProps} task={taskWithSpecialChars} />);

        expect(screen.getByText('Task with "quotes" & <symbols>')).toBeInTheDocument();
        expect(screen.getByText('Description with special chars: @#$%^&*()')).toBeInTheDocument();
        expect(screen.getByText('workstream-with-dashes')).toBeInTheDocument();
        expect(screen.getByText('tag-with-dash')).toBeInTheDocument();
        expect(screen.getByText('tag_with_underscore')).toBeInTheDocument();
    });

    it('should be accessible with proper ARIA labels', () => {
        render(<TaskCard {...defaultProps} />);

        expect(screen.getByRole('article')).toBeInTheDocument();
        expect(screen.getByLabelText('Edit task')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete task')).toBeInTheDocument();
    });

    it('should support keyboard navigation for action buttons', async () => {
        const user = userEvent.setup();
        render(<TaskCard {...defaultProps} />);

        const editButton = screen.getByLabelText('Edit task');
        editButton.focus();
        
        expect(document.activeElement).toBe(editButton);

        await user.keyboard('{Tab}');
        
        const deleteButton = screen.getByLabelText('Delete task');
        expect(document.activeElement).toBe(deleteButton);
    });
}); 