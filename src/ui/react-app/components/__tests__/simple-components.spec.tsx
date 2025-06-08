/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

describe('Simple Component Tests', () => {
  describe('Button Component', () => {
    test('should render and handle clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Test Button</Button>);
      
      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should support variants', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    test('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Badge Component', () => {
    test('should render badge text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    test('should support variants', () => {
      render(<Badge variant="outline">Outline Badge</Badge>);
      expect(screen.getByText('Outline Badge')).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    test('should render input field', () => {
      render(<Input placeholder="Test input" />);
      expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    });

    test('should handle value changes', () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} data-testid="test-input" />);
      
      const input = screen.getByTestId('test-input');
      fireEvent.change(input, { target: { value: 'test value' } });
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Card Components', () => {
    test('should render card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>Test content</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should work together in complex layouts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complex Card</CardTitle>
            <Badge>Status</Badge>
          </CardHeader>
          <CardContent>
            <Input placeholder="Enter value" />
            <Button>Submit</Button>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Complex Card')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    test('should handle multiple components with interactions', () => {
      const handleSubmit = jest.fn();
      const handleInputChange = jest.fn();
      
      render(
        <div>
          <Input onChange={handleInputChange} data-testid="multi-input" />
          <Button onClick={handleSubmit}>Multi Submit</Button>
          <Badge>Multi Badge</Badge>
        </div>
      );
      
      // Test input interaction
      fireEvent.change(screen.getByTestId('multi-input'), { 
        target: { value: 'multi test' } 
      });
      expect(handleInputChange).toHaveBeenCalled();
      
      // Test button interaction
      fireEvent.click(screen.getByRole('button', { name: 'Multi Submit' }));
      expect(handleSubmit).toHaveBeenCalled();
      
      // Test badge presence
      expect(screen.getByText('Multi Badge')).toBeInTheDocument();
    });
  });

  describe('Component Props and Variants', () => {
    test('should handle different button sizes', () => {
      render(
        <div>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      );
      
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
    });

    test('should handle different badge variants', () => {
      render(
        <div>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      );
      
      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
    });

    test('should handle input types', () => {
      render(
        <div>
          <Input type="text" placeholder="Text input" />
          <Input type="password" placeholder="Password input" />
          <Input type="email" placeholder="Email input" />
        </div>
      );
      
      expect(screen.getByPlaceholderText('Text input')).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText('Password input')).toHaveAttribute('type', 'password');
      expect(screen.getByPlaceholderText('Email input')).toHaveAttribute('type', 'email');
    });
  });
}); 