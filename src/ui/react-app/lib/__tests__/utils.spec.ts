/// <reference types="jest" />

import { cn } from '../utils';

describe('Utils Library', () => {
  describe('cn function (class name utility)', () => {
    test('should combine class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    test('should handle undefined and null values', () => {
      const result = cn('class1', undefined, 'class2', null);
      expect(result).toBe('class1 class2');
    });

    test('should handle empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    test('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      );
      expect(result).toBe('base-class active');
    });

    test('should handle array of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    test('should handle object with conditional classes', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      });
      expect(result).toBe('class1 class3');
    });

    test('should handle complex combinations', () => {
      const result = cn(
        'base',
        ['array-class1', 'array-class2'],
        {
          'conditional-true': true,
          'conditional-false': false
        },
        'final-class'
      );
      expect(result).toBe('base array-class1 array-class2 conditional-true final-class');
    });

    test('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    test('should handle only falsy values', () => {
      const result = cn(false, null, undefined, '');
      expect(result).toBe('');
    });

    test('should trim extra whitespace', () => {
      const result = cn('  class1  ', '  class2  ');
      expect(result.split(' ')).not.toContain('');
    });
  });
}); 