import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button Component', () => {
    test('renders button with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    test('applies default variant styling', () => {
        render(<Button>Default</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-primary');
        expect(button).toHaveClass('text-primary-foreground');
    });

    test('applies secondary variant styling', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-secondary');
        expect(button).toHaveClass('text-secondary-foreground');
    });

    test('applies destructive variant styling', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-destructive');
        expect(button).toHaveClass('text-destructive-foreground');
    });

    test('applies outline variant styling', () => {
        render(<Button variant="outline">Outline</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('border');
        expect(button).toHaveClass('border-input');
        expect(button).toHaveClass('bg-background');
    });

    test('applies ghost variant styling', () => {
        render(<Button variant="ghost">Ghost</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('hover:bg-accent');
        expect(button).toHaveClass('hover:text-accent-foreground');
    });

    test('applies link variant styling', () => {
        render(<Button variant="link">Link</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('text-primary');
        expect(button).toHaveClass('underline-offset-4');
    });

    test('applies default size styling', () => {
        render(<Button>Default Size</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-10');
        expect(button).toHaveClass('px-4');
        expect(button).toHaveClass('py-2');
    });

    test('applies small size styling', () => {
        render(<Button size="sm">Small</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-9');
        expect(button).toHaveClass('px-3');
    });

    test('applies large size styling', () => {
        render(<Button size="lg">Large</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-11');
        expect(button).toHaveClass('px-8');
    });

    test('applies icon size styling', () => {
        render(<Button size="icon">🔥</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-10');
        expect(button).toHaveClass('w-10');
    });

    test('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Clickable</Button>);
        
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('can be disabled', () => {
        const handleClick = jest.fn();
        render(<Button disabled onClick={handleClick}>Disabled</Button>);
        
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        
        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    test('applies custom className', () => {
        render(<Button className="custom-class">Custom</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('custom-class');
    });

    test('renders as different element when asChild is true', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        );
        
        const link = screen.getByRole('link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/test');
    });

    test('forwards ref correctly', () => {
        const ref = jest.fn();
        render(<Button ref={ref}>Ref Button</Button>);
        expect(ref).toHaveBeenCalled();
    });

    test('applies multiple props correctly', () => {
        render(
            <Button 
                variant="outline" 
                size="lg" 
                disabled 
                className="extra-class"
                data-testid="complex-button"
            >
                Complex Button
            </Button>
        );
        
        const button = screen.getByTestId('complex-button');
        expect(button).toHaveClass('border'); // outline variant
        expect(button).toHaveClass('h-11'); // lg size
        expect(button).toHaveClass('extra-class'); // custom class
        expect(button).toBeDisabled();
    });

    test('handles keyboard events', () => {
        const handleKeyDown = jest.fn();
        render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>);
        
        const button = screen.getByRole('button');
        fireEvent.keyDown(button, { key: 'Enter' });
        expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    test('supports aria attributes', () => {
        render(
            <Button 
                aria-label="Close dialog"
                aria-describedby="tooltip"
            >
                ×
            </Button>
        );
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Close dialog');
        expect(button).toHaveAttribute('aria-describedby', 'tooltip');
    });

    test('handles form submission', () => {
        const handleSubmit = jest.fn((e) => e.preventDefault());
        render(
            <form onSubmit={handleSubmit}>
                <Button type="submit">Submit</Button>
            </form>
        );
        
        fireEvent.click(screen.getByRole('button'));
        expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    test('supports button type attribute', () => {
        render(<Button type="reset">Reset</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'reset');
    });
}); 