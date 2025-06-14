import { getRuntimePath, getProjectPath, PATHS } from '../path-utils';
import path from 'path';

// Mock path module properly
jest.mock('path', () => ({
  resolve: jest.fn(),
  join: jest.fn(),
  dirname: jest.fn()
}));

const mockPath = path as jest.Mocked<typeof path>;

describe('Path Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPath.resolve.mockImplementation((...paths) => paths.join('/'));
        mockPath.join.mockImplementation((...paths) => paths.join('/'));
        mockPath.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
        
        // Mock process.cwd() for consistent testing
        jest.spyOn(process, 'cwd').mockReturnValue('/mock/project/root');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getRuntimePath', () => {
        test('returns correct runtime path with filename', () => {
            const result = getRuntimePath('test-file.md');
            expect(result).toContain('runtime');
            expect(result).toContain('test-file.md');
        });

        test('returns correct runtime path with nested filename', () => {
            const result = getRuntimePath('docs/test-file.md');
            expect(result).toContain('runtime');
            expect(result).toContain('docs/test-file.md');
        });

        test('returns correct runtime path with empty filename', () => {
            const result = getRuntimePath('');
            expect(result).toContain('runtime');
        });

        test('handles special characters in filename', () => {
            const result = getRuntimePath('file with spaces & symbols!.md');
            expect(result).toContain('runtime');
            expect(result).toContain('file with spaces & symbols!.md');
        });

        test('handles path separators in filename', () => {
            const result = getRuntimePath('sub/directory/file.md');
            expect(result).toContain('runtime');
            expect(result).toContain('sub/directory/file.md');
        });
    });

    describe('getProjectPath', () => {
        test('returns correct project path with segments', () => {
            const result = getProjectPath('test-file.md');
            expect(result).toContain('test-file.md');
        });

        test('returns correct project path with multiple segments', () => {
            const result = getProjectPath('docs', 'test-file.md');
            expect(result).toContain('docs');
            expect(result).toContain('test-file.md');
        });

        test('handles empty segments', () => {
            const result = getProjectPath();
            expect(typeof result).toBe('string');
        });

        test('handles special characters in segments', () => {
            const result = getProjectPath('file with spaces & symbols!.md');
            expect(result).toContain('file with spaces & symbols!.md');
        });
    });

    describe('PATHS constant', () => {
        test('contains expected path keys', () => {
            expect(PATHS).toBeDefined();
            expect(typeof PATHS).toBe('object');
        });
    });
}); 