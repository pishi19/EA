#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface LoopMetadata {
  uuid?: string;
  title?: string;
  phase?: string | number;
  workstream?: string;
  status?: string;
  score?: number;
  tags?: string[];
  created?: string;
  origin?: string;
  summary?: string;
  // Additional fields that might exist
  routed?: boolean;
  source?: string;
  type?: string;
  program?: string;
  project?: string;
}

interface LoopAuditResult {
  filePath: string;
  fileName: string;
  metadata: LoopMetadata;
  missingFields: string[];
  missingSections: string[];
  orphaned: boolean;
  errors: string[];
}

const REQUIRED_METADATA_FIELDS = [
  'uuid',
  'title', 
  'phase',
  'workstream',
  'status',
  'tags',
  'created',
  'origin'
];

const OPTIONAL_METADATA_FIELDS = [
  'score',
  'summary',
  'routed',
  'source',
  'type',
  'program',
  'project'
];

const REQUIRED_SECTIONS = [
  'Purpose',
  '✅ Objectives',
  '🔧 Tasks',
  '🧾 Execution Log',
  '🧠 Memory Trace'
];

const CANONICAL_WORKSTREAMS = [
  'system-integrity',
  'workstream-ui', 
  'reasoning',
  'memory'
];

const CANONICAL_PHASES = [
  '7.0', '7.1', '8.0', '8.1', '8.2', '8.3',
  '9.0', '9.1', '9.2', '10.0', '10.1', '10.2'
];

const CANONICAL_STATUSES = [
  'planned',
  'in_progress', 
  'complete',
  'on_hold',
  'cancelled'
];

function scanLoopFiles(loopDir: string): string[] {
  try {
    const files = fs.readdirSync(loopDir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(loopDir, file));
  } catch (error) {
    console.error(`Error reading directory ${loopDir}:`, error);
    return [];
  }
}

function parseLoopFile(filePath: string): LoopAuditResult {
  const fileName = path.basename(filePath);
  const result: LoopAuditResult = {
    filePath,
    fileName,
    metadata: {},
    missingFields: [],
    missingSections: [],
    orphaned: false,
    errors: []
  };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    
    result.metadata = parsed.data as LoopMetadata;
    
    // Check for missing required metadata fields
    REQUIRED_METADATA_FIELDS.forEach(field => {
      if (!parsed.data[field] || parsed.data[field] === '') {
        result.missingFields.push(field);
      }
    });

    // Check for missing required sections
    const content = parsed.content;
    REQUIRED_SECTIONS.forEach(section => {
      if (!content.includes(`## ${section}`)) {
        result.missingSections.push(section);
      }
    });

    // Check for orphaned artefacts (not assigned to canonical groups)
    const workstream = parsed.data.workstream;
    const phase = String(parsed.data.phase || '');
    
    if (workstream && !CANONICAL_WORKSTREAMS.includes(workstream)) {
      result.errors.push(`Non-canonical workstream: ${workstream}`);
      result.orphaned = true;
    }

    if (phase && !CANONICAL_PHASES.includes(phase)) {
      result.errors.push(`Non-canonical phase: ${phase}`);
    }

    const status = parsed.data.status;
    if (status && !CANONICAL_STATUSES.includes(status)) {
      result.errors.push(`Non-canonical status: ${status}`);
    }

    // Check for malformed tags
    if (parsed.data.tags && !Array.isArray(parsed.data.tags)) {
      result.errors.push('Tags field is not an array');
    }

    // Check for malformed score
    if (parsed.data.score && (typeof parsed.data.score !== 'number' || parsed.data.score < 0 || parsed.data.score > 1)) {
      result.errors.push('Score should be number between 0 and 1');
    }

  } catch (error) {
    result.errors.push(`Failed to parse file: ${error}`);
  }

  return result;
}

function generateAuditReport(results: LoopAuditResult[]): string {
  const timestamp = new Date().toISOString();
  const totalFiles = results.length;
  const filesWithErrors = results.filter(r => r.missingFields.length > 0 || r.missingSections.length > 0 || r.errors.length > 0).length;
  const orphanedFiles = results.filter(r => r.orphaned).length;

  let report = `# Loop Metadata Audit Report

**Generated**: ${timestamp}  
**Total Files Analyzed**: ${totalFiles}  
**Files with Issues**: ${filesWithErrors}  
**Orphaned Artefacts**: ${orphanedFiles}  

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Files | ${totalFiles} | 100% |
| Clean Files | ${totalFiles - filesWithErrors} | ${Math.round(((totalFiles - filesWithErrors) / totalFiles) * 100)}% |
| Files with Missing Fields | ${results.filter(r => r.missingFields.length > 0).length} | ${Math.round((results.filter(r => r.missingFields.length > 0).length / totalFiles) * 100)}% |
| Files with Missing Sections | ${results.filter(r => r.missingSections.length > 0).length} | ${Math.round((results.filter(r => r.missingSections.length > 0).length / totalFiles) * 100)}% |
| Orphaned Artefacts | ${orphanedFiles} | ${Math.round((orphanedFiles / totalFiles) * 100)}% |

## Field Completeness Analysis

`;

  // Calculate field completeness
  const fieldStats: Record<string, number> = {};
  REQUIRED_METADATA_FIELDS.forEach(field => {
    fieldStats[field] = results.filter(r => r.metadata[field as keyof LoopMetadata]).length;
  });

  report += '| Field | Present | Missing | Completion Rate |\n';
  report += '|-------|---------|---------|----------------|\n';
  
  REQUIRED_METADATA_FIELDS.forEach(field => {
    const present = fieldStats[field] || 0;
    const missing = totalFiles - present;
    const rate = Math.round((present / totalFiles) * 100);
    report += `| ${field} | ${present} | ${missing} | ${rate}% |\n`;
  });

  report += '\n## Workstream Distribution\n\n';
  const workstreamStats: Record<string, number> = {};
  results.forEach(r => {
    const ws = r.metadata.workstream || 'missing';
    workstreamStats[ws] = (workstreamStats[ws] || 0) + 1;
  });

  report += '| Workstream | Count |\n|------------|-------|\n';
  Object.entries(workstreamStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([ws, count]) => {
      report += `| ${ws} | ${count} |\n`;
    });

  report += '\n## Status Distribution\n\n';
  const statusStats: Record<string, number> = {};
  results.forEach(r => {
    const status = r.metadata.status || 'missing';
    statusStats[status] = (statusStats[status] || 0) + 1;
  });

  report += '| Status | Count |\n|--------|-------|\n';
  Object.entries(statusStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([status, count]) => {
      report += `| ${status} | ${count} |\n`;
    });

  report += '\n## Detailed File Analysis\n\n';
  
  // Sort by number of issues (most problematic first)
  const sortedResults = results.sort((a, b) => {
    const aIssues = a.missingFields.length + a.missingSections.length + a.errors.length;
    const bIssues = b.missingFields.length + b.missingSections.length + b.errors.length;
    return bIssues - aIssues;
  });

  report += '| File | Workstream | Program | Project | Status | Type | Tags | Missing Fields | Missing Sections | Errors |\n';
  report += '|------|------------|---------|---------|--------|------|------|----------------|------------------|--------|\n';

  sortedResults.forEach(result => {
    const workstream = result.metadata.workstream || 'missing';
    const program = result.metadata.phase?.toString() || 'missing';
    const project = result.metadata.tags?.join(', ') || 'missing';
    const status = result.metadata.status || 'missing';
    const type = result.metadata.type || result.metadata.origin || 'missing';
    const tags = result.metadata.tags?.length ? result.metadata.tags.join(', ') : 'missing';
    const missingFields = result.missingFields.join(', ') || 'none';
    const missingSections = result.missingSections.join(', ') || 'none';
    const errors = result.errors.join('; ') || 'none';

    report += `| \`${result.fileName}\` | ${workstream} | ${program} | ${project} | ${status} | ${type} | ${tags} | ${missingFields} | ${missingSections} | ${errors} |\n`;
  });

  report += '\n## Orphaned Artefacts\n\n';
  const orphanedResults = results.filter(r => r.orphaned);
  
  if (orphanedResults.length === 0) {
    report += 'No orphaned artefacts found.\n\n';
  } else {
    report += 'Files not assigned to canonical workstreams:\n\n';
    orphanedResults.forEach(result => {
      report += `- \`${result.fileName}\`: workstream="${result.metadata.workstream}"\n`;
    });
    report += '\n';
  }

  report += '## Recommendations\n\n';
  report += '1. **Priority 1**: Fix files missing required fields (uuid, title, phase, workstream, status)\n';
  report += '2. **Priority 2**: Add missing required sections (Purpose, Objectives)\n';
  report += '3. **Priority 3**: Standardize workstream values to canonical set\n';
  report += '4. **Priority 4**: Ensure all files have proper tags and metadata\n';
  report += '5. **Priority 5**: Review orphaned artefacts for proper categorization\n\n';

  report += '---\n*Generated by loop-metadata-audit script*\n';

  return report;
}

async function main() {
  const loopDir = path.join(process.cwd(), 'runtime', 'loops');
  const outputDir = path.join(process.cwd(), 'runtime', 'logs');
  const outputFile = path.join(outputDir, 'loop_metadata_audit.md');

  console.log('🔍 Starting loop metadata audit...');
  console.log(`📂 Scanning directory: ${loopDir}`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  // Scan and analyze all loop files
  const loopFiles = scanLoopFiles(loopDir);
  console.log(`📋 Found ${loopFiles.length} loop files`);

  const results: LoopAuditResult[] = [];
  
  for (const file of loopFiles) {
    console.log(`🔎 Analyzing: ${path.basename(file)}`);
    const result = parseLoopFile(file);
    results.push(result);
  }

  // Generate and save audit report
  const report = generateAuditReport(results);
  fs.writeFileSync(outputFile, report, 'utf-8');

  console.log(`\n✅ Audit complete!`);
  console.log(`📊 Analyzed ${results.length} files`);
  console.log(`❌ Found ${results.filter(r => r.missingFields.length > 0 || r.missingSections.length > 0 || r.errors.length > 0).length} files with issues`);
  console.log(`📝 Report saved to: ${outputFile}`);
  
  // Print quick summary to console
  console.log(`\n📈 Quick Summary:`);
  console.log(`   - Files missing title: ${results.filter(r => r.missingFields.includes('title')).length}`);
  console.log(`   - Files missing workstream: ${results.filter(r => r.missingFields.includes('workstream')).length}`);
  console.log(`   - Files missing phase: ${results.filter(r => r.missingFields.includes('phase')).length}`);
  console.log(`   - Files missing Purpose section: ${results.filter(r => r.missingSections.includes('Purpose')).length}`);
  console.log(`   - Files missing Objectives section: ${results.filter(r => r.missingSections.includes('✅ Objectives')).length}`);
}

// Run the main function if this script is executed directly
main().catch(console.error); 