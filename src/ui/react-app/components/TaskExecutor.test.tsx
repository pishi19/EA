/// <reference types="@testing-library/jest-dom" />
import React, { ComponentType } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskExecutor from './TaskExecutor';

// Define mocks at the top level
const mockTasks = [
    {
      "id": "task-1",
      "description": "Develop the initial UI structure.",
      "is_complete": false,
      "source_loop": {
        "uuid": "loop-abc-123",
        "title": "UI Development",
        "phase": "1",
        "workstream": "Frontend",
        "tags": ["ui", "react"]
      }
    },
    {
      "id": "task-2",
      "description": "Setup the backend API for tasks.",
      "is_complete": false,
      "source_loop": {
        "uuid": "loop-def-456",
        "title": "API Implementation",
        "phase": "2",
        "workstream": "Backend",
        "tags": ["api", "nodejs"]
      }
    },
    {
      "id": "task-3",
      "description": "Write integration tests.",
      "is_complete": true,
      "source_loop": {
        "uuid": "loop-ghi-789",
        "title": "Testing Phase",
        "phase": "3",
        "workstream": "QA",
        "tags": ["testing", "jest"]
      }
    }
  ];

const mockMemoryTraces = [
    { description: 'Task 1', timestamp: new Date().toISOString(), status: 'executed', executor: 'system', output: 'Did a thing.' },
    { description: 'Task 1', timestamp: new Date().toISOString(), status: 'completed', executor: 'user' },
];

let mockFileContent = `
---
uuid: loop-abc-123
---
# UI Development

## 📝 TODO

- [ ] Develop the initial UI structure.
- [ ] Another task.

## 🧾 Execution Log

- Old log entry.
`;

const mockUpdateFile = jest.fn((newContent) => {
  mockFileContent = newContent;
});

const mockSuggestion = 'This is a mock suggestion.';

// Mock fetch before describe block
global.fetch = jest.fn((url, options) => {
    if (url === '/api/tasks') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) });
    }
    if (url === '/api/suggest-next-step') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ suggestion: mockSuggestion }) });
    }
    if (url.toString().startsWith('/api/memory')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    if (url === '/api/complete-task') {
        mockTasks[0].is_complete = true;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Task marked as complete' }) });
    }
    if (url === '/api/run-task') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ result: 'Simulated GPT reasoning.' }) });
    }
    return Promise.resolve({ ok: false, status: 404 });
}) as jest.Mock;


describe('TaskExecutor', () => {
  let TaskExecutor: ComponentType;

  beforeAll(() => {
    jest.doMock('@/data/tasks.json', () => mockTasks, { virtual: true });
    TaskExecutor = require('./TaskExecutor').default;
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    // Reset mock data before each test
    mockTasks[0].is_complete = false;
  });

  it('renders tasks and their metadata correctly', () => {
    render(<TaskExecutor />);
    // Find the card by a unique element within it, then assert on the content
    const taskCard = screen.getByText('Develop the initial UI structure.').closest('div[class*="rounded-lg"]');
    expect(taskCard).toHaveTextContent('From Loop: UI Development');
    expect(taskCard).toHaveTextContent('Workstream: Frontend');
  });

  it('filters tasks by workstream', async () => {
    render(<TaskExecutor />);
    expect(screen.getByText('Develop the initial UI structure.')).toBeInTheDocument();
    expect(screen.getByText('Setup the backend API for tasks.')).toBeInTheDocument();

    const workstreamFilter = screen.getAllByRole('combobox')[0];
    await userEvent.click(workstreamFilter);
    await userEvent.click(await screen.findByText('Backend'));
    
    await waitFor(() => {
        expect(screen.queryByText('Develop the initial UI structure.')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Setup the backend API for tasks.')).toBeInTheDocument();
  });

  it('updates task state and button when "Complete" is clicked', async () => {
    render(<TaskExecutor />);
    
    let completeButtons = screen.getAllByRole('button', { name: 'Complete' });
    expect(completeButtons.length).toBe(2);

    const firstCompleteButton = completeButtons[0];
    await userEvent.click(firstCompleteButton);
    
    await waitFor(() => {
        // Now there should be one "Complete" button and two "Completed" buttons
        expect(screen.getAllByRole('button', { name: 'Completed' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Complete' })).toHaveLength(1);
    });
  });

  it('simulates and verifies the file mutation on task completion', async () => {
    render(<TaskExecutor />);
    
    const initialCheckbox = '- [ ] Develop the initial UI structure.';
    const completedCheckbox = '- [x] Develop the initial UI structure.';
    expect(mockFileContent).toContain(initialCheckbox);
    expect(mockFileContent.split('## 🧾 Execution Log')[1]).not.toContain('marked complete via UI');

    const completeButton = screen.getAllByRole('button', { name: /complete/i })[0];
    await userEvent.click(completeButton);

    await waitFor(() => {
      expect(mockUpdateFile).toHaveBeenCalledTimes(1);
    });

    expect(mockFileContent).toContain(completedCheckbox);
    expect(mockFileContent).toContain('marked complete via UI');
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot before task completion', () => {
      const { asFragment } = render(<TaskExecutor />);
      expect(asFragment()).toMatchSnapshot();
    });

    it('matches snapshot after task completion', async () => {
      const { asFragment } = render(<TaskExecutor />);
      
      const completeButton = screen.getAllByRole('button', { name: /complete/i })[0];
      await userEvent.click(completeButton);
      
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /completed/i })).toHaveLength(2);
      });

      expect(asFragment()).toMatchSnapshot();
    });
  });

  it('loads and displays tasks on initial render', async () => {
    render(<TaskExecutor />);
    expect(await screen.findByText('Develop the initial UI structure.')).toBeInTheDocument();
    expect(await screen.findByText('Setup the backend API for tasks.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
  });

  it('loads and displays tasks, then allows task completion', async () => {
    render(<TaskExecutor />);

    // 1. Wait for initial tasks to load and render
    await waitFor(() => {
        expect(screen.getByText('Develop the initial UI structure.')).toBeInTheDocument();
        expect(screen.getByText('Setup the backend API for tasks.')).toBeInTheDocument();
    });

    // 2. Find and click the "Complete" button for the first task
    const completeButtons = await screen.findAllByRole('button', { name: 'Complete' });
    expect(completeButtons).toHaveLength(1); // Only one task is incomplete
    await userEvent.click(completeButtons[0]);

    // 3. Wait for the API call and the UI to update
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/complete-task', expect.any(Object));
        // Now there should be two "Completed" buttons
        expect(screen.getAllByRole('button', { name: 'Completed' })).toHaveLength(2);
    });

    // 4. Verify no "Complete" buttons are left
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
  });

  it('runs a task and displays reasoning', async () => {
    render(<TaskExecutor />);

    // Wait for the run button to appear and click it
    const runButtons = await screen.findAllByRole('button', { name: 'Run' });
    await userEvent.click(runButtons[0]);

    // Wait for the "Running..." state and the subsequent result
    await waitFor(() => {
        expect(screen.getByText('Running...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/run-task', expect.any(Object));
        expect(screen.getByText(/simulated gpt reasoning/i)).toBeInTheDocument();
    });
  });

  it('loads tasks and displays memory traces when an accordion is opened', async () => {
    render(<TaskExecutor />);
    
    // Wait for initial tasks
    await screen.findByText('Task 1');
    
    // Click the accordion trigger for the first task
    const accordionTriggers = await screen.findAllByRole('button', { name: /task details/i });
    await userEvent.click(accordionTriggers[0]);

    // Check that the memory trace API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/memory?loopId=loop-1');
    });

    // Check that the memory traces are rendered
    expect(await screen.findByText(/Status: executed by system/i)).toBeInTheDocument();
    expect(await screen.findByText(/Did a thing./i)).toBeInTheDocument();
    expect(await screen.findByText(/Status: completed by user/i)).toBeInTheDocument();
  });

  it('displays a suggestion when "Suggest Next Step" is clicked', async () => {
    render(<TaskExecutor />);

    // Wait for tasks to load
    await screen.findByText('Task 1');

    // Find and click the suggestion button
    const suggestionButton = await screen.findByRole('button', { name: /suggest next step/i });
    await userEvent.click(suggestionButton);

    // Check that the API was called and the suggestion is displayed
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/suggest-next-step', expect.any(Object));
    });
    
    expect(await screen.findByText(mockSuggestion)).toBeInTheDocument();
  });
}); 