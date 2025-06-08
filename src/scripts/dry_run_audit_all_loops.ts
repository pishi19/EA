#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Simple YAML parser for basic frontmatter
function parseYaml(yamlString: string): any {
  const lines = yamlString.split('\n');
  const result: any = {};
  let currentKey = '';
  let isMultiLine = false;
  let multiLineValue = '';
  
  for (const line of lines) {
    // Handle multi-line values (|)
    if (isMultiLine) {
      if (line.startsWith('  ') || line.trim() === '') {
        multiLineValue += line.substring(2) + '\n';
        continue;
      } else {
        // End of multi-line, save and continue
        result[currentKey] = multiLineValue.trim();
        isMultiLine = false;
        multiLineValue = '';
      }
    }
    
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      currentKey = key;
      let parsedValue: any = value.trim();
      
      // Handle multi-line indicator
      if (parsedValue === '|') {
        isMultiLine = true;
        multiLineValue = '';
        continue;
      }
      
      // Skip empty values
      if (!parsedValue) {
        continue;
      }
      
      // Ensure parsedValue is a string before processing
      if (typeof parsedValue === 'string' && parsedValue.length > 0) {
        // Remove quotes
        if ((parsedValue.startsWith('"') && parsedValue.endsWith('"')) ||
            (parsedValue.startsWith("'") && parsedValue.endsWith("'"))) {
          parsedValue = parsedValue.slice(1, -1);
        }
        
        // Parse numbers
        if (/^\d+(\.\d+)?$/.test(parsedValue)) {
          parsedValue = parseFloat(parsedValue);
        }
        
        // Parse arrays (simple case)
        if (typeof parsedValue === 'string' && parsedValue.startsWith('[') && parsedValue.endsWith(']')) {
          parsedValue = parsedValue.slice(1, -1).split(',').map((item: string) => item.trim().replace(/^["']|["']$/g, ''));
        }
      }
      
      result[key] = parsedValue;
    }
  }
  
  // Handle final multi-line value
  if (isMultiLine) {
    result[currentKey] = multiLineValue.trim();
  }
  
  return result;
}

interface FrontmatterFields {
  uuid?: string;
  title?: string;
  phase?: string | number;
  workstream?: string;
  score?: number;
  status?: string;
  [key: string]: any; // Allow indexing
}

interface RequiredSection {
  name: string;
  header: string;
  defaultContent: string;
}

interface FileAuditResult {
  filename: string;
  frontmatterStatus: {
    valid: boolean;
    missingFields: string[];
    presentFields: string[];
  };
  structuralSections: {
    present: string[];
    missing: string[];
  };
  dryRunPreviews: {
    section: string;
    preImage: string;
    postImage: string;
    diff: string;
  }[];
  recommendedAction: 'patch' | 'skip' | 'manual_review';
  errors: string[];
}

interface AuditReport {
  timestamp: string;
  totalFiles: number;
  compliantFiles: number;
  nonCompliantFiles: number;
  results: FileAuditResult[];
  summary: {
    mostCommonMissingSections: { [key: string]: number };
    mostCommonMissingFrontmatter: { [key: string]: number };
    patchableFiles: number;
    manualReviewRequired: number;
  };
}

const REQUIRED_FRONTMATTER_FIELDS = ['uuid', 'title', 'phase', 'workstream', 'score', 'status'];

const REQUIRED_SECTIONS: RequiredSection[] = [
  {
    name: 'Objectives',
    header: '## ✅ Objectives',
    defaultContent: '- [ ] Define primary objectives for this loop\n- [ ] Establish success criteria\n- [ ] Document expected outcomes'
  },
  {
    name: 'Tasks', 
    header: '## 🔧 Tasks',
    defaultContent: '- [ ] Break down objectives into actionable tasks\n- [ ] Assign priorities and dependencies\n- [ ] Document implementation steps'
  },
  {
    name: 'Execution Log',
    header: '## 🧾 Execution Log',
    defaultContent: '- ' + new Date().toISOString().split('T')[0] + ': Loop audit initiated'
  },
  {
    name: 'Memory Trace',
    header: '## 🧠 Memory Trace',
    defaultContent: '```json:memory\n{\n  "description": "Loop compliance audit placeholder",\n  "timestamp": "' + new Date().toISOString() + '",\n  "status": "audited",\n  "executor": "system",\n  "context": "Structural compliance verification"\n}\n```'
  }
];

function parseMarkdownFile(filePath: string): { frontmatter: any; content: string } {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Extract frontmatter
  const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('No frontmatter found');
  }

  const frontmatterText = frontmatterMatch[1];
  const content = frontmatterMatch[2];
  
  let frontmatter;
  try {
    frontmatter = parseYaml(frontmatterText);
  } catch (error) {
    throw new Error(`Failed to parse YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { frontmatter, content };
}

function validateFrontmatter(frontmatter: FrontmatterFields): { valid: boolean; missingFields: string[]; presentFields: string[] } {
  const missingFields: string[] = [];
  const presentFields: string[] = [];
  
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (frontmatter[field] !== undefined && frontmatter[field] !== null && frontmatter[field] !== '') {
      presentFields.push(field);
    } else {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
    presentFields
  };
}

function validateMarkdownSchema(content: string): { present: string[]; missing: string[] } {
  const present: string[] = [];
  const missing: string[] = [];
  
  for (const section of REQUIRED_SECTIONS) {
    if (content.includes(section.header)) {
      present.push(section.name);
    } else {
      missing.push(section.name);
    }
  }
  
  return { present, missing };
}

function dryRunMutation(content: string, sectionToAdd: RequiredSection): { preImage: string; postImage: string; diff: string } {
  const lines = content.split('\n');
  const preImage = content;
  
  // Find the best insertion point (usually before the last line or after execution log)
  let insertionIndex = lines.length;
  
  // Try to insert before the last few lines if they're just whitespace
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '') {
      insertionIndex = i;
    } else {
      break;
    }
  }
  
  const newSection = `\n${sectionToAdd.header}\n\n${sectionToAdd.defaultContent}\n`;
  const newLines = [...lines.slice(0, insertionIndex), ...newSection.split('\n'), ...lines.slice(insertionIndex)];
  const postImage = newLines.join('\n');
  
  // Generate simple diff
  const diff = `+++ ${sectionToAdd.header}\n+++ ${sectionToAdd.defaultContent.split('\n').map(line => `+ ${line}`).join('\n')}`;
  
  return { preImage, postImage, diff };
}

function auditFile(filePath: string): FileAuditResult {
  const filename = path.basename(filePath);
  const result: FileAuditResult = {
    filename,
    frontmatterStatus: { valid: false, missingFields: [], presentFields: [] },
    structuralSections: { present: [], missing: [] },
    dryRunPreviews: [],
    recommendedAction: 'skip',
    errors: []
  };
  
  try {
    // Parse file
    const { frontmatter, content } = parseMarkdownFile(filePath);
    
    // Validate frontmatter
    result.frontmatterStatus = validateFrontmatter(frontmatter);
    
    // Validate sections
    result.structuralSections = validateMarkdownSchema(content);
    
    // Generate dry-run previews for missing sections
    for (const missingSectionName of result.structuralSections.missing) {
      const section = REQUIRED_SECTIONS.find(s => s.name === missingSectionName);
      if (section) {
        try {
          const dryRun = dryRunMutation(content, section);
          result.dryRunPreviews.push({
            section: section.name,
            preImage: dryRun.preImage.slice(-200), // Last 200 chars for preview
            postImage: dryRun.postImage.slice(-300), // Last 300 chars for preview
            diff: dryRun.diff
          });
        } catch (error) {
          result.errors.push(`Failed to generate dry-run for section ${section.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    // Determine recommended action
    const totalMissing = result.frontmatterStatus.missingFields.length + result.structuralSections.missing.length;
    if (totalMissing === 0) {
      result.recommendedAction = 'skip'; // Already compliant
    } else if (totalMissing <= 2 && result.frontmatterStatus.missingFields.length === 0) {
      result.recommendedAction = 'patch'; // Safe to auto-patch
    } else {
      result.recommendedAction = 'manual_review'; // Needs human review
    }
    
  } catch (error) {
    result.errors.push(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`);
    result.recommendedAction = 'manual_review';
  }
  
  return result;
}

function generateSummary(results: FileAuditResult[]): AuditReport['summary'] {
  const missingSections: { [key: string]: number } = {};
  const missingFrontmatter: { [key: string]: number } = {};
  let patchableFiles = 0;
  let manualReviewRequired = 0;
  
  for (const result of results) {
    // Count missing sections
    for (const section of result.structuralSections.missing) {
      missingSections[section] = (missingSections[section] || 0) + 1;
    }
    
    // Count missing frontmatter
    for (const field of result.frontmatterStatus.missingFields) {
      missingFrontmatter[field] = (missingFrontmatter[field] || 0) + 1;
    }
    
    // Count action recommendations
    if (result.recommendedAction === 'patch') {
      patchableFiles++;
    } else if (result.recommendedAction === 'manual_review') {
      manualReviewRequired++;
    }
  }
  
  return {
    mostCommonMissingSections: missingSections,
    mostCommonMissingFrontmatter: missingFrontmatter,
    patchableFiles,
    manualReviewRequired
  };
}

async function main() {
  const loopsDir = path.join(process.cwd(), 'runtime', 'loops');
  const outputDir = path.join(process.cwd(), 'runtime', 'logs');
  const outputFile = path.join(outputDir, 'loop-compliance-audit.json');
  
  console.log('🔍 Starting loop compliance audit...');
  console.log(`📁 Scanning directory: ${loopsDir}`);
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Get all markdown files
  const files = fs.readdirSync(loopsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(loopsDir, file));
  
  console.log(`📄 Found ${files.length} loop files`);
  
  // Audit each file
  const results: FileAuditResult[] = [];
  let compliantFiles = 0;
  
  for (const file of files) {
    console.log(`🔎 Auditing: ${path.basename(file)}`);
    const result = auditFile(file);
    results.push(result);
    
    if (result.frontmatterStatus.valid && result.structuralSections.missing.length === 0) {
      compliantFiles++;
    }
  }
  
  // Generate report
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    compliantFiles,
    nonCompliantFiles: files.length - compliantFiles,
    results,
    summary: generateSummary(results)
  };
  
  // Write report
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 AUDIT SUMMARY');
  console.log('================');
  console.log(`Total files scanned: ${report.totalFiles}`);
  console.log(`✅ Fully compliant: ${report.compliantFiles} (${Math.round(report.compliantFiles / report.totalFiles * 100)}%)`);
  console.log(`❌ Non-compliant: ${report.nonCompliantFiles} (${Math.round(report.nonCompliantFiles / report.totalFiles * 100)}%)`);
  console.log(`🔧 Auto-patchable: ${report.summary.patchableFiles}`);
  console.log(`👀 Manual review needed: ${report.summary.manualReviewRequired}`);
  
  console.log('\n🔍 Most common issues:');
  console.log('Missing sections:');
  Object.entries(report.summary.mostCommonMissingSections)
    .sort(([,a], [,b]) => b - a)
    .forEach(([section, count]) => console.log(`  - ${section}: ${count} files`));
  
  console.log('Missing frontmatter:');
  Object.entries(report.summary.mostCommonMissingFrontmatter)
    .sort(([,a], [,b]) => b - a)
    .forEach(([field, count]) => console.log(`  - ${field}: ${count} files`));
  
  console.log(`\n📝 Detailed report saved to: ${outputFile}`);
  console.log('\n⚠️  This was a DRY RUN - no files were modified.');
  console.log('Review the report and approve safe mutations manually.');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { auditFile, validateFrontmatter, validateMarkdownSchema, dryRunMutation }; 