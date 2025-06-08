import path from 'path';

/**
 * Robust path resolution for the Ora system
 * Searches upward from the current working directory to find the project root
 */
function findProjectRoot(): string {
    let currentDir = process.cwd();
    
    // Look for indicators that we're at the project root
    while (currentDir !== path.dirname(currentDir)) {
        // Check for runtime directory existence (most reliable indicator)
        try {
            const fs = require('fs');
            const runtimePath = path.join(currentDir, 'runtime');
            fs.accessSync(runtimePath);
            return currentDir;
        } catch {
            // Continue searching
        }
        
        // Check for package.json with "ora-system" name
        try {
            const fs = require('fs');
            const packageJsonPath = path.join(currentDir, 'package.json');
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonContent);
            if (packageJson.name === 'ora-system') {
                return currentDir;
            }
        } catch {
            // Continue searching
        }
        
        currentDir = path.dirname(currentDir);
    }
    
    // Fallback to the hardcoded path if not found
    console.warn('Could not find project root, falling back to relative path');
    return path.resolve(process.cwd(), '../../..');
}

// Cache the project root to avoid repeated filesystem calls
const PROJECT_ROOT = findProjectRoot();

export const PATHS = {
    PROJECT_ROOT,
    RUNTIME_DIR: path.join(PROJECT_ROOT, 'runtime'),
    LOOPS_DIR: path.join(PROJECT_ROOT, 'runtime', 'loops'),
    PHASES_DIR: path.join(PROJECT_ROOT, 'runtime', 'phases'),
    WORKSTREAMS_DIR: path.join(PROJECT_ROOT, 'runtime', 'workstreams'),
    PLAN_PATH: path.join(PROJECT_ROOT, 'runtime', 'workstreams', 'roadmap', 'workstream_plan.md'),
    BACKUP_DIR: path.join(PROJECT_ROOT, 'runtime', 'backups'),
    ROADMAP_YAML_PATH: path.join(PROJECT_ROOT, 'runtime', 'system_roadmap.yaml'),
} as const;

export function getProjectPath(...segments: string[]): string {
    return path.join(PROJECT_ROOT, ...segments);
}

export function getRuntimePath(...segments: string[]): string {
    return path.join(PATHS.RUNTIME_DIR, ...segments);
} 