import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE_PATH = path.resolve(__dirname, '../../runtime/logs/loop-2025-09-03-runtime-path-audit.md');
const BASE_DIR = path.resolve(__dirname, '../../'); // Assuming script is in src/scripts, this should be project root

const DIRS_TO_CHECK = [
    'runtime/workstreams/roadmap/',
    'runtime/workstreams/roadmap/programs/ui-refactor/projects/phase-10-1/tasks/',
    'runtime/loops/',
    'runtime/phases/'
];

const FILES_TO_CHECK = [
    'runtime/workstreams/roadmap/workstream_plan.md'
];

const API_ROUTES_TO_AUDIT = [
    'src/ui/react-app/app/api/tasks/route.ts',
    'src/ui/react-app/app/api/plan-tasks/route.ts',
    'src/ui/react-app/app/api/promote-task/route.ts',
    'src/ui/react-app/app/api/project-task-files/route.ts',
    'src/ui/react-app/app/api/loops/route.ts',
];

// --- Logger ---
const log_entries: string[] = [];
const logger = {
    info: (message: string) => log_entries.push(`[INFO] ${message}`),
    pass: (message: string) => log_entries.push(`[PASS] ✅ ${message}`),
    fail: (message: string, suggestion: string) => log_entries.push(`[FAIL] ❌ ${message}\n   👉 **Suggestion:** ${suggestion}`),
    header: (message: string) => log_entries.push(`\n## ${message}\n`),
};


// --- Validation Functions ---

async function checkDirectories() {
    logger.header('Directory Verification');
    for (const dir of DIRS_TO_CHECK) {
        const fullPath = path.join(BASE_DIR, dir);
        try {
            await fs.access(fullPath);
            logger.pass(`Directory exists: ${dir}`);
        } catch {
            logger.fail(`Directory missing: ${dir}`, `Create the directory at '${fullPath}'.`);
        }
    }
}

async function checkFiles() {
    logger.header('File Verification');
    for (const file of FILES_TO_CHECK) {
        const fullPath = path.join(BASE_DIR, file);
        try {
            await fs.readFile(fullPath, 'utf-8');
            logger.pass(`File exists and is readable: ${file}`);
        } catch {
            logger.fail(`File missing or unreadable: ${file}`, `Ensure the file exists at '${fullPath}' and has read permissions.`);
        }
    }
    // Specific checks for special files
    await checkLoopFiles();
    // await checkTaskFiles(); // No task-*.md files yet
    await checkActivePhaseFile();
}

async function checkLoopFiles() {
    const loopsDir = path.join(BASE_DIR, 'runtime/loops/');
    try {
        const files = await fs.readdir(loopsDir);
        const loopFiles = files.filter(f => f.startsWith('loop-') && f.endsWith('.md'));
        if (loopFiles.length > 0) {
            logger.pass(`Found ${loopFiles.length} loop file(s) in /runtime/loops/.`);
            // Validate content of the first loop file found
            const loopFileContent = await fs.readFile(path.join(loopsDir, loopFiles[0]), 'utf-8');
            if (!loopFileContent.includes('## 🔧 Tasks')) {
                logger.fail(`Loop file '${loopFiles[0]}' is missing '## 🔧 Tasks' section.`, 'Add the section header to the file.');
            }
            if (!loopFileContent.includes('## 🧾 Execution Log')) {
                logger.fail(`Loop file '${loopFiles[0]}' is missing '## 🧾 Execution Log' section.`, 'Add the section header to the file.');
            }
        } else {
            logger.fail('No loop-*.md files found in /runtime/loops/.', 'Create at least one loop file (e.g., loop-main.md).');
        }
    } catch {
        logger.fail('Could not read /runtime/loops/ directory.', 'Ensure the directory exists.');
    }
}

async function checkActivePhaseFile() {
    const phasesDir = path.join(BASE_DIR, 'runtime/phases/');
     try {
        const files = await fs.readdir(phasesDir);
        const phaseFiles = files.filter(f => f.startsWith('phase-') && f.endsWith('.md'));
        let foundActive = false;
        for (const file of phaseFiles) {
            const content = await fs.readFile(path.join(phasesDir, file), 'utf-8');
            const { data } = matter(content);
            if (data.status === 'in_progress') {
                logger.pass(`Found active phase file: ${file}`);
                foundActive = true;
                break;
            }
        }
        if (!foundActive) {
            logger.fail('No active phase file found.', 'Set one phase-*.md file to have `status: in_progress` in its frontmatter.');
        }
    } catch {
        logger.fail('Could not read /runtime/phases/ directory.', 'Ensure the directory exists.');
    }
}

async function checkApiRoutes() {
    logger.header('API Route Configuration Audit');
    const expectedDef = `path.resolve(process.cwd(), '../../..')`;

    for (const routeFile of API_ROUTES_TO_AUDIT) {
        const fullPath = path.join(BASE_DIR, routeFile);
        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (content.includes(expectedDef)) {
                logger.pass(`BASE_DIR is correctly defined in ${routeFile}`);
            } else {
                logger.fail(`BASE_DIR is incorrectly defined in ${routeFile}`, `Ensure the file contains \`const BASE_DIR = ${expectedDef}\` or similar.`);
            }
        } catch {
            logger.fail(`Could not read API route file: ${routeFile}`, `Ensure file exists at '${fullPath}'.`);
        }
    }
}

async function checkMarkdownSchemas() {
    logger.header('Markdown Schema Validation');
    const planPath = path.join(BASE_DIR, 'runtime/workstreams/roadmap/workstream_plan.md');
    try {
        const content = await fs.readFile(planPath, 'utf-8');
        if (!content.includes('### User-Defined Tasks')) {
             logger.fail(`'${planPath}' is missing '### User-Defined Tasks' header.`, 'Add the required header.');
        }
        if (!content.includes('### Ora-Suggested Tasks')) {
             logger.fail(`'${planPath}' is missing '### Ora-Suggested Tasks' header.`, 'Add the required header.');
        }
         logger.pass(`'${planPath}' contains the required section headers.`);
    } catch {
        logger.fail(`Could not read '${planPath}'.`, 'Ensure the file exists.');
    }
}


// --- Main Execution ---
async function main() {
    logger.header('Ora Runtime Path and Structure Audit');
    await checkDirectories();
    await checkFiles();
    await checkApiRoutes();
    await checkMarkdownSchemas();

    const report = `
# Ora Runtime Audit Log

**Timestamp:** ${new Date().toISOString()}

${log_entries.join('\n')}
`;
    
    try {
        await fs.mkdir(path.dirname(LOG_FILE_PATH), { recursive: true });
        await fs.writeFile(LOG_FILE_PATH, report);
        console.log(`Validation complete. Report saved to ${LOG_FILE_PATH}`);
    } catch (error) {
        console.error(`Failed to write log file: ${error}`);
        console.log(report);
    }
}

main(); 