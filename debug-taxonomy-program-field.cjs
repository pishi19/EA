#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read all .md files in runtime/loops directory
const loopsDir = path.join(__dirname, 'runtime/loops');
const files = fs.readdirSync(loopsDir).filter(file => file.endsWith('.md'));

console.log('🔍 TAXONOMY PROGRAM FIELD ANALYSIS');
console.log('===================================');
console.log(`\nScanning ${files.length} artefact files...\n`);

const results = {
    hasProgram: [],
    missingProgram: [],
    emptyFields: [],
    nonCanonicalWorkstreams: [],
    allPrograms: new Set(),
    allPhases: new Set(),
    allWorkstreams: new Set()
};

files.forEach(file => {
    if (file === '.DS_Store') return;
    
    const filePath = path.join(loopsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
        console.log(`⚠️  ${file}: No frontmatter found`);
        return;
    }
    
    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');
    
    const fields = {};
    lines.forEach(line => {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
            fields[match[1]] = match[2].replace(/^['"]|['"]$/g, ''); // Remove quotes
        }
    });
    
    // Analyze fields
    const analysis = {
        file,
        hasProgram: !!fields.program,
        program: fields.program || null,
        phase: fields.phase || null,
        workstream: fields.workstream || null,
        status: fields.status || null,
        type: fields.type || null
    };
    
    // Track results
    if (analysis.hasProgram) {
        results.hasProgram.push(analysis);
        results.allPrograms.add(analysis.program);
    } else {
        results.missingProgram.push(analysis);
    }
    
    if (analysis.phase) results.allPhases.add(analysis.phase);
    if (analysis.workstream) results.allWorkstreams.add(analysis.workstream);
    
    // Check for empty or problematic fields
    if (!analysis.phase || analysis.phase === '') {
        results.emptyFields.push({...analysis, issue: 'empty phase'});
    }
    if (!analysis.workstream || analysis.workstream === '') {
        results.emptyFields.push({...analysis, issue: 'empty workstream'});
    }
    
    // Check for non-canonical workstreams
    const canonicalWorkstreams = ['Ora', 'workstream-ui', 'system-integrity', 'reasoning', 'memory'];
    if (analysis.workstream && !canonicalWorkstreams.includes(analysis.workstream)) {
        results.nonCanonicalWorkstreams.push(analysis);
    }
});

// Report results
console.log('📊 ANALYSIS RESULTS');
console.log('===================');

console.log(`\n✅ Files WITH program field: ${results.hasProgram.length}`);
results.hasProgram.forEach(item => {
    console.log(`   • ${item.file}: "${item.program}"`);
});

console.log(`\n❌ Files MISSING program field: ${results.missingProgram.length}`);
results.missingProgram.forEach(item => {
    console.log(`   • ${item.file}: phase="${item.phase}", workstream="${item.workstream}"`);
});

console.log(`\n⚠️  Files with EMPTY fields: ${results.emptyFields.length}`);
results.emptyFields.forEach(item => {
    console.log(`   • ${item.file}: ${item.issue}`);
});

console.log(`\n🚫 Files with NON-CANONICAL workstreams: ${results.nonCanonicalWorkstreams.length}`);
results.nonCanonicalWorkstreams.forEach(item => {
    console.log(`   • ${item.file}: workstream="${item.workstream}"`);
});

console.log(`\n📋 ALL PROGRAM VALUES FOUND:`);
Array.from(results.allPrograms).sort().forEach(program => {
    console.log(`   • "${program}"`);
});

console.log(`\n📋 ALL PHASE VALUES FOUND:`);
Array.from(results.allPhases).sort().forEach(phase => {
    console.log(`   • "${phase}"`);
});

console.log(`\n📋 ALL WORKSTREAM VALUES FOUND:`);
Array.from(results.allWorkstreams).sort().forEach(workstream => {
    console.log(`   • "${workstream}"`);
});

console.log('\n🔧 RECOMMENDED FIXES:');
console.log('=====================');

// Suggest program backfill based on phase
results.missingProgram.forEach(item => {
    if (item.phase) {
        let suggestedProgram = '';
        if (item.phase.startsWith('11')) {
            suggestedProgram = 'Phase 11 – Artefact Hierarchy and Filtering';
        } else if (item.phase.startsWith('10')) {
            suggestedProgram = 'Phase 10 – API Integration and Backend';
        } else if (item.phase.startsWith('9')) {
            suggestedProgram = 'Phase 9 – Strategic Planning and Analysis';
        } else {
            suggestedProgram = `Phase ${item.phase.split('.')[0]}`;
        }
        
        console.log(`   • ${item.file}: Add program: "${suggestedProgram}"`);
    }
});

// Suggest workstream normalization
results.nonCanonicalWorkstreams.forEach(item => {
    console.log(`   • ${item.file}: Change workstream "${item.workstream}" → "Ora"`);
});

console.log('\n🎯 FILTERING ENGINE ISSUE:');
console.log('==========================');
console.log('The React filtering logic is constructing programs from phase field:');
console.log('  `programs.add(`Phase ${artefact.phase}`);`');
console.log('');
console.log('But it should be using the actual program field or fall back to phase-based construction.');
console.log('Some artefacts have detailed phases like "11.2.2.1" which creates "Phase 11.2.2.1"');
console.log('instead of the canonical "Phase 11 – Artefact Hierarchy and Filtering".'); 