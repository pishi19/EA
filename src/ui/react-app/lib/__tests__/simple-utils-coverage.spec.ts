/// <reference types="jest" />

import { cn } from '../utils';

describe('Simple Utility Coverage Tests', () => {
  describe('cn utility function', () => {
    test('should combine class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    test('should handle conditional classes', () => {
      const result = cn('base', { 'conditional': true, 'excluded': false });
      expect(result).toContain('base');
      expect(result).toContain('conditional');
      expect(result).not.toContain('excluded');
    });

    test('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toContain('base');
      expect(result).toContain('valid');
    });

    test('should handle array of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    test('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    test('should handle complex conditional combinations', () => {
      const isActive = true;
      const isDisabled = false;
      const variant = 'primary';
      
      const result = cn(
        'base-class',
        {
          'active': isActive,
          'disabled': isDisabled,
          [`variant-${variant}`]: variant
        },
        'extra-class'
      );
      
      expect(result).toContain('base-class');
      expect(result).toContain('active');
      expect(result).toContain('variant-primary');
      expect(result).toContain('extra-class');
      expect(result).not.toContain('disabled');
    });
  });

  describe('Type checking utilities', () => {
    test('should validate basic type checks', () => {
      expect(typeof cn).toBe('function');
      expect(cn('test')).toBe('test');
    });

    test('should work with various input combinations', () => {
      // Test different scenarios that the cn function should handle
      const scenarios = [
        { input: ['a', 'b'], expected: 'a b' },
        { input: ['a', { 'b': true }], expected: 'a b' },
        { input: ['a', { 'b': false }], expected: 'a' },
        { input: [{ 'a': true, 'b': false, 'c': true }], expected: 'a c' }
      ];

      scenarios.forEach(({ input, expected }) => {
        const result = cn(...input);
        expected.split(' ').forEach(cls => {
          if (cls) {
            expect(result).toContain(cls);
          }
        });
      });
    });
  });

  describe('Function behavior edge cases', () => {
    test('should handle falsy values properly', () => {
      const showClass = false;
      const result = cn(
        showClass && 'should-not-appear',
        null,
        undefined,
        'should-appear'
      );
      
      expect(result).toBe('should-appear');
      expect(result).not.toContain('should-not-appear');
    });

    test('should handle nested arrays and objects', () => {
      const result = cn(
        'base',
        ['nested', 'array'],
        { 'object-true': true, 'object-false': false }
      );
      
      expect(result).toContain('base');
      expect(result).toContain('nested');
      expect(result).toContain('array');
      expect(result).toContain('object-true');
      expect(result).not.toContain('object-false');
    });
  });
}); 