import type React from 'react';
import type { HTMLAttributes } from 'react';
import { labelColors } from './atlassian-tokens';
import { cn } from './cn.util';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: keyof typeof labelColors | string;
}

export const Badge: React.FC<BadgeProps> = ({
  color = 'blue',
  className,
  children,
  style,
  ...props
}) => {
  const predefined = labelColors[color];
  const customStyle = predefined
    ? { backgroundColor: predefined.bg, color: predefined.text, ...style }
    : { backgroundColor: color, color: '#FFFFFF', ...style };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold select-none shadow-sm',
        className,
      )}
      style={customStyle}
      {...props}
    >
      {children}
    </span>
  );
};
