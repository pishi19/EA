import { yamlEngine, matterOptions } from '../yaml-engine';

describe('YAML Engine', () => {
    describe('yamlEngine.parse', () => {
        test('parses valid YAML frontmatter correctly', () => {
            const content = `---
title: "Test Document"
uuid: "test-uuid-123"
created: "2023-12-13T10:30:00.000Z"
phase: "phase-11-1"
workstream: "workstream-ui"
status: "in_progress"
score: 0.85
tags: ["ui", "testing"]
summary: "Test document summary"
---

# Document Content

This is the main content.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata).toEqual({
                title: "Test Document",
                uuid: "test-uuid-123",
                created: "2023-12-13T10:30:00.000Z",
                phase: "phase-11-1",
                workstream: "workstream-ui",
                status: "in_progress",
                score: 0.85,
                tags: ["ui", "testing"],
                summary: "Test document summary"
            });
            expect(result.content).toBe(`# Document Content

This is the main content.`);
        });

        test('handles content without frontmatter', () => {
            const content = `# Regular Markdown

This document has no YAML frontmatter.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata).toEqual({});
            expect(result.content).toBe(content);
        });

        test('handles empty content', () => {
            const content = '';

            const result = parseYamlFrontmatter(content);

            expect(result.metadata).toEqual({});
            expect(result.content).toBe('');
        });

        test('handles content with only frontmatter', () => {
            const content = `---
title: "Only Frontmatter"
status: "complete"
---`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata).toEqual({
                title: "Only Frontmatter",
                status: "complete"
            });
            expect(result.content).toBe('');
        });

        test('handles malformed YAML frontmatter gracefully', () => {
            const content = `---
title: "Test Document
invalid: yaml: content:
  - malformed
    structure
---

Content after malformed YAML.`;

            const result = parseYamlFrontmatter(content);

            // Should return empty metadata and original content when YAML parsing fails
            expect(result.metadata).toEqual({});
            expect(result.content).toBe(content);
        });

        test('handles frontmatter with complex data types', () => {
            const content = `---
title: "Complex Document"
tags: ["tag1", "tag2", "tag3"]
scores:
  quality: 0.9
  completeness: 0.8
  clarity: 0.95
metadata:
  author: "System"
  version: 2
  published: true
nested:
  deep:
    value: "test"
---

Content with complex frontmatter.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata).toEqual({
                title: "Complex Document",
                tags: ["tag1", "tag2", "tag3"],
                scores: {
                    quality: 0.9,
                    completeness: 0.8,
                    clarity: 0.95
                },
                metadata: {
                    author: "System",
                    version: 2,
                    published: true
                },
                nested: {
                    deep: {
                        value: "test"
                    }
                }
            });
            expect(result.content).toBe('Content with complex frontmatter.');
        });

        test('handles frontmatter with special characters', () => {
            const content = `---
title: "Document with Special Characters: !@#$%^&*()"
unicode: "测试文件文档"
emoji: "🚀 📝 ✅"
quotes: 'Single "quoted" content'
multiline: |
  This is a multiline
  string with multiple
  lines
---

Content with special characters.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata.title).toBe('Document with Special Characters: !@#$%^&*()');
            expect(result.metadata.unicode).toBe('测试文件文档');
            expect(result.metadata.emoji).toBe('🚀 📝 ✅');
            expect(result.metadata.quotes).toBe('Single "quoted" content');
            expect(result.metadata.multiline).toContain('This is a multiline');
        });

        test('handles frontmatter with null and undefined values', () => {
            const content = `---
title: "Test Document"
nullable: null
optional: ~
empty: ""
zero: 0
false_value: false
---

Content after null values.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata.title).toBe('Test Document');
            expect(result.metadata.nullable).toBeNull();
            expect(result.metadata.optional).toBeNull();
            expect(result.metadata.empty).toBe('');
            expect(result.metadata.zero).toBe(0);
            expect(result.metadata.false_value).toBe(false);
        });

        test('preserves content formatting after frontmatter', () => {
            const content = `---
title: "Formatting Test"
---

# Header 1

## Header 2

- List item 1
- List item 2

\`\`\`javascript
console.log("code block");
\`\`\`

> Blockquote text

**Bold** and *italic* text.`;

            const result = parseYamlFrontmatter(content);

            expect(result.content).toContain('# Header 1');
            expect(result.content).toContain('## Header 2');
            expect(result.content).toContain('- List item 1');
            expect(result.content).toContain('```javascript');
            expect(result.content).toContain('> Blockquote text');
            expect(result.content).toContain('**Bold**');
        });

        test('handles multiple frontmatter delimiters in content', () => {
            const content = `---
title: "Document with Multiple Delimiters"
---

Content with --- in the middle.

---

And another --- delimiter.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata.title).toBe('Document with Multiple Delimiters');
            expect(result.content).toContain('Content with --- in the middle.');
            expect(result.content).toContain('And another --- delimiter.');
        });

        test('handles Windows line endings', () => {
            const content = `---\r\ntitle: "Windows Line Endings"\r\nstatus: "complete"\r\n---\r\n\r\nContent with Windows line endings.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata.title).toBe('Windows Line Endings');
            expect(result.metadata.status).toBe('complete');
            expect(result.content).toContain('Content with Windows line endings.');
        });

        test('handles mixed line endings', () => {
            const content = `---\ntitle: "Mixed Line Endings"\r\nstatus: "complete"\n---\r\n\nContent with mixed line endings.`;

            const result = parseYamlFrontmatter(content);

            expect(result.metadata.title).toBe('Mixed Line Endings');
            expect(result.metadata.status).toBe('complete');
            expect(result.content).toContain('Content with mixed line endings.');
        });
    });
}); 