import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input Component', () => {
    test('renders input element', () => {
        render(<Input />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('accepts and displays value', () => {
        render(<Input value="test value" readOnly />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('test value');
    });

    test('handles value changes', () => {
        const handleChange = jest.fn();
        render(<Input onChange={handleChange} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'new value' } });
        
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    test('applies default styling', () => {
        render(<Input />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('flex');
        expect(input).toHaveClass('h-10');
        expect(input).toHaveClass('w-full');
        expect(input).toHaveClass('rounded-md');
        expect(input).toHaveClass('border');
        expect(input).toHaveClass('border-input');
        expect(input).toHaveClass('bg-background');
        expect(input).toHaveClass('px-3');
        expect(input).toHaveClass('py-2');
    });

    test('applies custom className', () => {
        render(<Input className="custom-input" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('custom-input');
    });

    test('supports different input types', () => {
        const { rerender } = render(<Input type="password" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password');
        
        rerender(<Input type="email" />);
        expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
        
        rerender(<Input type="number" />);
        expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    test('can be disabled', () => {
        render(<Input disabled />);
        const input = screen.getByRole('textbox');
        expect(input).toBeDisabled();
        expect(input).toHaveClass('disabled:cursor-not-allowed');
        expect(input).toHaveClass('disabled:opacity-50');
    });

    test('supports placeholder text', () => {
        render(<Input placeholder="Enter text here..." />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('placeholder', 'Enter text here...');
    });

    test('supports required attribute', () => {
        render(<Input required />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('required');
    });

    test('supports readonly attribute', () => {
        render(<Input readOnly />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('readonly');
    });

    test('forwards ref correctly', () => {
        const ref = jest.fn();
        render(<Input ref={ref} />);
        expect(ref).toHaveBeenCalled();
    });

    test('handles focus events', () => {
        const handleFocus = jest.fn();
        render(<Input onFocus={handleFocus} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    test('handles blur events', () => {
        const handleBlur = jest.fn();
        render(<Input onBlur={handleBlur} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.blur(input);
        expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard events', () => {
        const handleKeyDown = jest.fn();
        render(<Input onKeyDown={handleKeyDown} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    test('supports aria attributes', () => {
        render(
            <Input 
                aria-label="Username"
                aria-describedby="username-help"
                aria-invalid="true"
            />
        );
        
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('aria-label', 'Username');
        expect(input).toHaveAttribute('aria-describedby', 'username-help');
        expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('supports form validation attributes', () => {
        render(
            <Input 
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z]+"
            />
        );
        
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('minlength', '3');
        expect(input).toHaveAttribute('maxlength', '20');
        expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    test('supports name and id attributes', () => {
        render(<Input name="username" id="username-field" />);
        
        const input = screen.getByRole('textbox');
        expect(input).toHaveAttribute('name', 'username');
        expect(input).toHaveAttribute('id', 'username-field');
    });

    test('handles controlled input behavior', () => {
        const TestComponent = () => {
            const [value, setValue] = React.useState('initial');
            return (
                <Input 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)}
                    data-testid="controlled-input"
                />
            );
        };

        const React = require('react');
        render(<TestComponent />);
        
        const input = screen.getByTestId('controlled-input') as HTMLInputElement;
        expect(input.value).toBe('initial');
        
        fireEvent.change(input, { target: { value: 'updated' } });
        expect(input.value).toBe('updated');
    });

    test('handles input with special characters', () => {
        const handleChange = jest.fn();
        render(<Input onChange={handleChange} />);
        
        const input = screen.getByRole('textbox');
        const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        fireEvent.change(input, { target: { value: specialText } });
        expect(handleChange).toHaveBeenCalledWith(
            expect.objectContaining({
                target: expect.objectContaining({
                    value: specialText
                })
            })
        );
    });

    test('supports multiple event handlers', () => {
        const handlers = {
            onChange: jest.fn(),
            onFocus: jest.fn(),
            onBlur: jest.fn(),
            onKeyDown: jest.fn(),
            onKeyUp: jest.fn()
        };
        
        render(<Input {...handlers} />);
        
        const input = screen.getByRole('textbox');
        
        fireEvent.change(input, { target: { value: 'test' } });
        fireEvent.focus(input);
        fireEvent.blur(input);
        fireEvent.keyDown(input, { key: 'a' });
        fireEvent.keyUp(input, { key: 'a' });
        
        Object.values(handlers).forEach(handler => {
            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    test('maintains focus state correctly', () => {
        render(<Input />);
        
        const input = screen.getByRole('textbox');
        input.focus();
        expect(document.activeElement).toBe(input);
    });
}); 