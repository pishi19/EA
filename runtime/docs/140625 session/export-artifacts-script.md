# Export Artifacts Script

Save this as `export-artifacts.js` in your project root:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of artifact IDs to filenames and content
// You'll need to copy the content from each artifact in our chat
const artifacts = {
  'ora-development-moc': {
    filename: 'ORA_DEVELOPMENT_MOC.md',
    content: `# Ora Development - Map of Content (MOC)
[Copy the full MOC content here]`
  },
  
  'ora-roadmap-constitution': {
    filename: 'constitution/ora-roadmap-constitution.md',
    content: `# Ora Platform Roadmap & Constitution
[Copy the full content from the artifact]`
  },
  
  'ora-constitutional-goal-supabase': {
    filename: 'constitution/ora-constitutional-okrs.md',
    content: `# Ora Constitutional OKRs & Supabase Evolution
[Copy the full content from the artifact]`
  },
  
  'complete-claude-code-prompt': {
    filename: 'prompts/complete-claude-code-prompt.md',
    content: `# Complete Claude Code Prompt for Building Ora
[Copy the full content from the artifact]`
  },
  
  'ora-database-schema': {
    filename: 'design/ora-database-schema.sql',
    content: `-- Ora Database Schema (PostgreSQL/Supabase-Ready)
[Copy the full content from the artifact]`
  },
  
  'workstream-contract-schema': {
    filename: 'design/workstream-contract-schema.md',
    content: `# Workstream Contract Schema - Working Document
[Copy the full content from the artifact]`
  },
  
  'ora-emergent-roadmap': {
    filename: 'strategy/ora-emergent-roadmap.md',
    content: `# Ora Emergent Roadmap - From Creation Forward
[Copy the full content from the artifact]`
  },
  
  'ora-build-methodology': {
    filename: 'process/ora-build-methodology.md',
    content: `# Ora Systematic Build Methodology
[Copy the full content from the artifact]`
  }
};

// Create docs directory structure
const docsDir = path.join(__dirname, 'docs', 'ora-development');
const subdirs = ['constitution', 'prompts', 'design', 'strategy', 'process'];

// Create directories
function createDirectories() {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  subdirs.forEach(subdir => {
    const dir = path.join(docsDir, subdir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Export artifacts to files
function exportArtifacts() {
  Object.entries(artifacts).forEach(([id, { filename, content }]) => {
    const filepath = path.join(docsDir, filename);
    
    // Skip if content hasn't been filled in
    if (content.includes('[Copy the full content')) {
      console.log(`⏭️  Skipping ${filename} - content needs to be added`);
      return;
    }
    
    fs.writeFileSync(filepath, content);
    console.log(`✅ Exported ${filename}`);
  });
}

// Create index file
function createIndex() {
  const indexContent = `# Ora Development Documentation

This directory contains all documentation for the Ora platform development.

## Quick Start
- See [ORA_DEVELOPMENT_MOC.md](./ORA_DEVELOPMENT_MOC.md) for complete navigation

## Directory Structure
- \`/constitution\` - Ora's foundational documents
- \`/prompts\` - Claude Code and Cursor prompts  
- \`/design\` - System design and schemas
- \`/strategy\` - Development strategy documents
- \`/process\` - Build methodologies and workflows

## Key Documents
1. [Ora Constitutional OKRs](./constitution/ora-constitutional-okrs.md)
2. [Complete Claude Code Prompt](./prompts/complete-claude-code-prompt.md)
3. [Ora Database Schema](./design/ora-database-schema.sql)

Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(docsDir, 'README.md'), indexContent);
  console.log('✅ Created README.md index');
}

// Main execution
console.log('🚀 Exporting Ora artifacts...\n');
createDirectories();
exportArtifacts();
createIndex();
console.log('\n✨ Export complete! Check docs/ora-development/');
console.log('\n📝 Note: You need to copy artifact content from the chat to complete the export');
```

## How to Use This Script

1. **Save the script** as `export-artifacts.js` in your project root

2. **For each artifact**, you'll need to:
   - Find it in our chat
   - Click to view the full content
   - Copy the content
   - Replace the placeholder in the script

3. **Run the script**:
   ```bash
   node export-artifacts.js
   ```

4. **Result structure**:
   ```
   docs/ora-development/
   ├── README.md
   ├── ORA_DEVELOPMENT_MOC.md
   ├── constitution/
   │   ├── ora-roadmap-constitution.md
   │   └── ora-constitutional-okrs.md
   ├── prompts/
   │   └── complete-claude-code-prompt.md
   ├── design/
   │   ├── ora-database-schema.sql
   │   └── workstream-contract-schema.md
   ├── strategy/
   │   └── ora-emergent-roadmap.md
   └── process/
       └── ora-build-methodology.md
   ```

## Alternative: Quick Bash Script

If you prefer a simpler approach:

```bash
#!/bin/bash
# save as export-ora-docs.sh

mkdir -p docs/ora-development/{constitution,prompts,design,strategy,process}

echo "📁 Created directory structure"
echo "📝 Now manually save each artifact to its location:"
echo ""
echo "docs/ora-development/"
echo "  - ORA_DEVELOPMENT_MOC.md"
echo "  - constitution/ora-constitutional-okrs.md"
echo "  - prompts/complete-claude-code-prompt.md"
echo "  - design/ora-database-schema.sql"
echo "  - etc..."
```

The JavaScript version is more automated but requires copying content. The bash version just creates the structure for manual export. Which approach do you prefer?