#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface FieldAnalysis {
  key: string;
  frequency: number;
  examples: any[];
  types: Set<string>;
  description: string;
}

interface SectionAnalysis {
  heading: string;
  frequency: number;
  examples: string[];
  description: string;
}

interface SchemaAnalysisResult {
  totalFiles: number;
  frontmatterFields: Map<string, FieldAnalysis>;
  markdownSections: Map<string, SectionAnalysis>;
  filesSampled: string[];
}

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

function getValueType(value: any): string {
  if (Array.isArray(value)) {
    return `array[${value.length}]`;
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  if (typeof value === 'string' && value.includes('\n')) {
    return 'multiline-string';
  }
  return typeof value;
}

function extractMarkdownSections(content: string): string[] {
  const headingPattern = /^#{1,6}\s+(.+)$/gm;
  const sections: string[] = [];
  let match;
  
  while ((match = headingPattern.exec(content)) !== null) {
    sections.push(match[1].trim());
  }
  
  return sections;
}

function analyzeLoopFile(filePath: string): { frontmatter: any; sections: string[]; fileName: string } {
  const fileName = path.basename(filePath);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    const sections = extractMarkdownSections(parsed.content);
    
    return {
      frontmatter: parsed.data,
      sections,
      fileName
    };
  } catch (error) {
    console.error(`Error parsing ${fileName}:`, error);
    return {
      frontmatter: {},
      sections: [],
      fileName
    };
  }
}

function analyzeSchemaPatterns(loopFiles: string[]): SchemaAnalysisResult {
  const frontmatterFields = new Map<string, FieldAnalysis>();
  const markdownSections = new Map<string, SectionAnalysis>();
  const filesSampled: string[] = [];

  console.log(`🔍 Analyzing ${loopFiles.length} loop files...`);

  for (const filePath of loopFiles) {
    const analysis = analyzeLoopFile(filePath);
    filesSampled.push(analysis.fileName);

    // Analyze frontmatter fields
    Object.entries(analysis.frontmatter).forEach(([key, value]) => {
      if (!frontmatterFields.has(key)) {
        frontmatterFields.set(key, {
          key,
          frequency: 0,
          examples: [],
          types: new Set(),
          description: ''
        });
      }

      const field = frontmatterFields.get(key)!;
      field.frequency++;
      field.types.add(getValueType(value));
      
      // Store examples (max 5 unique values)
      if (field.examples.length < 5 && !field.examples.includes(value)) {
        field.examples.push(value);
      }
    });

    // Analyze markdown sections
    analysis.sections.forEach(section => {
      if (!markdownSections.has(section)) {
        markdownSections.set(section, {
          heading: section,
          frequency: 0,
          examples: [],
          description: ''
        });
      }

      const sectionAnalysis = markdownSections.get(section)!;
      sectionAnalysis.frequency++;
      
      // Store file examples (max 3)
      if (sectionAnalysis.examples.length < 3 && !sectionAnalysis.examples.includes(analysis.fileName)) {
        sectionAnalysis.examples.push(analysis.fileName);
      }
    });
  }

  return {
    totalFiles: loopFiles.length,
    frontmatterFields,
    markdownSections,
    filesSampled
  };
}

function generateFieldDescription(field: FieldAnalysis): string {
  const { key, frequency, examples, types } = field;
  const typeList = Array.from(types).join(', ');
  
  switch (key) {
    case 'uuid':
      return 'Unique identifier for the loop/artefact. Essential for cross-referencing and linking.';
    case 'title':
      return 'Human-readable title/summary. Critical for search and discovery.';
    case 'phase':
      return 'Development phase indicator (e.g., 8.1, 9, 10.2). Used for timeline organization.';
    case 'workstream':
      return 'Categorical grouping (system-integrity, workstream-ui, reasoning, memory). Primary filter dimension.';
    case 'status':
      return 'Current state (planned, in_progress, complete, blocked). Essential for workflow management.';
    case 'tags':
      return 'Flexible labeling system. Useful for topic-based filtering and semantic search.';
    case 'created':
      return 'Creation timestamp. Important for chronological ordering and audit trails.';
    case 'origin':
      return 'Source/trigger context (roadmap, user-request, vault, inbox). Valuable for provenance tracking.';
    case 'score':
      return 'Quality/completion metric (0-1 scale). Useful for prioritization and assessment.';
    case 'summary':
      return 'Extended description field. Ideal for semantic search and AI processing.';
    case 'source':
      return 'Specific source system (retrospective, vault, gmail). Key for integration workflows.';
    case 'routed':
      return 'Processing flag indicating routing status. Technical workflow control.';
    default:
      return `Custom field (${typeList}). Appears in ${frequency}/${this.totalFiles} files.`;
  }
}

function generateSectionDescription(section: SectionAnalysis): string {
  const { heading, frequency } = section;
  
  if (heading.includes('Purpose')) {
    return 'Defines the goal and intent of the loop. Critical for understanding scope and alignment.';
  }
  if (heading.includes('Objectives') || heading.includes('✅')) {
    return 'Structured goals and deliverables. Essential for tracking progress and completion.';
  }
  if (heading.includes('Tasks') || heading.includes('🔧')) {
    return 'Actionable work items. Core operational content for execution tracking.';
  }
  if (heading.includes('Execution Log') || heading.includes('🧾')) {
    return 'Historical record of actions taken. Valuable for audit trails and learning.';
  }
  if (heading.includes('Memory Trace') || heading.includes('🧠')) {
    return 'Semantic memory and context tracking. Important for AI reasoning and continuity.';
  }
  if (heading.includes('Chat') || heading.includes('💬')) {
    return 'Conversational interactions and feedback. Useful for human-AI collaboration tracking.';
  }
  if (heading.includes('Goal') || heading.includes('🎯')) {
    return 'High-level objective statement. Similar to Purpose but more action-oriented.';
  }
  if (heading.includes('Notes') || heading.includes('🔁')) {
    return 'Additional context and observations. Flexible content for supplementary information.';
  }
  
  return `Custom section appearing in ${frequency} files. May contain domain-specific content.`;
}

function generateAnalysisReport(analysis: SchemaAnalysisResult): string {
  const timestamp = new Date().toISOString();
  
  let report = `# Loop Schema Patterns Analysis

**Generated**: ${timestamp}  
**Files Analyzed**: ${analysis.totalFiles}  
**Purpose**: Comprehensive analysis of YAML frontmatter and markdown section patterns across all loop files  

## Executive Summary

This analysis reveals the structural patterns and content organization used across ${analysis.totalFiles} loop files. The findings show a mix of standardized fields (uuid, title, workstream) and flexible content sections, indicating both systematic organization and adaptive documentation practices.

**Key Findings:**
- **${analysis.frontmatterFields.size} unique frontmatter fields** ranging from core identifiers to workflow metadata
- **${analysis.markdownSections.size} unique section headings** covering planning, execution, and reflection content
- **Strong standardization** in identity fields (uuid, title) and workflow fields (status, workstream)
- **Flexible content structure** allowing for domain-specific sections and custom organization

---

## YAML Frontmatter Fields Analysis

| Field | Frequency | Types | Examples | Integration Value | Description |
|-------|-----------|-------|----------|------------------|-------------|
`;

  // Sort frontmatter fields by frequency (descending)
  const sortedFields = Array.from(analysis.frontmatterFields.values())
    .sort((a, b) => b.frequency - a.frequency);

  sortedFields.forEach(field => {
    const types = Array.from(field.types).join(', ');
    const examples = field.examples.slice(0, 3).map(ex => 
      typeof ex === 'string' && ex.length > 30 ? `"${ex.substring(0, 30)}..."` : JSON.stringify(ex)
    ).join(', ');
    const percentage = Math.round((field.frequency / analysis.totalFiles) * 100);
    const integrationValue = getIntegrationValue(field.key);
    
    field.description = generateFieldDescription.call({ totalFiles: analysis.totalFiles }, field);
    
    report += `| \`${field.key}\` | ${field.frequency}/${analysis.totalFiles} (${percentage}%) | ${types} | ${examples} | ${integrationValue} | ${field.description} |\n`;
  });

  report += '\n## Markdown Section Patterns Analysis\n\n';
  report += '| Section Heading | Frequency | Example Files | Content Type | Integration Value | Description |\n';
  report += '|-----------------|-----------|---------------|--------------|------------------|-------------|\n';

  // Sort sections by frequency (descending)
  const sortedSections = Array.from(analysis.markdownSections.values())
    .sort((a, b) => b.frequency - a.frequency);

  sortedSections.forEach(section => {
    const examples = section.examples.slice(0, 2).join(', ');
    const percentage = Math.round((section.frequency / analysis.totalFiles) * 100);
    const contentType = getContentType(section.heading);
    const integrationValue = getSectionIntegrationValue(section.heading);
    
    section.description = generateSectionDescription(section);
    
    report += `| ${section.heading} | ${section.frequency}/${analysis.totalFiles} (${percentage}%) | ${examples} | ${contentType} | ${integrationValue} | ${section.description} |\n`;
  });

  report += '\n## Integration Recommendations\n\n';
  report += '### High-Value Fields for Source Integration\n\n';
  
  const highValueFields = sortedFields.filter(f => getIntegrationValue(f.key) === 'High');
  report += 'These fields should be prioritized when integrating external sources (Gmail, Slack, etc.):\n\n';
  highValueFields.forEach(field => {
    report += `- **\`${field.key}\`**: ${field.description}\n`;
  });

  report += '\n### Essential Sections for Structured Content\n\n';
  const essentialSections = sortedSections.filter(s => getSectionIntegrationValue(s.heading) === 'High');
  report += 'These sections provide structured frameworks for organizing imported content:\n\n';
  essentialSections.forEach(section => {
    report += `- **${section.heading}**: ${section.description}\n`;
  });

  report += '\n### Source-Specific Mapping Recommendations\n\n';
  report += '#### Gmail Integration\n';
  report += '- **Map to**: `source: gmail`, `origin: inbox`\n';
  report += '- **Extract**: Subject → `title`, Thread ID → `uuid`, Date → `created`\n';
  report += '- **Generate**: Tags from sender, labels, and keywords\n';
  report += '- **Content**: Email body → Purpose section, Action items → Tasks section\n\n';

  report += '#### Slack Integration\n';
  report += '- **Map to**: `source: slack`, `origin: discussion`\n';
  report += '- **Extract**: Channel → `workstream`, Thread ID → `uuid`, Timestamp → `created`\n';
  report += '- **Generate**: Tags from channel topic and participants\n';
  report += '- **Content**: Messages → Chat section, Decisions → Objectives section\n\n';

  report += '#### Planning Tool Integration\n';
  report += '- **Map to**: `source: planning`, `origin: roadmap`\n';
  report += '- **Extract**: Epic/Story → `title`, Sprint → `phase`, Status → `status`\n';
  report += '- **Generate**: Tags from labels and components\n';
  report += '- **Content**: Description → Purpose, Acceptance Criteria → Objectives\n\n';

  report += '## Schema Evolution Recommendations\n\n';
  report += '### Standardization Opportunities\n\n';
  
  const lowFreqFields = sortedFields.filter(f => f.frequency < analysis.totalFiles * 0.5);
  if (lowFreqFields.length > 0) {
    report += '**Fields needing standardization** (present in <50% of files):\n';
    lowFreqFields.forEach(field => {
      const percentage = Math.round((field.frequency / analysis.totalFiles) * 100);
      report += `- \`${field.key}\` (${percentage}%): Consider making required or deprecating\n`;
    });
    report += '\n';
  }

  report += '### Emerging Patterns\n\n';
  const mediumFreqFields = sortedFields.filter(f => 
    f.frequency >= analysis.totalFiles * 0.3 && f.frequency < analysis.totalFiles * 0.8
  );
  if (mediumFreqFields.length > 0) {
    report += '**Fields gaining adoption** (30-80% usage):\n';
    mediumFreqFields.forEach(field => {
      const percentage = Math.round((field.frequency / analysis.totalFiles) * 100);
      report += `- \`${field.key}\` (${percentage}%): Candidate for standardization\n`;
    });
    report += '\n';
  }

  report += '### Content Structure Insights\n\n';
  const structuralSections = sortedSections.filter(s => s.frequency >= analysis.totalFiles * 0.5);
  report += '**Well-established section patterns** (>50% adoption):\n';
  structuralSections.forEach(section => {
    const percentage = Math.round((section.frequency / analysis.totalFiles) * 100);
    report += `- ${section.heading} (${percentage}%): Core structural element\n`;
  });

  report += '\n## Technical Implementation Notes\n\n';
  report += '### YAML Schema Validation\n';
  report += 'Based on this analysis, a robust schema should include:\n\n';
  report += '```yaml\n';
  report += 'required_fields:\n';
  const requiredFields = sortedFields.filter(f => f.frequency >= analysis.totalFiles * 0.8);
  requiredFields.forEach(field => {
    const types = Array.from(field.types);
    const primaryType = types.length === 1 ? types[0] : 'mixed';
    report += `  - ${field.key}: ${primaryType}\n`;
  });
  report += '\noptional_fields:\n';
  const optionalFields = sortedFields.filter(f => f.frequency < analysis.totalFiles * 0.8);
  optionalFields.slice(0, 10).forEach(field => {
    const types = Array.from(field.types);
    const primaryType = types.length === 1 ? types[0] : 'mixed';
    report += `  - ${field.key}: ${primaryType}\n`;
  });
  report += '```\n\n';

  report += '### Section Template Structure\n';
  report += 'A standardized template should include:\n\n';
  structuralSections.forEach(section => {
    report += `#### ${section.heading}\n`;
    report += `${section.description}\n\n`;
  });

  report += '---\n\n';
  report += `**Analysis completed**: ${timestamp}  \n`;
  report += `**Files processed**: ${analysis.filesSampled.join(', ')}  \n`;
  report += '*Generated by loop-schema-patterns analysis script*\n';

  return report;
}

function getIntegrationValue(fieldKey: string): string {
  const highValue = ['uuid', 'title', 'created', 'source', 'workstream', 'status', 'tags'];
  const mediumValue = ['phase', 'origin', 'summary', 'score'];
  
  if (highValue.includes(fieldKey)) return 'High';
  if (mediumValue.includes(fieldKey)) return 'Medium';
  return 'Low';
}

function getContentType(heading: string): string {
  if (heading.includes('Purpose') || heading.includes('Goal')) return 'Strategic';
  if (heading.includes('Objectives') || heading.includes('Tasks')) return 'Operational';
  if (heading.includes('Execution') || heading.includes('Memory')) return 'Historical';
  if (heading.includes('Chat') || heading.includes('Notes')) return 'Interactive';
  return 'Custom';
}

function getSectionIntegrationValue(heading: string): string {
  const highValue = ['Purpose', 'Objectives', 'Tasks', 'Execution Log', 'Goal'];
  const mediumValue = ['Memory Trace', 'Chat', 'Notes'];
  
  if (highValue.some(h => heading.includes(h))) return 'High';
  if (mediumValue.some(h => heading.includes(h))) return 'Medium';
  return 'Low';
}

async function main() {
  const loopDir = path.join(process.cwd(), 'runtime', 'loops');
  const outputDir = path.join(process.cwd(), 'runtime', 'logs');
  const outputFile = path.join(outputDir, 'loop_schema_patterns.md');

  console.log('🔍 Starting loop schema patterns analysis...');
  console.log(`📂 Scanning directory: ${loopDir}`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }

  // Scan and analyze all loop files
  const loopFiles = scanLoopFiles(loopDir);
  console.log(`📋 Found ${loopFiles.length} loop files`);

  if (loopFiles.length === 0) {
    console.error('❌ No loop files found to analyze');
    return;
  }

  // Perform schema analysis
  const analysis = analyzeSchemaPatterns(loopFiles);

  // Generate and save comprehensive report
  const report = generateAnalysisReport(analysis);
  fs.writeFileSync(outputFile, report, 'utf-8');

  console.log(`\n✅ Schema analysis complete!`);
  console.log(`📊 Analyzed ${analysis.totalFiles} files`);
  console.log(`🔧 Found ${analysis.frontmatterFields.size} unique frontmatter fields`);
  console.log(`📝 Found ${analysis.markdownSections.size} unique section headings`);
  console.log(`📋 Report saved to: ${outputFile}`);
  
  // Print quick summary to console
  console.log(`\n📈 Top Frontmatter Fields:`);
  const topFields = Array.from(analysis.frontmatterFields.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  topFields.forEach(field => {
    const percentage = Math.round((field.frequency / analysis.totalFiles) * 100);
    console.log(`   - ${field.key}: ${percentage}% (${field.frequency}/${analysis.totalFiles})`);
  });

  console.log(`\n📈 Top Section Patterns:`);
  const topSections = Array.from(analysis.markdownSections.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);
  topSections.forEach(section => {
    const percentage = Math.round((section.frequency / analysis.totalFiles) * 100);
    console.log(`   - ${section.heading}: ${percentage}% (${section.frequency}/${analysis.totalFiles})`);
  });
}

// Run the main function if this script is executed directly
main().catch(console.error); 