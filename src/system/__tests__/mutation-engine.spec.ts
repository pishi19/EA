import fs from 'fs/promises';
import path from 'path';
import { mutationEngine } from '../mutation-engine';

describe('Mutation Engine Extensions', () => {
    const testDir = path.join(__dirname, '../../../runtime/test-mutations');
    const validLoopFile = path.join(testDir, 'valid-loop.md');
    const invalidLoopFile = path.join(testDir, 'invalid-loop.md');
    const missingLogFile = path.join(testDir, 'missing-log.md');

    beforeAll(async () => {
        // Create test directory
        await fs.mkdir(testDir, { recursive: true });

        // Create a valid loop file
        const validContent = `---
uuid: test-loop
title: Test Loop
phase: 8.2
workstream: test
status: in_progress
---

## Purpose

Test purpose content.

## ✅ Objectives

- [ ] Test objective 1
- [x] Test objective 2

## 🔧 Tasks

Test tasks content.

## 🧾 Execution Log

- 2025-06-07T10:00:00.000Z: 👤 Initial test setup

## 🧠 Memory Trace

Test memory content.
`;

        await fs.writeFile(validLoopFile, validContent, 'utf-8');

        // Create an invalid loop file (missing sections)
        const invalidContent = `---
uuid: invalid-loop
title: Invalid Loop
---

## Purpose

This file is missing required sections.

## 🧾 Execution Log

- 2025-06-07T10:00:00.000Z: 👤 Created invalid file
`;

        await fs.writeFile(invalidLoopFile, invalidContent, 'utf-8');

        // Create a file missing the execution log section
        const missingLogContent = `---
uuid: missing-log-loop
title: Missing Log Loop
---

## Purpose

This file has no execution log section.

## ✅ Objectives

- [ ] Test objective

## 🔧 Tasks

Test tasks.

## 🧠 Memory Trace

Test memory.
`;

        await fs.writeFile(missingLogFile, missingLogContent, 'utf-8');
    });

    afterAll(async () => {
        // Clean up test files
        try {
            await fs.rm(testDir, { recursive: true, force: true });
            console.log('✅ Test cleanup: Deleted test directory');
        } catch (error) {
            console.log('⚠️ Test cleanup failed:', error);
        }
    });

    describe('appendToLog', () => {
        it('should append log entries correctly and preserve format', async () => {
            const logEntry = {
                timestamp: '2025-06-07T12:34:56.789Z',
                actor: 'ora' as const,
                action: 'Completed test mutation'
            };

            await mutationEngine.appendToLog(validLoopFile, logEntry);

            // Read updated content
            const updatedContent = await fs.readFile(validLoopFile, 'utf-8');

            // Verify the log entry was added
            expect(updatedContent).toContain('- 2025-06-07T12:34:56.789Z: 🤖 Completed test mutation');
            expect(updatedContent).toContain('- 2025-06-07T10:00:00.000Z: 👤 Initial test setup');
            
            // Verify original content is preserved
            expect(updatedContent).toContain('## Purpose');
            expect(updatedContent).toContain('Test purpose content.');
            
            console.log('✅ appendToLog correctly appended log entry and preserved format');
        });

        it('should throw error when execution log section is missing', async () => {
            const logEntry = {
                timestamp: '2025-06-07T12:34:56.789Z',
                actor: 'user' as const,
                action: 'Attempted log append'
            };

            await expect(mutationEngine.appendToLog(missingLogFile, logEntry))
                .rejects
                .toThrow('Validation Error: Section "## 🧾 Execution Log" not found');
            
            console.log('✅ appendToLog correctly throws error for missing section');
        });

        it('should format user and ora actors differently', async () => {
            const userEntry = {
                timestamp: '2025-06-07T13:00:00.000Z',
                actor: 'user' as const,
                action: 'User performed action'
            };

            const oraEntry = {
                timestamp: '2025-06-07T13:01:00.000Z',
                actor: 'ora' as const,
                action: 'Ora performed action'
            };

            await mutationEngine.appendToLog(validLoopFile, userEntry);
            await mutationEngine.appendToLog(validLoopFile, oraEntry);

            const content = await fs.readFile(validLoopFile, 'utf-8');
            
            expect(content).toContain('- 2025-06-07T13:00:00.000Z: 👤 User performed action');
            expect(content).toContain('- 2025-06-07T13:01:00.000Z: 🤖 Ora performed action');
            
            console.log('✅ appendToLog correctly formats different actor types');
        });
    });

    describe('validateMarkdownSchema', () => {
        it('should pass validation for valid files with all required sections', async () => {
            await expect(mutationEngine.validateMarkdownSchema(validLoopFile))
                .resolves
                .not.toThrow();
            
            console.log('✅ validateMarkdownSchema passes for valid files');
        });

        it('should throw detailed error for missing sections', async () => {
            await expect(mutationEngine.validateMarkdownSchema(invalidLoopFile))
                .rejects
                .toThrow(/Missing required section.*✅ Objectives.*🔧 Tasks.*🧠 Memory Trace/s);
            
            console.log('✅ validateMarkdownSchema throws detailed error for missing sections');
        });

        it('should use custom required sections when provided', async () => {
            const customSections = ['## Purpose', '## 🧾 Execution Log'];
            
            await expect(mutationEngine.validateMarkdownSchema(invalidLoopFile, customSections))
                .resolves
                .not.toThrow();
            
            console.log('✅ validateMarkdownSchema works with custom required sections');
        });

        it('should throw error for non-existent files', async () => {
            const nonExistentFile = path.join(testDir, 'does-not-exist.md');
            
            await expect(mutationEngine.validateMarkdownSchema(nonExistentFile))
                .rejects
                .toThrow('Validation Error: File not found or unreadable');
            
            console.log('✅ validateMarkdownSchema throws error for non-existent files');
        });
    });

    describe('dryRunMutation', () => {
        it('should show accurate diffs without altering the file', async () => {
            const originalContent = await fs.readFile(validLoopFile, 'utf-8');
            
            const mutationFn = (content: string) => {
                return content.replace('Test purpose content.', 'Modified purpose content.');
            };

            const result = await mutationEngine.dryRunMutation(validLoopFile, mutationFn);
            
            // Verify preImage matches original
            expect(result.preImage).toBe(originalContent);
            
            // Verify postImage contains the change
            expect(result.postImage).toContain('Modified purpose content.');
            expect(result.postImage).not.toContain('Test purpose content.');
            
            // Verify diff is detected
            expect(result.diff).toBe('Content changed');
            
            // Verify original file is unchanged
            const fileContentAfter = await fs.readFile(validLoopFile, 'utf-8');
            expect(fileContentAfter).toBe(originalContent);
            
            console.log('✅ dryRunMutation shows accurate diff without altering file');
        });

        it('should return no diff when content is unchanged', async () => {
            const mutationFn = (content: string) => {
                return content; // No changes
            };

            const result = await mutationEngine.dryRunMutation(validLoopFile, mutationFn);
            
            expect(result.preImage).toBe(result.postImage);
            expect(result.diff).toBeUndefined();
            
            console.log('✅ dryRunMutation correctly reports no diff for unchanged content');
        });

        it('should handle mutation function errors gracefully', async () => {
            const faultyMutationFn = (content: string) => {
                throw new Error('Mutation function failed');
            };

            await expect(mutationEngine.dryRunMutation(validLoopFile, faultyMutationFn))
                .rejects
                .toThrow('Dry Run Error: Mutation function failed');
            
            console.log('✅ dryRunMutation handles mutation function errors gracefully');
        });

        it('should handle non-existent files', async () => {
            const nonExistentFile = path.join(testDir, 'does-not-exist.md');
            const mutationFn = (content: string) => content;

            await expect(mutationEngine.dryRunMutation(nonExistentFile, mutationFn))
                .rejects
                .toThrow('Dry Run Error: Cannot read file');
            
            console.log('✅ dryRunMutation handles non-existent files correctly');
        });
    });
}); 