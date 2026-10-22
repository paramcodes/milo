import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn.util';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded border bg-white px-3 py-1 text-sm text-[#172B4D] placeholder:text-[#6B778C] transition-colors',
          'border-[#DFE1E6] hover:bg-[#FAFBFC] focus:outline-none focus:border-[#4C9AFF] focus:ring-1 focus:ring-[#4C9AFF]',
          'disabled:cursor-not-allowed disabled:bg-[#F4F5F7] disabled:text-[#A5ADBA]',
          error && 'border-[#DE350B] focus:border-[#DE350B] focus:ring-[#DE350B]',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
