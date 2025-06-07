// Client-side schema validation utility for markdown files
// This mirrors the server-side validateMarkdownSchema from mutation-engine.ts

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    missingRequiredSections: string[];
    duplicatedSections: string[];
}

export interface SchemaValidationOptions {
    requiredSections?: string[];
    logErrors?: boolean;
}

// Default sections for loop files
export const DEFAULT_LOOP_SECTIONS = [
    '## Purpose',
    '## ✅ Objectives',
    '## 🔧 Tasks',
    '## 🧾 Execution Log',
    '## 🧠 Memory Trace'
];

// Default sections for phase files
export const DEFAULT_PHASE_SECTIONS = [
    '## ✅ Completed Loops',
    '## 🏁 Phase Complete'
];

/**
 * Validates markdown content against required schema sections
 * @param content - The markdown content to validate
 * @param options - Validation options including required sections
 * @returns ValidationResult with detailed error information
 */
export function validateMarkdownSchema(
    content: string, 
    options: SchemaValidationOptions = {}
): ValidationResult {
    const { 
        requiredSections = DEFAULT_LOOP_SECTIONS,
        logErrors = true 
    } = options;

    const errors: string[] = [];
    const missingRequiredSections: string[] = [];
    const duplicatedSections: string[] = [];
    const sectionsFound: Record<string, number> = {};

    // Count occurrences of each section
    for (const section of requiredSections) {
        const regex = new RegExp(`^${section.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'gm');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;
        sectionsFound[section] = count;

        if (count === 0) {
            missingRequiredSections.push(section);
            errors.push(`Missing required section: "${section}"`);
        } else if (count > 1) {
            duplicatedSections.push(section);
            errors.push(`Duplicated section: "${section}" (found ${count} times)`);
        }
    }

    const isValid = errors.length === 0;

    if (!isValid && logErrors) {
        console.warn(`Schema validation failed:`, {
            errors,
            missingRequiredSections,
            duplicatedSections,
            sectionsFound
        });
    }

    return {
        isValid,
        errors,
        missingRequiredSections,
        duplicatedSections
    };
}

/**
 * Validates a loop file specifically
 * @param content - Loop file content
 * @param filePath - Optional file path for logging
 * @returns ValidationResult
 */
export function validateLoopSchema(content: string, filePath?: string): ValidationResult {
    const result = validateMarkdownSchema(content, {
        requiredSections: DEFAULT_LOOP_SECTIONS,
        logErrors: true
    });

    if (!result.isValid && filePath) {
        console.error(`Loop schema validation failed for ${filePath}:`, result.errors);
    }

    return result;
}

/**
 * Validates a phase file specifically
 * @param content - Phase file content
 * @param filePath - Optional file path for logging
 * @returns ValidationResult
 */
export function validatePhaseSchema(content: string, filePath?: string): ValidationResult {
    const result = validateMarkdownSchema(content, {
        requiredSections: DEFAULT_PHASE_SECTIONS,
        logErrors: true
    });

    if (!result.isValid && filePath) {
        console.error(`Phase schema validation failed for ${filePath}:`, result.errors);
    }

    return result;
}

/**
 * Creates a user-friendly error message for display in UI
 * @param validation - ValidationResult from schema validation
 * @param fileType - Type of file being validated (for context)
 * @returns Formatted error message
 */
export function formatValidationError(
    validation: ValidationResult, 
    fileType: string = 'file'
): string {
    if (validation.isValid) return '';

    let message = `⚠️ ${fileType} structure is incomplete:\n`;
    
    if (validation.missingRequiredSections.length > 0) {
        message += `\nMissing sections:\n${validation.missingRequiredSections.map(s => `• ${s}`).join('\n')}`;
    }
    
    if (validation.duplicatedSections.length > 0) {
        message += `\nDuplicated sections:\n${validation.duplicatedSections.map(s => `• ${s}`).join('\n')}`;
    }

    return message;
}

/**
 * React hook for schema validation with caching
 * @param content - Content to validate
 * @param requiredSections - Required sections array
 * @returns ValidationResult
 */
export function useSchemaValidation(
    content: string, 
    requiredSections: string[] = DEFAULT_LOOP_SECTIONS
): ValidationResult {
    // Simple memoization based on content hash
    const contentHash = content.length + content.slice(0, 100);
    
    // In a real implementation, you might use React.useMemo here
    return validateMarkdownSchema(content, { requiredSections });
} 