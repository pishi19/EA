import { createLoopFile, CreateLoopParams } from '../create-loop';
import fs from 'fs/promises';
import path from 'path';

describe('createLoopFile', () => {
  const testUuid = 'test-2025-09-09-create-loop-validation';
  const testParams: CreateLoopParams = {
    uuid: testUuid,
    title: 'Test Loop Creation',
    phase: '8.2',
    workstream: 'mutation-surface-hardening',
    tags: ['test', 'validation', 'scaffolding'],
    status: 'in_progress',
    origin: 'jest-test'
  };
  
  const expectedFilePath = path.resolve(process.cwd(), '../../../runtime/loops', `loop-${testUuid}.md`);

  afterEach(async () => {
    // Clean up test file after each test
    try {
      await fs.unlink(expectedFilePath);
      console.log(`✅ Test cleanup: Deleted ${expectedFilePath}`);
    } catch (error) {
      // File might not exist, which is fine
    }
  });

  it('should create a loop file with correct structure and content', async () => {
    console.log('🧪 Testing createLoopFile with mock inputs...');
    console.log('Test parameters:', JSON.stringify(testParams, null, 2));

    // Create the loop file
    const actualFilePath = await createLoopFile(testParams);
    
    console.log(`📁 File created at: ${actualFilePath}`);
    
    // Assert file path is correct
    expect(actualFilePath).toBe(expectedFilePath);
    
    // Assert file exists
    const fileExists = await fs.access(expectedFilePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    console.log('✅ File exists check passed');

    // Read and validate file content
    const fileContent = await fs.readFile(expectedFilePath, 'utf-8');
    console.log('\n📄 Generated file content:');
    console.log('='.repeat(50));
    console.log(fileContent);
    console.log('='.repeat(50));

    // Check frontmatter fields
    expect(fileContent).toContain(`uuid: ${testParams.uuid}`);
    expect(fileContent).toContain(`title: ${testParams.title}`);
    expect(fileContent).toContain(`phase: ${testParams.phase}`);
    expect(fileContent).toContain(`workstream: ${testParams.workstream}`);
    expect(fileContent).toContain(`status: ${testParams.status}`);
    expect(fileContent).toContain(`tags: [${testParams.tags!.join(', ')}]`);
    expect(fileContent).toContain(`origin: ${testParams.origin}`);
    expect(fileContent).toContain('created:');
    expect(fileContent).toContain('summary: |');
    console.log('✅ Frontmatter validation passed');

    // Check required sections are present
    const requiredSections = [
      '## Purpose',
      '## ✅ Objectives', 
      '## 🔧 Tasks',
      '## 🧾 Execution Log',
      '## 🧠 Memory Trace'
    ];

    for (const section of requiredSections) {
      expect(fileContent).toContain(section);
      console.log(`✅ Section "${section}" found`);
    }

    // Check markdown structure (frontmatter between --- markers)
    expect(fileContent).toMatch(/^---\n[\s\S]*?\n---\n\n/);
    console.log('✅ Markdown frontmatter structure validated');

    console.log('\n🎉 All assertions passed! Loop file created successfully.');
  });

  it('should use default values when optional parameters are not provided', async () => {
    const minimalParams: CreateLoopParams = {
      uuid: 'test-minimal-params',
      title: 'Minimal Test Loop',
      phase: '9.0',
      workstream: 'test-workstream'
    };

    const filePath = await createLoopFile(minimalParams);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Check defaults
    expect(fileContent).toContain('status: in_progress');
    expect(fileContent).toContain('tags: []');
    expect(fileContent).toContain('origin: gpt');
    expect(fileContent).toContain('created:');

    console.log('✅ Default values test passed');
    
    // Clean up this test file too
    await fs.unlink(filePath);
  });
}); 