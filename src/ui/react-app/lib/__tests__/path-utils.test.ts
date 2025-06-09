import { getRuntimePath, getProjectPath, PATHS } from '../path-utils';
import path from 'path';

// Mock path module
jest.mock('path');
const mockPath = path as jest.Mocked<typeof path>;

describe('Path Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPath.resolve.mockImplementation((...paths) => paths.join('/'));
        mockPath.join.mockImplementation((...paths) => paths.join('/'));
        
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

    describe('PATHS object', () => {
        test('contains required path constants', () => {
            expect(PATHS).toHaveProperty('PROJECT_ROOT');
            expect(PATHS).toHaveProperty('RUNTIME_DIR');
            expect(PATHS).toHaveProperty('LOOPS_DIR');
            expect(PATHS).toHaveProperty('PHASES_DIR');
            expect(PATHS).toHaveProperty('WORKSTREAMS_DIR');
            expect(PATHS).toHaveProperty('PLAN_PATH');
            expect(PATHS).toHaveProperty('BACKUP_DIR');
            expect(PATHS).toHaveProperty('ROADMAP_YAML_PATH');
        });

        test('paths are strings', () => {
            Object.values(PATHS).forEach(pathValue => {
                expect(typeof pathValue).toBe('string');
                expect(pathValue.length).toBeGreaterThan(0);
            });
        });

        test('runtime dir contains runtime', () => {
            expect(PATHS.RUNTIME_DIR).toContain('runtime');
        });

        test('loops dir contains loops', () => {
            expect(PATHS.LOOPS_DIR).toContain('loops');
        });

        test('roadmap yaml path contains yaml', () => {
            expect(PATHS.ROADMAP_YAML_PATH).toContain('.yaml');
        });
    });

    describe('Integration tests', () => {
        test('getRuntimePath uses resolveRelativePath internally', () => {
            // Reset mocks to see actual behavior
            jest.clearAllMocks();
            mockPath.resolve.mockImplementation((...paths) => paths.join('/'));
            
            const result = getRuntimePath('test.md');
            expect(mockPath.resolve).toHaveBeenCalled();
        });

        test('all functions handle edge cases consistently', () => {
            const testCases = ['', '.', '..', '/', '\\', 'normal-file.md'];
            
            testCases.forEach(testCase => {
                expect(() => getRuntimePath(testCase)).not.toThrow();
                expect(() => getProjectPath(testCase)).not.toThrow();
            });
        });
    });
}); 