import { render, screen, waitFor } from '@testing-library/react';
import WorkstreamFilterDemo from '../page';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Workstream Filter Demo Page', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        
        // Default successful responses
        mockFetch.mockImplementation((url) => {
            if (url.includes('/api/demo-loops')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([])
                });
            }
            if (url.includes('/api/system-docs?file=roadmap.md')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        fileList: [],
                        selectedFile: {
                            content: '<h1>Roadmap</h1><p>Test roadmap content</p>',
                            rawContent: '# Roadmap\n\nTest roadmap content'
                        }
                    })
                });
            }
            return Promise.reject(new Error('Unknown endpoint'));
        });
    });

    test('renders page title and description', async () => {
        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText('Workstream Filter Demo')).toBeInTheDocument();
        });
        
        expect(screen.getByText(/Canonical Schema Hierarchical Filtering/)).toBeInTheDocument();
        expect(screen.getByText(/Workstream.*Program.*Project.*Task/)).toBeInTheDocument();
    });

    test('renders roadmap section', async () => {
        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/System Roadmap/)).toBeInTheDocument();
        });

        expect(screen.getByText(/Reference roadmap showing current phase progress/)).toBeInTheDocument();
    });

    test('renders filter controls', async () => {
        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/Canonical Schema Hierarchical Filters/)).toBeInTheDocument();
        });

        // Check for filter labels in form elements
        expect(screen.getAllByText('Workstream').length).toBeGreaterThan(0);
        expect(screen.getByText('Program (Phase)')).toBeInTheDocument();
        expect(screen.getByText('Project')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    test('renders artefacts section', async () => {
        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/Total:/)).toBeInTheDocument();
        });

        expect(screen.getAllByText(/artefacts/).length).toBeGreaterThan(0);
    });

    test('handles loading state', () => {
        render(<WorkstreamFilterDemo />);
        
        expect(screen.getByText(/Loading canonical artefacts/)).toBeInTheDocument();
    });

    test('handles API error gracefully', async () => {
        mockFetch.mockImplementation(() => 
            Promise.resolve({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'Server error' })
            })
        );

        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/Error.*Failed to load/)).toBeInTheDocument();
        });
    });

    test('displays empty state when no artefacts', async () => {
        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/0.*artefacts/)).toBeInTheDocument();
        });

        expect(screen.getByText(/Workstreams:/)).toBeInTheDocument();
        expect(screen.getByText('0', { selector: 'strong' })).toBeInTheDocument();
    });

    test('displays summary statistics', async () => {
        mockFetch.mockImplementation((url) => {
            if (url.includes('/api/demo-loops')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([
                        {
                            id: 'test1',
                            uuid: 'test-uuid-1234-5678',
                            filePath: 'runtime/loops/test1.md',
                            workstream: 'workstream-ui',
                            phase: 'phase-11-1',
                            status: 'complete'
                        },
                        {
                            id: 'test2',
                            uuid: 'test-uuid-abcd-efgh',
                            filePath: 'runtime/loops/test2.md',
                            workstream: 'system-integrity',
                            phase: 'phase-10-2',
                            status: 'in_progress'
                        }
                    ])
                });
            }
            if (url.includes('/api/system-docs?file=roadmap.md')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        fileList: [],
                        selectedFile: {
                            content: '<h1>Roadmap</h1><p>Test roadmap content</p>',
                            rawContent: '# Roadmap\n\nTest roadmap content'
                        }
                    })
                });
            }
            return Promise.reject(new Error('Unknown endpoint'));
        });

        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/Total:/)).toBeInTheDocument();
            expect(screen.getByText('2', { selector: 'strong' })).toBeInTheDocument();
        });

        expect(screen.getByText(/Filtered:/)).toBeInTheDocument();
        expect(screen.getByText(/Workstreams:/)).toBeInTheDocument();
        expect(screen.getByText(/Programs:/)).toBeInTheDocument();
    });

    test('renders collapsible roadmap content', async () => {
        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/Click to expand/)).toBeInTheDocument();
        });
    });

    test('handles network errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        render(<WorkstreamFilterDemo />);
        
        await waitFor(() => {
            expect(screen.getByText(/Error.*Network error/)).toBeInTheDocument();
        });
    });
}); 