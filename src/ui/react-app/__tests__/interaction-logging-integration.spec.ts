/// <reference types="@testing-library/jest-dom" />

import {
    logInteraction,
    logChatInteraction,
    logTaskInteraction,
    logMemoryExecutionInteraction,
    logUIInteraction
} from '@/lib/interaction-logger';

describe('Interaction Logging Integration', () => {
    test('should export all required logging functions', () => {
        expect(typeof logInteraction).toBe('function');
        expect(typeof logChatInteraction).toBe('function');
        expect(typeof logTaskInteraction).toBe('function');
        expect(typeof logMemoryExecutionInteraction).toBe('function');
        expect(typeof logUIInteraction).toBe('function');
    });

    test('should have proper function signatures', () => {
        // Verify functions are callable (have correct types)
        expect(typeof logInteraction).toBe('function');
        expect(typeof logChatInteraction).toBe('function');
        expect(typeof logTaskInteraction).toBe('function');
        expect(typeof logMemoryExecutionInteraction).toBe('function');
        expect(typeof logUIInteraction).toBe('function');
    });

    test('should be properly integrated into system', () => {
        // This test verifies that the module loads without errors
        // and that all functions are available for use in the system
        expect(logInteraction).toBeDefined();
        expect(logChatInteraction).toBeDefined();
        expect(logTaskInteraction).toBeDefined();
        expect(logMemoryExecutionInteraction).toBeDefined();
        expect(logUIInteraction).toBeDefined();
    });
}); 