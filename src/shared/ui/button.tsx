import React, { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './cn.util';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6] focus:ring-[#0052CC]',
      secondary:
        'bg-[#EBECF0] text-[#172B4D] hover:bg-[#091E4214] active:bg-[#091E4224] focus:ring-[#6B778C]',
      subtle:
        'bg-transparent text-[#172B4D] hover:bg-[#091E4214] active:bg-[#091E4224] focus:ring-[#6B778C]',
      danger: 'bg-[#DE350B] text-white hover:bg-[#FF5630] active:bg-[#BF2600] focus:ring-[#DE350B]',
    };

    const sizes = {
      sm: 'h-7 px-2.5 text-xs',
      md: 'h-8 px-3 text-sm',
      lg: 'h-10 px-4 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
