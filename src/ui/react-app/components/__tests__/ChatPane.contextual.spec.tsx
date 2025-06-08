import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPane from '../chat/ChatPane';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarFallback: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  AvatarImage: ({ src, ...props }: any) => <img src={src} {...props} />,
}));

describe('ChatPane Contextual Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const defaultProps = {
    contextType: 'loop' as const,
    contextId: 'test-loop-id',
    title: 'Test Chat',
  };

  test('renders with contextual props and displays correct title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<ChatPane {...defaultProps} />);

    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contextual-chat?contextType=loop&contextId=test-loop-id')
      );
    });
  });

  test('renders with default title when title prop is not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { contextType, contextId } = defaultProps;
    render(<ChatPane contextType={contextType} contextId={contextId} />);

    expect(screen.getByText('💬 Chat - loop test-loop-id')).toBeInTheDocument();
  });

  test('includes filePath in API call when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const filePath = 'runtime/loops/test-loop.md';
    render(<ChatPane {...defaultProps} filePath={filePath} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filePath=runtime%2Floops%2Ftest-loop.md')
      );
    });
  });

  test('displays existing chat messages', async () => {
    const mockMessages = [
      {
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'user',
        message: 'Hello, this is a test message',
      },
      {
        timestamp: '2025-06-07T10:01:00.000Z',
        speaker: 'ora',
        message: 'Hello! I received your message.',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
      expect(screen.getByText('Hello! I received your message.')).toBeInTheDocument();
    });
  });

  test('displays "Append to Memory Trace" and "Log to Execution Log" buttons for Ora messages', async () => {
    const mockMessages = [
      {
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'ora',
        message: 'This is an Ora response that can be logged',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Append to Memory Trace')).toBeInTheDocument();
      expect(screen.getByText('Log to Execution Log')).toBeInTheDocument();
    });
  });

  test('does not display log buttons for user messages', async () => {
    const mockMessages = [
      {
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'user',
        message: 'This is a user message',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('This is a user message')).toBeInTheDocument();
      expect(screen.queryByText('Append to Memory Trace')).not.toBeInTheDocument();
      expect(screen.queryByText('Log to Execution Log')).not.toBeInTheDocument();
    });
  });

  test('sends message with correct contextual data', async () => {
    // Mock initial chat load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // Mock message post
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'user',
        message: 'Test message',
      }),
    });

    // Mock chat refresh after message
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          timestamp: '2025-06-07T10:00:00.000Z',
          speaker: 'user',
          message: 'Test message',
        },
      ],
    });

    render(<ChatPane {...defaultProps} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'loop',
          contextId: 'test-loop-id',
          message: {
            speaker: 'user',
            message: 'Test message',
          },
        }),
      });
    });
  });

  test('includes filePath in message posting when provided', async () => {
    // Mock initial chat load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // Mock message post
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'user',
        message: 'Test message',
      }),
    });

    // Mock chat refresh after message
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const filePath = 'runtime/loops/test-loop.md';
    render(<ChatPane {...defaultProps} filePath={filePath} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'loop',
          contextId: 'test-loop-id',
          message: {
            speaker: 'user',
            message: 'Test message',
          },
          filePath: 'runtime/loops/test-loop.md',
        }),
      });
    });
  });

  test('handles "Append to Memory Trace" button click', async () => {
    const mockMessages = [
      {
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'ora',
        message: 'This is an Ora response',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Append to Memory Trace')).toBeInTheDocument();
    });

    const logButton = screen.getByText('Append to Memory Trace');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'loop',
          contextId: 'test-loop-id',
          message: 'This is an Ora response',
          section: 'memory',
        }),
      });
    });
  });

  test('handles "Log to Execution Log" button click', async () => {
    const mockMessages = [
      {
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'ora',
        message: 'This is an Ora response',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Log to Execution Log')).toBeInTheDocument();
    });

    const logButton = screen.getByText('Log to Execution Log');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contextual-chat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: 'loop',
          contextId: 'test-loop-id',
          message: 'This is an Ora response',
          section: 'execution',
        }),
      });
    });
  });

  test('handles error states gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('works with different context types', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <ChatPane
        contextType="task"
        contextId="task-123"
        title="Task Chat"
      />
    );

    expect(screen.getByText('Task Chat')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contextual-chat?contextType=task&contextId=task-123')
      );
    });
  });

  test('preserves multiline messages correctly', async () => {
    const mockMessages = [
      {
        timestamp: '2025-06-07T10:00:00.000Z',
        speaker: 'user',
        message: 'This is a multiline\nmessage with\nline breaks',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMessages,
    });

    render(<ChatPane {...defaultProps} />);

    await waitFor(() => {
      const messageElement = screen.getByText((content, element) => {
        return !!(element && element.textContent === 'This is a multiline\nmessage with\nline breaks');
      });
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveClass('whitespace-pre-wrap');
    });
  });
}); 