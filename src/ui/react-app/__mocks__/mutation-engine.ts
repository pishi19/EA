// Mock mutation engine for testing
export const mutationEngine = {
  validateMarkdownSchema: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
  appendToSection: jest.fn().mockResolvedValue('Updated content'),
  updateFrontmatter: jest.fn().mockResolvedValue('Updated frontmatter'),
  createArtefactFile: jest.fn().mockResolvedValue({ success: true, filePath: 'test-file.md' }),
  deleteArtefactFile: jest.fn().mockResolvedValue({ success: true }),
  readArtefactFile: jest.fn().mockResolvedValue('# Test File\n\nContent'),
  parseMarkdown: jest.fn().mockReturnValue({
    frontmatter: { title: 'Test', status: 'in_progress' },
    content: 'Test content'
  })
};

export default { mutationEngine }; 