import React from 'react';
import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className, ...props }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }[size] || 'w-6 h-6 border-2';

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-current border-t-transparent text-current inline-block',
        sizeClasses,
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}
