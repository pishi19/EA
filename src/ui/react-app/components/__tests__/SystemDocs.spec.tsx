import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SystemDocs from '../SystemDocs';

// Mock data
const mockFileList = [
    {
        filename: 'system-design.md',
        friendlyName: 'System Design',
        size: 1024,
        modified: '2023-12-13T10:30:00.000Z',
        title: 'System Design Document',
        tags: ['system', 'architecture']
    },
    {
        filename: 'roadmap.md',
        friendlyName: 'Roadmap',
        size: 2048,
        modified: '2023-12-12T15:45:00.000Z',
        title: 'Project Roadmap',
        tags: ['planning', 'roadmap']
    }
];

const mockSelectedFile = {
    ...mockFileList[0],
    metadata: { title: 'System Design Document', tags: ['system', 'architecture'] },
    content: '<h1>System Design</h1><p>This is the system design document.</p>',
    rawContent: '# System Design\n\nThis is the system design document.'
};

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL for download functionality
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
Object.defineProperty(window.URL, 'createObjectURL', {
    value: mockCreateObjectURL,
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
    value: mockRevokeObjectURL,
});

describe('SystemDocs Component', () => {
    beforeEach(() => {
        mockCreateObjectURL.mockClear();
        mockRevokeObjectURL.mockClear();
        mockFetch.mockClear();
        
        // Default successful response
        mockFetch.mockImplementation((url) => {
            const urlObj = new URL(url);
            const file = urlObj.searchParams.get('file');
            
            if (file) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        fileList: mockFileList,
                        selectedFile: mockSelectedFile
                    })
                });
            } else {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        fileList: mockFileList,
                        selectedFile: null
                    })
                });
            }
        });
    });

    test('renders loading state initially', () => {
        render(<SystemDocs />);
        expect(screen.getByText('Loading system documentation...')).toBeInTheDocument();
    });

    test('renders file list after loading', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('System Documentation')).toBeInTheDocument();
        });

        expect(screen.getByText('System Design')).toBeInTheDocument();
        expect(screen.getByText('Roadmap')).toBeInTheDocument();
        expect(screen.getByText('2 documents available')).toBeInTheDocument();
    });

    test('displays file metadata correctly', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('System Design')).toBeInTheDocument();
        });

        // Check file sizes and dates are formatted correctly
        expect(screen.getByText('1 KB')).toBeInTheDocument();
        expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    test('auto-selects first file and displays content', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('System Design Document')).toBeInTheDocument();
        });

        // Should display the markdown content
        expect(screen.getByText('System Design')).toBeInTheDocument();
    });

    test('file selection from dropdown works', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('System Documentation')).toBeInTheDocument();
        });

        // Find and click the select dropdown
        const selectTrigger = screen.getByRole('combobox');
        fireEvent.click(selectTrigger);

        // Wait for dropdown options to appear and select different file
        await waitFor(() => {
            expect(screen.getByText('Roadmap')).toBeInTheDocument();
        });
    });

    test('file selection from sidebar works', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('All Documents')).toBeInTheDocument();
        });

        // Find roadmap file in sidebar and click it
        const roadmapButton = screen.getAllByText('Roadmap')[0];
        fireEvent.click(roadmapButton);

        // Should trigger a new API call for roadmap.md
        await waitFor(() => {
            expect(screen.getByText('System Design Document')).toBeInTheDocument();
        });
    });

    test('download functionality works', async () => {
        // Mock document methods for download
        const mockAppendChild = jest.fn();
        const mockRemoveChild = jest.fn();
        const mockClick = jest.fn();
        
        const mockElement = {
            href: '',
            download: '',
            click: mockClick
        };
        
        jest.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
        jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
        jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
        
        mockCreateObjectURL.mockReturnValue('mock-blob-url');

        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('Download')).toBeInTheDocument();
        });

        const downloadButton = screen.getByText('Download');
        fireEvent.click(downloadButton);

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRemoveChild).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });

    test('displays tags correctly', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('system')).toBeInTheDocument();
        });

        expect(screen.getByText('architecture')).toBeInTheDocument();
    });

    test('handles API error gracefully', async () => {
        // Mock server error
        mockFetch.mockImplementation(() => 
            Promise.resolve({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'Server error' })
            })
        );

        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText(/Error: Failed to fetch system documentation/)).toBeInTheDocument();
        });
    });

    test('handles empty file list', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    fileList: [],
                    selectedFile: null
                })
            })
        );

        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('0 documents available')).toBeInTheDocument();
        });
    });

    test('shows placeholder when no file selected', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    fileList: mockFileList,
                    selectedFile: null
                })
            })
        );

        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('Select a document from the list to view its content')).toBeInTheDocument();
        });
    });

    test('formats file sizes correctly', async () => {
        const largeFileList = [
            {
                filename: 'large.md',
                friendlyName: 'Large File',
                size: 1024 * 1024 * 2.5, // 2.5 MB
                modified: '2023-12-13T10:30:00.000Z',
                title: 'Large File',
                tags: []
            }
        ];

        mockFetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    fileList: largeFileList,
                    selectedFile: null
                })
            })
        );

        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('2.5 MB')).toBeInTheDocument();
        });
    });

    test('formats dates correctly', async () => {
        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText(/Dec 13, 2023/)).toBeInTheDocument();
        });
    });

    test('handles file content fetch error', async () => {
        mockFetch.mockImplementation((url) => {
            const urlObj = new URL(url);
            const file = urlObj.searchParams.get('file');
            
            if (!file) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        fileList: mockFileList,
                        selectedFile: null
                    })
                });
            } else {
                // File content request fails
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    json: () => Promise.resolve({ message: 'File not found' })
                });
            }
        });

        render(<SystemDocs />);
        
        await waitFor(() => {
            expect(screen.getByText('System Documentation')).toBeInTheDocument();
        });

        // Should handle the error when auto-selecting first file
        await waitFor(() => {
            expect(screen.getByText(/Error.*Failed to load file content/)).toBeInTheDocument();
        });
    });
}); 