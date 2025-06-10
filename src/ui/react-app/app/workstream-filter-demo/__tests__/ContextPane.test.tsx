import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContextPane from '../ContextPane';

// Mock fetch globally for API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ContextPane Component', () => {
  const mockArtefact = {
    id: 'task1',
    name: 'task1',
    title: 'Test Task 1',
    phase: '11.3.1',
    workstream: 'Ora',
    status: 'in_progress',
    score: 5,
    tags: ['test-tag'],
    created: '2025-12-15',
    uuid: 'test-uuid-1',
    summary: 'Test task summary for testing purposes',
    filePath: 'runtime/loops/task1.md',
    origin: 'ui',
    type: 'task'
  };

  const mockProps = {
    selectedArtefact: mockArtefact,
    onArtefactUpdate: jest.fn(),
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<ContextPane {...mockProps} />);
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
  });

  it('displays artefact details correctly', () => {
    render(<ContextPane {...mockProps} />);
    
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('in_progress')).toBeInTheDocument();
    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByText('11.3.1')).toBeInTheDocument();
    expect(screen.getByText('Test task summary for testing purposes')).toBeInTheDocument();
  });

  it('shows empty state when no artefact selected', () => {
    const emptyProps = {
      ...mockProps,
      selectedArtefact: null
    };
    
    render(<ContextPane {...emptyProps} />);
    expect(screen.getByText('Select an artefact to view details')).toBeInTheDocument();
  });

  it('handles chat message input', async () => {
    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    expect(chatInput).toBeInTheDocument();
    
    await userEvent.type(chatInput, 'Test message');
    expect(chatInput).toHaveValue('Test message');
  });

  it('handles chat message submission', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Mock AI response'
      })
    } as Response);

    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByTitle('Send message');
    
    await userEvent.type(chatInput, 'Test message');
    await userEvent.click(sendButton);
    
    expect(mockFetch).toHaveBeenCalledWith('/api/artefact-chat', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('Test message')
    }));
  });

  it('displays chat messages', async () => {
    // Mock API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Test AI response'
      })
    } as Response);

    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(chatInput, 'Test message');
    
    const sendButton = screen.getByTitle('Send message');
    await userEvent.click(sendButton);
    
    // Should show user message
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    // Should show AI response after API call
    await waitFor(() => {
      expect(screen.getByText('Test AI response')).toBeInTheDocument();
    });
  });

  it('handles quick action buttons', async () => {
    render(<ContextPane {...mockProps} />);
    
    const completeButton = screen.getByText('Mark Complete');
    expect(completeButton).toBeInTheDocument();
    
    await userEvent.click(completeButton);
    
    expect(mockProps.onArtefactUpdate).toHaveBeenCalledWith({
      ...mockArtefact,
      status: 'complete'
    });
  });

  it('handles urgent tag addition', async () => {
    render(<ContextPane {...mockProps} />);
    
    const urgentButton = screen.getByText('Add Urgent');
    await userEvent.click(urgentButton);
    
    expect(mockProps.onArtefactUpdate).toHaveBeenCalledWith({
      ...mockArtefact,
      tags: [...mockArtefact.tags, 'urgent']
    });
  });

  it('displays memory trace section', () => {
    render(<ContextPane {...mockProps} />);
    
    expect(screen.getByText('Memory Trace')).toBeInTheDocument();
    expect(screen.getByText('Creation')).toBeInTheDocument();
    expect(screen.getByText('runtime/loops/task1.md')).toBeInTheDocument();
  });

  it('handles consultation questions', async () => {
    // Mock API response for consultation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        response: 'Here are my suggestions for next actions...'
      })
    } as Response);

    render(<ContextPane {...mockProps} />);
    
    const consultButton = screen.getByText('What\'s the next best action?');
    await userEvent.click(consultButton);
    
    expect(mockFetch).toHaveBeenCalledWith('/api/artefact-chat', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('What\'s the next best action')
    }));
  });

  it('shows AI suggestions based on artefact context', () => {
    const longRunningArtefact = {
      ...mockArtefact,
      created: '2025-10-01', // Long running task
      status: 'in_progress'
    };
    
    const propsWithLongTask = {
      ...mockProps,
      selectedArtefact: longRunningArtefact
    };
    
    render(<ContextPane {...propsWithLongTask} />);
    
    expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    // Should show suggestion about long-running task
    expect(screen.getByText(/This task has been in progress/)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(chatInput, 'Test message');
    
    const sendButton = screen.getByTitle('Send message');
    await userEvent.click(sendButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to send message/)).toBeInTheDocument();
    });
  });

  it('supports keyboard shortcuts for chat', async () => {
    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(chatInput, 'Test message');
    
    // Test Enter key submission
    fireEvent.keyDown(chatInput, { key: 'Enter', code: 'Enter' });
    
    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles Shift+Enter for new lines', async () => {
    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(chatInput, 'Line 1');
    
    // Test Shift+Enter for new line
    fireEvent.keyDown(chatInput, { 
      key: 'Enter', 
      code: 'Enter', 
      shiftKey: true 
    });
    
    await userEvent.type(chatInput, 'Line 2');
    
    expect(chatInput).toHaveValue('Line 1\nLine 2');
  });

  it('shows loading states during API calls', async () => {
    // Mock slow API response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ response: 'Delayed response' })
        } as Response), 100)
      )
    );

    render(<ContextPane {...mockProps} />);
    
    const chatInput = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(chatInput, 'Test message');
    
    const sendButton = screen.getByTitle('Send message');
    await userEvent.click(sendButton);
    
    // Should show loading state
    expect(sendButton).toBeDisabled();
    
    // Wait for response
    await waitFor(() => {
      expect(sendButton).not.toBeDisabled();
    });
  });

  it('handles memory trace API calls', async () => {
    // Mock memory trace API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        entries: [
          {
            type: 'creation',
            source: 'system',
            content: 'Artefact created',
            timestamp: '2025-12-15T10:00:00Z'
          }
        ]
      })
    } as Response);

    render(<ContextPane {...mockProps} />);
    
    // Should make memory trace API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory-trace'),
        expect.any(Object)
      );
    });
  });

  it('displays contextual suggestions based on artefact status', () => {
    const blockedArtefact = {
      ...mockArtefact,
      status: 'blocked'
    };
    
    const propsWithBlockedTask = {
      ...mockProps,
      selectedArtefact: blockedArtefact
    };
    
    render(<ContextPane {...propsWithBlockedTask} />);
    
    expect(screen.getByText(/This task is blocked/)).toBeInTheDocument();
  });

  it('shows appropriate suggestions for complete tasks', () => {
    const completeArtefact = {
      ...mockArtefact,
      status: 'complete'
    };
    
    const propsWithCompleteTask = {
      ...mockProps,
      selectedArtefact: completeArtefact
    };
    
    render(<ContextPane {...propsWithCompleteTask} />);
    
    expect(screen.getByText(/This task is complete/)).toBeInTheDocument();
  });
}); 