#!/usr/bin/env node

/**
 * Batch Artefact Scaffolding System
 * 
 * Parses roadmap.md for Project 12.4 tasks and creates canonical artefact markdown files
 * with comprehensive frontmatter, required sections, and roadmap context integration.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// --- Configuration ---
const LOOPS_DIR = path.join(process.cwd(), 'runtime', 'loops');
const ROADMAP_PATH = path.join(process.cwd(), 'runtime', 'docs', 'roadmap.md');

const PROJECT_TARGET = "12.4";
const PROJECT_NAME = "Automated Artefact File Creation & Mutation Syncing";
const PROGRAM_NAME = "Phase 12 – Administration & Governance";
const WORKSTREAM = "Ora";

// --- UUID Generation ---
function generateUUID() {
  return crypto.randomUUID();
}

// --- Roadmap Parsing ---
async function parseRoadmapForProject124() {
  const roadmapContent = await fs.readFile(ROADMAP_PATH, 'utf-8');
  const tasks = [];

  // Parse Project 12.4 section
  const project124Match = roadmapContent.match(
    /Project 12\.4: Automated Artefact File Creation & Mutation Syncing[\s\S]*?(?=\s+- Project|\s+### Phase|\s+## |$)/i
  );

  if (!project124Match) {
    throw new Error('Project 12.4 not found in roadmap.md');
  }

  const project124Section = project124Match[0];

  // Extract tasks using regex
  const taskRegex = /- Task (12\.4\.\d+): ([^\n]+)\s+- Description: ([^\n]+)/g;
  let match;
  
  while ((match = taskRegex.exec(project124Section)) !== null) {
    const [, taskId, title, description] = match;
    
    tasks.push({
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      status: 'planning',
      phase: taskId,
      program: PROGRAM_NAME,
      project: PROJECT_NAME,
      workstream: WORKSTREAM
    });
  }

  return tasks;
}

// --- Artefact Generation ---
function generateArtefactTemplate(task) {
  const uuid = generateUUID();
  const today = new Date().toISOString().split('T')[0];
  const shortTitle = task.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);
  
  const filename = `loop-${today}-${task.id.replace(/\./g, '-')}-${shortTitle}.md`;

  const frontmatter = {
    uuid,
    title: `Task ${task.id}: ${task.title}`,
    phase: task.phase,
    workstream: task.workstream,
    program: task.program,
    project: task.project,
    status: task.status,
    type: 'execution',
    tags: ['automation', 'artefact-creation', 'system-integration', 'mutation-syncing'],
    score: 0,
    created: today,
    owner: 'System',
    priority: 'medium'
  };

  const frontmatterYaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `'${v}'`).join(', ')}]`;
      } else if (typeof value === 'string') {
        return `${key}: '${value}'`;
      } else {
        return `${key}: ${value}`;
      }
    })
    .join('\n');

  const content = `## ✅ Objectives

${task.description}

**Key Deliverables:**
- Implement ${task.title.toLowerCase()}
- Ensure full integration with existing mutation infrastructure
- Provide comprehensive logging and audit trails
- Test end-to-end functionality and error handling
- Document implementation and provide usage examples

## 🔢 Tasks

- [ ] Analyze requirements and existing system architecture
- [ ] Design implementation approach and integration points
- [ ] Implement core functionality with error handling
- [ ] Create comprehensive test suite for validation
- [ ] Update system documentation and user guides
- [ ] Conduct integration testing with existing workflows
- [ ] Deploy and validate in production environment

## 🧾 Execution Log

- ${today}: Task artefact scaffolded via automated batch creation system
- Status: ${task.status} - Ready for development and implementation

## 🧠 Memory Trace

- **Context**: Part of Project ${PROJECT_TARGET} (${PROJECT_NAME})
- **Program**: ${PROGRAM_NAME}
- **Workstream**: ${WORKSTREAM}
- **Integration Points**: 
  - Roadmap.md synchronization system
  - Artefact file creation and management
  - Mutation tracking and audit infrastructure
  - UI/API integration for real-time updates

## 🌐 System Context

**Project Overview**: ${PROJECT_NAME}
This task is part of a comprehensive system to automate artefact lifecycle management, ensuring seamless synchronization between roadmap planning and actual implementation artifacts.

**Dependencies**:
- Canonical artefact schema (from Phase 11.1)
- Mutation infrastructure (from Phase 11.2)
- Roadmap parsing system (from Phase 11.3)

**Success Criteria**:
- Automated artefact creation on task/project creation
- Bidirectional sync between roadmap.md and artefact files
- Comprehensive orphan detection and remediation
- System integrity validation and recovery mechanisms`;

  const fullContent = `---\n${frontmatterYaml}\n---\n\n${content}`;

  return {
    task,
    filename,
    frontmatter,
    content,
    fullContent
  };
}

// --- File Operations ---
async function checkExistingArtefacts(tasks) {
  const existingFiles = await fs.readdir(LOOPS_DIR);
  
  return tasks.filter(task => {
    // Check if any existing file references this task
    const taskIdPattern = task.id.replace(/\./g, '[.-]');
    const regex = new RegExp(`(${taskIdPattern}|${task.id})`, 'i');
    
    return !existingFiles.some(file => regex.test(file));
  });
}

async function createArtefactFiles(templates) {
  console.log(`\n🔧 Creating ${templates.length} artefact files...`);
  
  for (const template of templates) {
    const filePath = path.join(LOOPS_DIR, template.filename);
    await fs.writeFile(filePath, template.fullContent, 'utf-8');
    console.log(`✅ Created: ${template.filename}`);
  }
}

// --- Execution Log Update ---
async function updateExecutionLog(templates) {
  const roadmapContent = await fs.readFile(ROADMAP_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  
  const logEntry = `- [${today}] Batch Artefact Scaffolding: Created ${templates.length} artefact files for Project 12.4 tasks via automated batch scaffold system. Files: ${templates.map(t => t.filename).join(', ')}. Initiator: cursor:ora:task:12-4-1-batch-artifact-scaffold. Status: All artefacts ready for development.`;
  
  // Find the execution prompts log section for Project 12.4
  const updatedContent = roadmapContent.replace(
    /(#### Execution Prompts Log\s*- \[Leave this section blank; to be filled as new Cursor execution prompts are issued during project execution\.\])/,
    `$1\n${logEntry}`
  );
  
  await fs.writeFile(ROADMAP_PATH, updatedContent, 'utf-8');
  console.log(`📝 Updated roadmap.md execution log`);
}

// --- Interactive Approval System ---
function createApprovalInterface(templates) {
  console.log('\n📝 PREVIEW: Files to be created:');
  console.log('==========================================');
  
  templates.forEach((template, index) => {
    console.log(`\n${index + 1}. ${template.filename}`);
    console.log(`   Task: ${template.task.id} - ${template.task.title}`);
    console.log(`   Status: ${template.task.status}`);
    console.log(`   Description: ${template.task.description}`);
    console.log(`   UUID: ${template.frontmatter.uuid}`);
  });
  
  console.log('\n==========================================');
  console.log(`\nTotal files to create: ${templates.length}`);
  console.log(`Target directory: ${LOOPS_DIR}`);
  
  return {
    totalFiles: templates.length,
    targetDirectory: LOOPS_DIR,
    templates: templates
  };
}

// --- Main Execution ---
async function main() {
  try {
    console.log('🚀 Starting Batch Artefact Scaffolding for Project 12.4\n');
    
    // 1. Parse roadmap for Project 12.4 tasks
    console.log('📖 Parsing roadmap.md for Project 12.4 tasks...');
    const allTasks = await parseRoadmapForProject124();
    console.log(`Found ${allTasks.length} tasks in Project 12.4`);
    
    if (allTasks.length === 0) {
      console.log('⚠️  No tasks found in Project 12.4. Please check roadmap.md format.');
      return;
    }
    
    // Show found tasks
    console.log('\n📋 Found tasks:');
    allTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.id}: ${task.title}`);
    });
    
    // 2. Check for existing artefacts
    console.log('\n🔍 Checking for existing artefact files...');
    const tasksNeedingArtefacts = await checkExistingArtefacts(allTasks);
    console.log(`${tasksNeedingArtefacts.length} tasks need artefact files created`);
    
    if (tasksNeedingArtefacts.length === 0) {
      console.log('✅ All Project 12.4 tasks already have artefact files!');
      return;
    }
    
    // 3. Generate artefact templates
    console.log('\n📋 Generating artefact templates...');
    const templates = tasksNeedingArtefacts.map(generateArtefactTemplate);
    
    // 4. Show approval interface
    const approvalInfo = createApprovalInterface(templates);
    
    // 5. Check for auto-approval
    const autoApprove = process.argv.includes('--auto-approve') || process.env.AUTO_APPROVE === 'true';
    
    if (!autoApprove) {
      console.log('\n⚠️  APPROVAL REQUIRED:');
      console.log('This will create artefact files and update roadmap.md execution log.');
      console.log('To proceed automatically, run with --auto-approve flag:');
      console.log('   node scripts/batch-artifact-scaffold.js --auto-approve');
      console.log('\n⏸️  Execution paused. Review the preview above and re-run with --auto-approve to proceed.');
      return;
    }
    
    // 6. Create artefact files
    console.log('\n✅ Auto-approval enabled. Proceeding with file creation...');
    await createArtefactFiles(templates);
    
    // 7. Update execution log
    await updateExecutionLog(templates);
    
    console.log('\n🎉 Batch Artefact Scaffolding Complete!');
    console.log(`✅ Created ${templates.length} artefact files`);
    console.log('✅ Updated roadmap.md execution log');
    console.log('\n📍 Next Steps:');
    console.log('   1. Review created artefact files in runtime/loops/');
    console.log('   2. Update task statuses as development progresses');
    console.log('   3. Add specific implementation details to each artefact');
    console.log('   4. Ensure proper integration with existing systems');
    console.log('\n📂 Created files:');
    templates.forEach(template => {
      console.log(`   - ${template.filename}`);
    });
    
  } catch (error) {
    console.error('❌ Error during batch artefact scaffolding:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { 
  parseRoadmapForProject124, 
  generateArtefactTemplate, 
  checkExistingArtefacts,
  createArtefactFiles,
  updateExecutionLog,
  createApprovalInterface
}; 