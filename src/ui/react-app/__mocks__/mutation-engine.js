// Mock for system/mutation-engine
export const mutationEngine = {
  validateMarkdownSchema: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  appendToSection: jest.fn().mockResolvedValue(true),
  updateFrontmatter: jest.fn().mockResolvedValue(true),
  removeTask: jest.fn().mockResolvedValue(true),
  createTask: jest.fn().mockResolvedValue(true),
  updateTaskStatus: jest.fn().mockResolvedValue(true),
  addTag: jest.fn().mockResolvedValue(true),
  removeTag: jest.fn().mockResolvedValue(true),
  getTaskContent: jest.fn().mockResolvedValue('Mock task content'),
  updateTaskContent: jest.fn().mockResolvedValue(true),
  batchMutate: jest.fn().mockResolvedValue({ success: true, results: [] })
};

export default mutationEngine; 