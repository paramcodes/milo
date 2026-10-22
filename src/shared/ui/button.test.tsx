import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined();
  });

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button', { name: 'Primary' });
    expect(btn.className).toContain('bg-[#0052CC]');
  });

  it('renders subtle variant', () => {
    render(<Button variant="subtle">Subtle</Button>);
    const btn = screen.getByRole('button', { name: 'Subtle' });
    expect(btn.className).toContain('hover:bg-[#091E4214]');
  });
});
