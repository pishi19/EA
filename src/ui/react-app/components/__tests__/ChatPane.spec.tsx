/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPane from '@/components/chat/ChatPane';

// Mock fetch
global.fetch = jest.fn();

const mockChatMessages = [
  {
    timestamp: '2025-01-01T10:00:00Z',
    speaker: 'user',
    message: 'How do I implement tests?'
  },
  {
    timestamp: '2025-01-01T10:01:00Z',
    speaker: 'ora',
    message: 'To implement tests, you can use Jest and React Testing Library.'
  }
];

describe('ChatPane Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders chat interface with basic functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChatMessages,
    });

    render(<ChatPane scope="task" params={{ taskId: "test-task" }} title="Test Chat" />);

    // Check for chat interface elements
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('How do I implement tests?')).toBeInTheDocument();
    });

    expect(screen.getByText('To implement tests, you can use Jest and React Testing Library.')).toBeInTheDocument();
  });

  test('displays loading state', async () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockChatMessages,
      }), 100))
    );

    render(<ChatPane scope="task" params={{ taskId: "test-task" }} title="Test Chat" />);

    // Should show loading state
    expect(screen.getByText('Loading chat...')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Chat API error'));

    render(<ChatPane scope="task" params={{ taskId: "test-task" }} title="Test Chat" />);

    await waitFor(() => {
      expect(screen.getByText('Chat API error')).toBeInTheDocument();
    });
  });

  test('allows user to type in message input', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChatMessages,
    });

    render(<ChatPane scope="task" params={{ taskId: "test-task" }} title="Test Chat" />);

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });

    const textInput = screen.getByRole('textbox');
    await userEvent.type(textInput, 'Test message');
    
    expect(textInput).toHaveValue('Test message');
  });

  test('displays messages with timestamps', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockChatMessages,
    });

    render(<ChatPane scope="task" params={{ taskId: "test-task" }} title="Test Chat" />);

    await waitFor(() => {
      expect(screen.getByText('How do I implement tests?')).toBeInTheDocument();
    });

    // Check that timestamps are displayed
    const timestampElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timestampElements.length).toBeGreaterThan(0);
  });

  test('handles empty message list', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<ChatPane scope="task" params={{ taskId: "test-task" }} title="Test Chat" />);

    await waitFor(() => {
      expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    });
  });
}); 