import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cn } from '../utils';

describe('Utils', () => {
    describe('cn function', () => {
        test('merges classes correctly', () => {
            const result = cn('bg-red-500', 'bg-blue-500');
            expect(result).toBe('bg-blue-500'); // tailwind-merge should keep the last class
        });

        test('handles conditional classes', () => {
            const isActive = true;
            const result = cn('base-class', { 'active-class': isActive });
            expect(result).toContain('base-class');
            expect(result).toContain('active-class');
        });

        test('handles falsy conditional classes', () => {
            const isActive = false;
            const result = cn('base-class', { 'active-class': isActive });
            expect(result).toBe('base-class');
            expect(result).not.toContain('active-class');
        });

        test('handles array of classes', () => {
            const result = cn(['class1', 'class2', 'class3']);
            expect(result).toContain('class1');
            expect(result).toContain('class2');
            expect(result).toContain('class3');
        });

        test('handles mixed types', () => {
            const result = cn(
                'base',
                ['array1', 'array2'],
                { conditional: true, excluded: false },
                'string-class'
            );
            expect(result).toContain('base');
            expect(result).toContain('array1');
            expect(result).toContain('array2');
            expect(result).toContain('conditional');
            expect(result).toContain('string-class');
            expect(result).not.toContain('excluded');
        });

        test('handles undefined and null values', () => {
            const result = cn('base', undefined, null, 'valid');
            expect(result).toBe('base valid');
        });

        test('handles empty strings', () => {
            const result = cn('base', '', 'valid');
            expect(result).toBe('base valid');
        });

        test('merges conflicting tailwind classes', () => {
            const result = cn('p-4 p-6 m-2 m-8');
            // tailwind-merge should keep the last of each type
            expect(result).toContain('p-6');
            expect(result).toContain('m-8');
            expect(result).not.toContain('p-4');
            expect(result).not.toContain('m-2');
        });

        test('handles complex responsive classes', () => {
            const result = cn(
                'w-full',
                'md:w-1/2',
                'lg:w-1/3',
                'hover:bg-blue-500',
                'focus:outline-none'
            );
            expect(result).toContain('w-full');
            expect(result).toContain('md:w-1/2');
            expect(result).toContain('lg:w-1/3');
            expect(result).toContain('hover:bg-blue-500');
            expect(result).toContain('focus:outline-none');
        });

        test('handles variant-specific conflicts', () => {
            const result = cn('bg-red-500 hover:bg-red-600 bg-blue-500');
            expect(result).toContain('bg-blue-500'); // Last base color wins
            expect(result).toContain('hover:bg-red-600'); // Hover variant preserved
        });
    });
}); 