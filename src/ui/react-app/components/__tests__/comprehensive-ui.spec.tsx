/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

describe('Comprehensive UI Component Coverage', () => {
  describe('Button Variants and States', () => {
    test('should render all button variants', () => {
      render(
        <div>
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Destructive')).toBeInTheDocument();
      expect(screen.getByText('Outline')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
      expect(screen.getByText('Ghost')).toBeInTheDocument();
      expect(screen.getByText('Link')).toBeInTheDocument();
    });

    test('should render all button sizes', () => {
      render(
        <div>
          <Button size="default">Default Size</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">⚡</Button>
        </div>
      );

      expect(screen.getByText('Default Size')).toBeInTheDocument();
      expect(screen.getByText('Small')).toBeInTheDocument();
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    test('should handle button interactions', () => {
      const handleClick = jest.fn();
      render(
        <div>
          <Button onClick={handleClick}>Clickable</Button>
          <Button disabled>Disabled</Button>
          <Button asChild><span>As Child</span></Button>
        </div>
      );

      fireEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalled();

      expect(screen.getByText('Disabled')).toBeDisabled();
      expect(screen.getByText('As Child')).toBeInTheDocument();
    });
  });

  describe('Badge Coverage', () => {
    test('should render all badge variants', () => {
      render(
        <div>
          <Badge variant="default">Default Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="destructive">Destructive Badge</Badge>
          <Badge variant="outline">Outline Badge</Badge>
        </div>
      );

      expect(screen.getByText('Default Badge')).toBeInTheDocument();
      expect(screen.getByText('Secondary Badge')).toBeInTheDocument();
      expect(screen.getByText('Destructive Badge')).toBeInTheDocument();
      expect(screen.getByText('Outline Badge')).toBeInTheDocument();
    });

    test('should handle badge with different content', () => {
      render(
        <div>
          <Badge>Text Only</Badge>
          <Badge>123</Badge>
          <Badge>🔥 With Emoji</Badge>
          <Badge><span>Nested Content</span></Badge>
        </div>
      );

      expect(screen.getByText('Text Only')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('🔥 With Emoji')).toBeInTheDocument();
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('Input Component Coverage', () => {
    test('should handle different input types and attributes', () => {
      render(
        <div>
          <Input type="text" placeholder="Text input" data-testid="text-input" />
          <Input type="email" placeholder="Email input" data-testid="email-input" />
          <Input type="password" placeholder="Password input" data-testid="password-input" />
          <Input type="number" placeholder="Number input" data-testid="number-input" />
          <Input disabled placeholder="Disabled input" data-testid="disabled-input" />
        </div>
      );

      expect(screen.getByTestId('text-input')).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('email-input')).toHaveAttribute('type', 'email');
      expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('number-input')).toHaveAttribute('type', 'number');
      expect(screen.getByTestId('disabled-input')).toBeDisabled();
    });

    test('should handle input interactions', () => {
      const handleChange = jest.fn();
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();

      render(
        <Input
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="interactive-input"
        />
      );

      const input = screen.getByTestId('interactive-input');
      
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalled();

      fireEvent.change(input, { target: { value: 'test value' } });
      expect(handleChange).toHaveBeenCalled();

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Card Component System', () => {
    test('should render complex card structures', () => {
      render(
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
            </CardHeader>
            <CardContent>Simple content</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complex Card</CardTitle>
              <p>With description</p>
            </CardHeader>
            <CardContent>
              <p>Complex content with multiple elements</p>
              <Button>Action Button</Button>
            </CardContent>
          </Card>
        </div>
      );

      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Simple content')).toBeInTheDocument();
      expect(screen.getByText('Complex Card')).toBeInTheDocument();
      expect(screen.getByText('With description')).toBeInTheDocument();
      expect(screen.getByText('Complex content with multiple elements')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    test('should handle card without header or content', () => {
      render(
        <div>
          <Card>
            <CardContent>Content only card</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Header only card</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );

      expect(screen.getByText('Content only card')).toBeInTheDocument();
      expect(screen.getByText('Header only card')).toBeInTheDocument();
    });
  });

  describe('Checkbox Component Coverage', () => {
    test('should handle checkbox states and interactions', () => {
      const handleCheckedChange = jest.fn();

      render(
        <div>
          <Checkbox data-testid="unchecked" />
          <Checkbox checked data-testid="checked" />
          <Checkbox disabled data-testid="disabled" />
          <Checkbox onCheckedChange={handleCheckedChange} data-testid="interactive" />
        </div>
      );

      expect(screen.getByTestId('unchecked')).not.toBeChecked();
      expect(screen.getByTestId('checked')).toBeChecked();
      expect(screen.getByTestId('disabled')).toBeDisabled();

      fireEvent.click(screen.getByTestId('interactive'));
      expect(handleCheckedChange).toHaveBeenCalled();
    });

    test('should handle checkbox with labels', () => {
      render(
        <div>
          <label>
            <Checkbox data-testid="labeled-checkbox" />
            Checkbox with label
          </label>
        </div>
      );

      expect(screen.getByTestId('labeled-checkbox')).toBeInTheDocument();
      expect(screen.getByText('Checkbox with label')).toBeInTheDocument();
    });
  });

  describe('Alert Component Coverage', () => {
    test('should render different alert variants', () => {
      render(
        <div>
          <Alert>
            <AlertDescription>Default alert</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertDescription>Destructive alert</AlertDescription>
          </Alert>
        </div>
      );

      expect(screen.getByText('Default alert')).toBeInTheDocument();
      expect(screen.getByText('Destructive alert')).toBeInTheDocument();
    });

    test('should handle alerts with different content', () => {
      render(
        <div>
          <Alert>
            <AlertDescription>
              Alert with <strong>formatted</strong> content
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertDescription>
              <span>Multiple</span> <span>nested</span> <span>elements</span>
            </AlertDescription>
          </Alert>
        </div>
      );

      expect(screen.getByText('formatted')).toBeInTheDocument();
      expect(screen.getByText('Multiple')).toBeInTheDocument();
      expect(screen.getByText('nested')).toBeInTheDocument();
      expect(screen.getByText('elements')).toBeInTheDocument();
    });
  });

  describe('Dialog Component Coverage', () => {
    test('should handle dialog interactions', () => {
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
            <p>Dialog content goes here</p>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Open Dialog'));
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Dialog content goes here')).toBeInTheDocument();
    });

    test('should handle complex dialog content', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Complex Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complex Dialog</DialogTitle>
            </DialogHeader>
            <div>
              <Input placeholder="Input in dialog" />
              <Button>Action in dialog</Button>
              <Alert>
                <AlertDescription>Alert in dialog</AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      );

      fireEvent.click(screen.getByText('Open Complex Dialog'));
      expect(screen.getByPlaceholderText('Input in dialog')).toBeInTheDocument();
      expect(screen.getByText('Action in dialog')).toBeInTheDocument();
      expect(screen.getByText('Alert in dialog')).toBeInTheDocument();
    });
  });

  describe('Accordion Component Coverage', () => {
    test('should handle accordion interactions', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content for section 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content for section 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Section 1'));
      expect(screen.getByText('Content for section 1')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Section 2'));
      expect(screen.getByText('Content for section 2')).toBeInTheDocument();
    });

    test('should handle multiple accordion type', () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Multi Section 1</AccordionTrigger>
            <AccordionContent>Multi content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Multi Section 2</AccordionTrigger>
            <AccordionContent>Multi content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      fireEvent.click(screen.getByText('Multi Section 1'));
      fireEvent.click(screen.getByText('Multi Section 2'));
      
      expect(screen.getByText('Multi content 1')).toBeInTheDocument();
      expect(screen.getByText('Multi content 2')).toBeInTheDocument();
    });
  });

  describe('Component Integration and Edge Cases', () => {
    test('should handle components with ref forwarding', () => {
      const ref = React.createRef<HTMLButtonElement>();
      
      render(<Button ref={ref}>Button with ref</Button>);
      
      expect(screen.getByText('Button with ref')).toBeInTheDocument();
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    test('should handle components with className prop', () => {
      render(
        <div>
          <Button className="custom-button">Custom Button</Button>
          <Badge className="custom-badge">Custom Badge</Badge>
          <Input className="custom-input" placeholder="Custom Input" />
        </div>
      );

      expect(screen.getByText('Custom Button')).toHaveClass('custom-button');
      expect(screen.getByText('Custom Badge')).toHaveClass('custom-badge');
      expect(screen.getByPlaceholderText('Custom Input')).toHaveClass('custom-input');
    });

    test('should handle nested component compositions', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Nested Components</CardTitle>
            <Badge>Status</Badge>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="nested">
                <AccordionTrigger>Nested Accordion</AccordionTrigger>
                <AccordionContent>
                  <div>
                    <Input placeholder="Nested input" />
                    <div>
                      <Button variant="outline">Nested Button</Button>
                      <Checkbox />
                    </div>
                    <Alert>
                      <AlertDescription>Nested alert</AlertDescription>
                    </Alert>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Nested Components')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Nested Accordion'));
      
      expect(screen.getByPlaceholderText('Nested input')).toBeInTheDocument();
      expect(screen.getByText('Nested Button')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Nested alert')).toBeInTheDocument();
    });
  });
}); 