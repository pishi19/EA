import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineTaskEditor } from '../inline-task-editor';

// Mock dependencies
global.fetch = jest.fn();

describe('InlineTaskEditor', () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();

    const defaultProps = {
        mode: 'add' as const,
        onSave: mockOnSave,
        onCancel: mockOnCancel,
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

    it('should render in add mode with correct form fields', () => {
        render(<InlineTaskEditor {...defaultProps} />);

        expect(screen.getByText('Add New Task')).toBeInTheDocument();
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByLabelText('Phase')).toBeInTheDocument();
        expect(screen.getByLabelText('Workstream')).toBeInTheDocument();
        expect(screen.getByLabelText('Tags')).toBeInTheDocument();
        expect(screen.getByText('Save Task')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render in edit mode with pre-filled form fields', () => {
        const task = {
            id: 'test-id',
            title: 'Test Task',
            description: 'Test description',
            status: 'in_progress' as const,
            phase: '11.2.3',
            workstream: 'testing',
            tags: ['test', 'task'],
            uuid: 'test-uuid'
        };

        render(<InlineTaskEditor {...defaultProps} mode="edit" task={task} />);

        expect(screen.getByText('Edit Task')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
        expect(screen.getByDisplayValue('11.2.3')).toBeInTheDocument();
        expect(screen.getByDisplayValue('testing')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test, task')).toBeInTheDocument();
        expect(screen.getByText('Update Task')).toBeInTheDocument();
    });

    it('should handle form validation for required fields', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Title is required')).toBeInTheDocument();
            expect(screen.getByText('Status is required')).toBeInTheDocument();
            expect(screen.getByText('Phase is required')).toBeInTheDocument();
            expect(screen.getByText('Workstream is required')).toBeInTheDocument();
        });

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate title length (max 100 characters)', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        const titleInput = screen.getByLabelText('Title');
        const longTitle = 'a'.repeat(101);
        
        await user.type(titleInput, longTitle);
        
        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Title must be 100 characters or less')).toBeInTheDocument();
        });
    });

    it('should validate description length (max 500 characters)', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        const descriptionInput = screen.getByLabelText('Description');
        const longDescription = 'a'.repeat(501);
        
        await user.type(descriptionInput, longDescription);
        
        // Fill required fields
        await user.type(screen.getByLabelText('Title'), 'Test');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), '11.2.3');
        await user.type(screen.getByLabelText('Workstream'), 'test');
        
        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Description must be 500 characters or less')).toBeInTheDocument();
        });
    });

    it('should save task with valid data', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        // Fill form fields
        await user.type(screen.getByLabelText('Title'), 'New Task');
        await user.type(screen.getByLabelText('Description'), 'Task description');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), '11.2.3');
        await user.type(screen.getByLabelText('Workstream'), 'testing');
        await user.type(screen.getByLabelText('Tags'), 'test, task');

        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                title: 'New Task',
                description: 'Task description',
                status: 'planning',
                phase: '11.2.3',
                workstream: 'testing',
                tags: ['test', 'task']
            });
        });
    });

    it('should handle cancel button click', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        // Test Escape key
        await user.keyboard('{Escape}');
        expect(mockOnCancel).toHaveBeenCalled();

        // Reset mock
        mockOnCancel.mockClear();

        // Fill form with valid data
        await user.type(screen.getByLabelText('Title'), 'New Task');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), '11.2.3');
        await user.type(screen.getByLabelText('Workstream'), 'testing');

        // Test Ctrl+S
        await user.keyboard('{Control>}s{/Control}');
        
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('should handle Ctrl+Enter shortcut', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        // Fill form with valid data
        await user.type(screen.getByLabelText('Title'), 'New Task');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), '11.2.3');
        await user.type(screen.getByLabelText('Workstream'), 'testing');

        // Test Ctrl+Enter
        await user.keyboard('{Control>}{Enter}{/Control}');
        
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('should show loading state', () => {
        render(<InlineTaskEditor {...defaultProps} loading={true} />);

        const saveButton = screen.getByText('Saving...');
        expect(saveButton).toBeDisabled();
    });

    it('should process tags correctly', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        const tagsInput = screen.getByLabelText('Tags');
        
        // Test various tag formats
        await user.type(tagsInput, 'tag1, tag2 ,  tag3  , tag4');
        
        // Fill required fields
        await user.type(screen.getByLabelText('Title'), 'Test');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), '11.2.3');
        await user.type(screen.getByLabelText('Workstream'), 'test');

        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    tags: ['tag1', 'tag2', 'tag3', 'tag4']
                })
            );
        });
    });

    it('should handle empty tags', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        // Fill required fields without tags
        await user.type(screen.getByLabelText('Title'), 'Test');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), '11.2.3');
        await user.type(screen.getByLabelText('Workstream'), 'test');

        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(
                expect.objectContaining({
                    tags: []
                })
            );
        });
    });

    it('should render delete mode with confirmation', () => {
        const task = {
            id: 'test-id',
            title: 'Task to Delete',
            description: 'Task description',
            status: 'planning' as const,
            phase: '11.2.3',
            workstream: 'testing',
            tags: ['test'],
            uuid: 'test-uuid'
        };

        render(<InlineTaskEditor {...defaultProps} mode="delete" task={task} />);

        expect(screen.getByText('Delete Task')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this task?')).toBeInTheDocument();
        expect(screen.getByText('"Task to Delete"')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should handle delete confirmation', async () => {
        const user = userEvent.setup();
        const task = {
            id: 'test-id',
            title: 'Task to Delete',
            description: 'Task description',
            status: 'planning' as const,
            phase: '11.2.3',
            workstream: 'testing',
            tags: ['test'],
            uuid: 'test-uuid'
        };

        render(<InlineTaskEditor {...defaultProps} mode="delete" task={task} />);

        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);

        expect(mockOnSave).toHaveBeenCalledWith({ action: 'delete', taskId: 'test-uuid' });
    });

    it('should handle status dropdown options', () => {
        render(<InlineTaskEditor {...defaultProps} />);

        const statusSelect = screen.getByLabelText('Status');
        
        expect(screen.getByText('Select status')).toBeInTheDocument();
        expect(screen.getByText('Planning')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Complete')).toBeInTheDocument();
        expect(screen.getByText('Blocked')).toBeInTheDocument();
    });

    it('should maintain focus on form elements', () => {
        render(<InlineTaskEditor {...defaultProps} />);

        const titleInput = screen.getByLabelText('Title');
        titleInput.focus();
        
        expect(document.activeElement).toBe(titleInput);
    });

    it('should prevent form submission with invalid phase format', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        // Fill form with invalid phase
        await user.type(screen.getByLabelText('Title'), 'Test Task');
        await user.selectOptions(screen.getByLabelText('Status'), 'planning');
        await user.type(screen.getByLabelText('Phase'), 'invalid-phase');
        await user.type(screen.getByLabelText('Workstream'), 'test');

        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Phase must be in format X.Y.Z (e.g., 11.2.3)')).toBeInTheDocument();
        });
    });

    it('should clear form errors when valid input is provided', async () => {
        const user = userEvent.setup();
        render(<InlineTaskEditor {...defaultProps} />);

        // Trigger validation error
        const saveButton = screen.getByText('Save Task');
        await user.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Title is required')).toBeInTheDocument();
        });

        // Fix the error
        await user.type(screen.getByLabelText('Title'), 'Valid Title');

        // Error should be cleared
        await waitFor(() => {
            expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
        });
    });
}); 