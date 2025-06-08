// Test suite for loop: loop-2025-09-02-ui-resilience-and-regression-tests.md
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskBoard from '@/components/TaskBoard';

// Mocking the API functions using fetch
global.fetch = jest.fn();

const mockUserTask = {
    id: 'user-task-1',
    description: 'A task defined by the user',
    added_by: 'user',
    status: 'pending',
    source: 'workstream_plan.md',
    section: 'User-Defined Tasks',
};

const mockOraTask = {
    id: 'ora-task-1',
    description: 'A task suggested by Ora',
    added_by: 'ora',
    status: 'pending',
    source: 'workstream_plan.md',
    section: 'Ora-Suggested Tasks',
};

const mockTasks = [mockUserTask, mockOraTask];

describe('Task Board Resilience and Stability', () => {

    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
    });

    test('1. Render Task Board with mock data and verify tasks', async () => {
        console.log('Running test: Render Task Board with mock data');
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTasks,
        });

        render(<TaskBoard />);

        await waitFor(() => {
            expect(screen.getByText('Workstream Task Board')).toBeInTheDocument();
        });

        // Verify User-Defined Task
        expect(screen.getByText('A task defined by the user')).toBeInTheDocument();
        expect(screen.getAllByText('user')[0]).toBeInTheDocument(); // added_by
        expect(screen.getAllByText('workstream_plan.md')[0]).toBeInTheDocument(); // source
        
        // The status is not explicitly rendered as text, but as a checkbox state. Check checkbox existence.
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThanOrEqual(2);

        // Verify Ora-Suggested Task
        expect(screen.getByText('A task suggested by Ora')).toBeInTheDocument();
        expect(screen.getAllByText('ora')[0]).toBeInTheDocument(); // added_by
        expect(screen.getAllByText('workstream_plan.md')[1]).toBeInTheDocument(); // source
        
        console.log('Test finished: Render Task Board with mock data');
    });

    test('2. Confirm "Promote to Execution" button triggers promotion', async () => {
        console.log('Running test: Promote to Execution');

        // Initial task load
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [mockUserTask],
        });

        // Mock for getLoops inside the promotion dialog
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'loop-1', name: 'Existing Loop' }],
        });

        // Mock for getProjectTaskFiles 
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'file-1', name: 'Task File' }],
        });

        // Mock for the promotion API call
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });
        
        // Mock for the refetch of tasks after promotion
        const promotedTask = { ...mockUserTask, status: 'promoted', promoted_to: 'Existing Loop' };
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [promotedTask],
        });

        render(<TaskBoard />);

        // Wait for the initial task to be visible and find promote button
        await waitFor(() => {
            expect(screen.getByText('A task defined by the user')).toBeInTheDocument();
        });
        
        const promoteButton = screen.getByTitle('Promote to Execution');
        expect(promoteButton).toBeInTheDocument();

        // Click promote button to open dialog
        await userEvent.click(promoteButton);

        // Dialog appears
        await screen.findByText('Promote Task to Execution');
        
        // The default selection should be "Promote to existing loop"
        expect(screen.getByText('Promote to existing loop')).toBeInTheDocument();

        // Select a loop from the second dropdown
        const loopSelects = screen.getAllByRole('combobox');
        const loopSelect = loopSelects[1]; // Second combobox for loop selection
        await userEvent.click(loopSelect);
        
        // Wait for the option to appear and click it
        await waitFor(() => {
            expect(screen.getByText('Existing Loop')).toBeInTheDocument();
        });
        await userEvent.click(screen.getByText('Existing Loop'));
        
        // Click final promote button
        const dialogPromoteButton = screen.getByRole('button', { name: 'Promote' });
        await userEvent.click(dialogPromoteButton);
        
        // Assert that the promotion API was called
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/promote-task', expect.anything());
        });
        
        const fetchCalls = (fetch as jest.Mock).mock.calls;
        const promoteCall = fetchCalls.find(call => call[0] === '/api/promote-task');
        expect(promoteCall).toBeDefined();
        const body = JSON.parse(promoteCall[1].body);
        expect(body.task.id).toBe(mockUserTask.id);
        expect(body.destinationId).toBe('loop-1');

        console.log('Test finished: Promote to Execution');
    });

    test('3. Block promotion for malformed tasks and show error', async () => {
        console.log('Running test: Malformed task promotion');

        const malformedTask = { ...mockUserTask, source: undefined };

        // Initial task load
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [malformedTask],
        });

        // Mock for getLoops
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'loop-1', name: 'Existing Loop' }],
        });

        // Mock for getProjectTaskFiles 
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'file-1', name: 'Task File' }],
        });

        // Mock for the promotion API call to fail
        const errorMessage = "Task is malformed. Missing 'source'.";
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ message: errorMessage }),
        });

        render(<TaskBoard />);

        await waitFor(() => {
            expect(screen.getByText('A task defined by the user')).toBeInTheDocument();
        });

        const promoteButton = screen.getByTitle('Promote to Execution');
        await userEvent.click(promoteButton);

        await screen.findByText('Promote Task to Execution');
        
        // Select a loop
        const loopSelects = screen.getAllByRole('combobox');
        const loopSelect = loopSelects[1];
        await userEvent.click(loopSelect);
        await userEvent.click(screen.getByText('Existing Loop'));
        
        const dialogPromoteButton = screen.getByRole('button', { name: 'Promote' });
        await userEvent.click(dialogPromoteButton);
        
        // Assert that the error message from the API is shown
        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
        
        console.log('Test finished: Malformed task promotion');
    });

    test('4. Handle mutation failure and show recovery message', async () => {
        console.log('Running test: Mutation failure');

        // Initial task load
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [mockUserTask],
        });

        // Mock for getLoops
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'loop-1', name: 'Existing Loop' }],
        });

        // Mock for getProjectTaskFiles 
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 'file-1', name: 'Task File' }],
        });

        // Mock for the promotion API call to fail with a mutation error
        const recoveryMessage = "Mutation failed: Target file missing '## 🔧 Tasks' block. Aborting.";
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ message: recoveryMessage }),
        });

        render(<TaskBoard />);

        await waitFor(() => {
            expect(screen.getByText('A task defined by the user')).toBeInTheDocument();
        });

        const promoteButton = screen.getByTitle('Promote to Execution');
        await userEvent.click(promoteButton);

        await screen.findByText('Promote Task to Execution');
        
        // Select a loop
        const loopSelects = screen.getAllByRole('combobox');
        const loopSelect = loopSelects[1];
        await userEvent.click(loopSelect);
        await userEvent.click(screen.getByText('Existing Loop'));
        
        const dialogPromoteButton = screen.getByRole('button', { name: 'Promote' });
        await userEvent.click(dialogPromoteButton);
        
        // Assert that the recovery message is shown
        await waitFor(() => {
            expect(screen.getByText(recoveryMessage)).toBeInTheDocument();
        });
        
        console.log('Test finished: Mutation failure');
    });

    test('5. Show fallback UI when tasks fail to load', async () => {
        console.log('Running test: Task loading failure');

        const errorMessage = 'Failed to fetch tasks';
        (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

        render(<TaskBoard />);

        // Initially, loading text should be present
        expect(screen.getByText('Loading Task Board...')).toBeInTheDocument();

        // After the fetch fails, an error message should be displayed.
        await waitFor(() => {
            expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
        });

        // Ensure loading text is gone
        expect(screen.queryByText('Loading Task Board...')).not.toBeInTheDocument();
        
        console.log('Test finished: Task loading failure');
    });
}); 