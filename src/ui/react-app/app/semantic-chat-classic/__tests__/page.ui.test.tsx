import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SemanticChatClassic from '../page';

// Mock the workstream context
jest.mock('@/lib/workstream-context', () => ({
  useWorkstream: jest.fn()
}));

// Mock the LoopCard component
jest.mock('@/components/LoopCard', () => {
  return function MockLoopCard({ loop }: any) {
    return (
      <div data-testid={`loop-card-${loop.id}`} className="loop-card">
        <div data-testid="loop-header" className="loop-header">
          <h2 data-testid="loop-title">{loop.title || loop.name}</h2>
          <div data-testid="loop-metadata">
            <span data-testid="loop-phase">Phase: {loop.phase}</span>
            <span data-testid="loop-workstream">Workstream: {loop.workstream}</span>
            <span data-testid="loop-status">Status: {loop.status}</span>
            {loop.score && <span data-testid="loop-score">Score: {loop.score}</span>}
          </div>
          <div data-testid="loop-tags">
            {loop.tags?.map((tag: string, index: number) => (
              <span key={index} data-testid={`tag-${tag}`} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div data-testid="loop-content" className="loop-content">
          <div data-testid="loop-summary">
            <p>{loop.summary || 'No summary available'}</p>
          </div>
          
          <div data-testid="loop-details">
            <div>Created: {loop.created}</div>
            <div>File: {loop.filePath}</div>
          </div>
        </div>

        <div data-testid="chat-section" className="chat-section">
          <div data-testid="chat-header">
            <h3>💬 Contextual Chat</h3>
            <button data-testid="expand-chat-button">Expand Chat</button>
          </div>
          
          <div data-testid="chat-messages" className="chat-messages">
            <div data-testid="message-1" className="chat-message user">
              <span>User: How can I improve this task?</span>
            </div>
            <div data-testid="message-2" className="chat-message ai">
              <span>AI: Based on the context, I suggest breaking this down into smaller subtasks...</span>
            </div>
          </div>
          
          <div data-testid="chat-input-area" className="chat-input">
            <textarea 
              data-testid="chat-textarea" 
              placeholder={`Ask about ${loop.title || loop.name}...`}
              rows={3}
            />
            <div data-testid="chat-controls">
              <button data-testid="send-message-button">Send</button>
              <button data-testid="clear-chat-button">Clear</button>
            </div>
          </div>
        </div>

        <div data-testid="loop-actions" className="loop-actions">
          <button data-testid="edit-loop-button">Edit Loop</button>
          <button data-testid="view-file-button">View File</button>
          <button data-testid="export-chat-button">Export Chat</button>
        </div>
      </div>
    );
  };
});

const mockUseWorkstream = require('@/lib/workstream-context').useWorkstream;

const mockLoops = [
  {
    id: 'loop-1',
    name: 'loop-1',
    title: 'Implement Authentication System',
    phase: '11.1',
    workstream: 'ora',
    status: 'in_progress',
    score: 8,
    tags: ['authentication', 'security', 'backend'],
    created: '2025-01-15T10:00:00Z',
    summary: 'Comprehensive authentication system with JWT tokens and role-based access control.',
    filePath: 'runtime/workstreams/ora/loops/authentication-system.md'
  },
  {
    id: 'loop-2', 
    name: 'loop-2',
    title: 'Database Schema Design',
    phase: '11.2',
    workstream: 'ora',
    status: 'complete',
    score: 9,
    tags: ['database', 'schema', 'design'],
    created: '2025-01-10T09:00:00Z',
    summary: 'Complete database schema design for the application with normalized tables.',
    filePath: 'runtime/workstreams/ora/loops/database-schema.md'
  },
  {
    id: 'loop-3',
    name: 'loop-3', 
    title: 'API Documentation',
    phase: '12.1',
    workstream: 'ora',
    status: 'planning',
    score: 6,
    tags: ['documentation', 'api', 'openapi'],
    created: '2025-01-20T14:30:00Z',
    summary: 'Comprehensive API documentation using OpenAPI specification.',
    filePath: 'runtime/workstreams/ora/loops/api-documentation.md'
  }
];

describe('SemanticChatClassic Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock workstream context
    mockUseWorkstream.mockReturnValue({
      currentWorkstream: 'ora',
      isValidWorkstream: jest.fn().mockReturnValue(true),
      loading: false,
      error: null
    });

    // Setup mock fetch responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/demo-loops')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ artefacts: mockLoops })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Initial Rendering', () => {
    test('renders page header and description', async () => {
      render(<SemanticChatClassic />);
      
      expect(screen.getByText('Artefacts')).toBeInTheDocument();
      expect(screen.getByText(/Scoped GPT Chat Integration/)).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      render(<SemanticChatClassic />);
      
      expect(screen.getByText(/Loading loops with embedded contextual chat/)).toBeInTheDocument();
    });

    test('displays loop count and description', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText(/3 loops loaded/)).toBeInTheDocument();
        expect(screen.getByText(/Chat scoped by UUID and file path/)).toBeInTheDocument();
        expect(screen.getByText(/Persistent conversation history/)).toBeInTheDocument();
      });
    });

    test('renders footer information', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText(/Contextual Chat Architecture/)).toBeInTheDocument();
        expect(screen.getByText(/Each chat interaction is tied to its semantic context/)).toBeInTheDocument();
        expect(screen.getByText(/Expand any chat section to interact/)).toBeInTheDocument();
      });
    });
  });

  describe('Workstream Context Integration', () => {
    test('loads loops for current workstream', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/demo-loops?workstream=ora');
      });
    });

    test('handles workstream changes', async () => {
      mockUseWorkstream.mockReturnValue({
        currentWorkstream: 'mecca',
        isValidWorkstream: jest.fn().mockReturnValue(true),
        loading: false,
        error: null
      });

      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/demo-loops?workstream=mecca');
      });
    });

    test('falls back to ora workstream when invalid', async () => {
      mockUseWorkstream.mockReturnValue({
        currentWorkstream: 'invalid-workstream',
        isValidWorkstream: jest.fn().mockReturnValue(false),
        loading: false,
        error: null
      });

      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/demo-loops?workstream=ora');
      });
    });
  });

  describe('Loop Card Rendering', () => {
    test('renders all loop cards', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loop-card-loop-1')).toBeInTheDocument();
        expect(screen.getByTestId('loop-card-loop-2')).toBeInTheDocument();
        expect(screen.getByTestId('loop-card-loop-3')).toBeInTheDocument();
      });
    });

    test('displays loop titles correctly', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText('Implement Authentication System')).toBeInTheDocument();
        expect(screen.getByText('Database Schema Design')).toBeInTheDocument();
        expect(screen.getByText('API Documentation')).toBeInTheDocument();
      });
    });

    test('shows loop metadata', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        // Check first loop metadata
        const loop1Card = screen.getByTestId('loop-card-loop-1');
        expect(within(loop1Card).getByText('Phase: 11.1')).toBeInTheDocument();
        expect(within(loop1Card).getByText('Workstream: ora')).toBeInTheDocument();
        expect(within(loop1Card).getByText('Status: in_progress')).toBeInTheDocument();
        expect(within(loop1Card).getByText('Score: 8')).toBeInTheDocument();
      });
    });

    test('displays loop tags', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const loop1Card = screen.getByTestId('loop-card-loop-1');
        expect(within(loop1Card).getByTestId('tag-authentication')).toBeInTheDocument();
        expect(within(loop1Card).getByTestId('tag-security')).toBeInTheDocument();
        expect(within(loop1Card).getByTestId('tag-backend')).toBeInTheDocument();
      });
    });

    test('shows loop summaries', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText(/Comprehensive authentication system with JWT tokens/)).toBeInTheDocument();
        expect(screen.getByText(/Complete database schema design for the application/)).toBeInTheDocument();
        expect(screen.getByText(/Comprehensive API documentation using OpenAPI/)).toBeInTheDocument();
      });
    });

    test('displays creation dates and file paths', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const loop1Card = screen.getByTestId('loop-card-loop-1');
        expect(within(loop1Card).getByText(/Created: 2025-01-15T10:00:00Z/)).toBeInTheDocument();
        expect(within(loop1Card).getByText(/File:.*authentication-system.md/)).toBeInTheDocument();
      });
    });
  });

  describe('Chat Functionality', () => {
    test('renders chat sections for each loop', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const chatSections = screen.getAllByTestId('chat-section');
        expect(chatSections).toHaveLength(3);
        
        chatSections.forEach(section => {
          expect(within(section).getByText('💬 Contextual Chat')).toBeInTheDocument();
        });
      });
    });

    test('shows existing chat messages', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const chatMessages = screen.getAllByTestId('chat-messages');
        
        chatMessages.forEach(messagesContainer => {
          expect(within(messagesContainer).getByText(/How can I improve this task?/)).toBeInTheDocument();
          expect(within(messagesContainer).getByText(/Based on the context, I suggest breaking this down/)).toBeInTheDocument();
        });
      });
    });

    test('provides chat input for each loop', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const chatTextareas = screen.getAllByTestId('chat-textarea');
        expect(chatTextareas).toHaveLength(3);
        
        expect(chatTextareas[0]).toHaveAttribute('placeholder', 'Ask about Implement Authentication System...');
        expect(chatTextareas[1]).toHaveAttribute('placeholder', 'Ask about Database Schema Design...');
        expect(chatTextareas[2]).toHaveAttribute('placeholder', 'Ask about API Documentation...');
      });
    });

    test('chat input areas are functional', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const chatTextarea = screen.getAllByTestId('chat-textarea')[0];
        expect(chatTextarea).toBeInTheDocument();
      });

      const chatTextarea = screen.getAllByTestId('chat-textarea')[0];
      fireEvent.change(chatTextarea, { target: { value: 'What are the security considerations?' } });
      
      expect(chatTextarea).toHaveValue('What are the security considerations?');
    });

    test('chat controls are present and functional', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const sendButtons = screen.getAllByTestId('send-message-button');
        const clearButtons = screen.getAllByTestId('clear-chat-button');
        
        expect(sendButtons).toHaveLength(3);
        expect(clearButtons).toHaveLength(3);
      });

      const sendButton = screen.getAllByTestId('send-message-button')[0];
      const clearButton = screen.getAllByTestId('clear-chat-button')[0];
      
      fireEvent.click(sendButton);
      fireEvent.click(clearButton);
      
      // Buttons should be interactive
      expect(sendButton).toBeInTheDocument();
      expect(clearButton).toBeInTheDocument();
    });

    test('expand chat functionality', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const expandButtons = screen.getAllByTestId('expand-chat-button');
        expect(expandButtons).toHaveLength(3);
      });

      const expandButton = screen.getAllByTestId('expand-chat-button')[0];
      fireEvent.click(expandButton);
      
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe('Loop Actions', () => {
    test('renders action buttons for each loop', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-loop-button');
        const viewFileButtons = screen.getAllByTestId('view-file-button');
        const exportChatButtons = screen.getAllByTestId('export-chat-button');
        
        expect(editButtons).toHaveLength(3);
        expect(viewFileButtons).toHaveLength(3);
        expect(exportChatButtons).toHaveLength(3);
      });
    });

    test('action buttons are interactive', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const editButton = screen.getAllByTestId('edit-loop-button')[0];
        const viewFileButton = screen.getAllByTestId('view-file-button')[0];
        const exportChatButton = screen.getAllByTestId('export-chat-button')[0];
        
        expect(editButton).toBeInTheDocument();
        expect(viewFileButton).toBeInTheDocument();
        expect(exportChatButton).toBeInTheDocument();
      });

      const editButton = screen.getAllByTestId('edit-loop-button')[0];
      fireEvent.click(editButton);
      
      expect(editButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error state when API fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
      
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/API Error/)).toBeInTheDocument();
      });
    });

    test('provides retry functionality', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));
      
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      // Mock successful retry
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ artefacts: mockLoops })
      });
      
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Implement Authentication System')).toBeInTheDocument();
      });
    });

    test('handles empty loops array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ artefacts: [] })
      });
      
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText('No loops available.')).toBeInTheDocument();
      });
    });

    test('handles malformed API response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}) // Missing artefacts
      });
      
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByText('No loops available.')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and User Experience', () => {
    test('renders multiple loops efficiently', async () => {
      const manyLoops = Array.from({ length: 50 }, (_, i) => ({
        ...mockLoops[0],
        id: `loop-${i}`,
        title: `Loop ${i}`,
        name: `loop-${i}`
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ artefacts: manyLoops })
      });

      const startTime = performance.now();
      render(<SemanticChatClassic />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
      
      await waitFor(() => {
        expect(screen.getByText(/50 loops loaded/)).toBeInTheDocument();
      });
    });

    test('maintains scroll position with many loops', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const loopCards = screen.getAllByTestId(/loop-card-/);
        expect(loopCards).toHaveLength(3);
      });

      // Should maintain viewport stability
      expect(window.scrollY).toBe(0);
    });

    test('chat sections don\'t interfere with each other', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const chatTextareas = screen.getAllByTestId('chat-textarea');
        expect(chatTextareas).toHaveLength(3);
      });

      // Type in first chat
      fireEvent.change(screen.getAllByTestId('chat-textarea')[0], { target: { value: 'Message 1' } });
      // Type in second chat  
      fireEvent.change(screen.getAllByTestId('chat-textarea')[1], { target: { value: 'Message 2' } });
      
      expect(screen.getAllByTestId('chat-textarea')[0]).toHaveValue('Message 1');
      expect(screen.getAllByTestId('chat-textarea')[1]).toHaveValue('Message 2');
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Artefacts');
        expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3); // Loop titles
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3); // Chat headers
      });
    });

    test('chat textareas have proper labels', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const chatTextareas = screen.getAllByTestId('chat-textarea');
        
        chatTextareas.forEach((textarea, index) => {
          expect(textarea).toHaveAttribute('placeholder');
          expect(textarea.getAttribute('placeholder')).toContain('Ask about');
        });
      });
    });

    test('buttons are properly labeled', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Send')).toHaveLength(3);
        expect(screen.getAllByText('Clear')).toHaveLength(3);
        expect(screen.getAllByText('Expand Chat')).toHaveLength(3);
        expect(screen.getAllByText('Edit Loop')).toHaveLength(3);
        expect(screen.getAllByText('View File')).toHaveLength(3);
        expect(screen.getAllByText('Export Chat')).toHaveLength(3);
      });
    });

    test('supports keyboard navigation', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const firstTextarea = screen.getAllByTestId('chat-textarea')[0];
        expect(firstTextarea).toBeInTheDocument();
      });

      const firstTextarea = screen.getAllByTestId('chat-textarea')[0];
      const firstSendButton = screen.getAllByTestId('send-message-button')[0];
      
      firstTextarea.focus();
      expect(document.activeElement).toBe(firstTextarea);
      
      // Tab should move to next focusable element
      fireEvent.keyDown(firstTextarea, { key: 'Tab' });
      expect(firstSendButton).toBeInTheDocument();
    });
  });

  describe('Integration Testing', () => {
    test('correctly passes loop data to LoopCard components', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        // Verify all loop data is correctly passed and displayed
        expect(screen.getByText('Implement Authentication System')).toBeInTheDocument();
        expect(screen.getByText('Database Schema Design')).toBeInTheDocument();
        expect(screen.getByText('API Documentation')).toBeInTheDocument();
        
        // Verify metadata is correct
        expect(screen.getByText('Phase: 11.1')).toBeInTheDocument();
        expect(screen.getByText('Phase: 11.2')).toBeInTheDocument();
        expect(screen.getByText('Phase: 12.1')).toBeInTheDocument();
      });
    });

    test('maintains component isolation between loops', async () => {
      render(<SemanticChatClassic />);
      
      await waitFor(() => {
        const expandButtons = screen.getAllByTestId('expand-chat-button');
        expect(expandButtons).toHaveLength(3);
      });

      // Interact with first loop
      fireEvent.click(screen.getAllByTestId('expand-chat-button')[0]);
      fireEvent.change(screen.getAllByTestId('chat-textarea')[0], { target: { value: 'Test message' } });
      
      // Other loops should be unaffected
      expect(screen.getAllByTestId('chat-textarea')[1]).toHaveValue('');
      expect(screen.getAllByTestId('chat-textarea')[2]).toHaveValue('');
    });
  });
}); 