import React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 cursor-pointer select-none',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';
