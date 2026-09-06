import React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-blue-50 text-blue-700 border-blue-200/80',
  secondary: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  destructive: 'bg-rose-50 text-rose-700 border-rose-200',
  outline: 'text-gray-900 border-gray-300',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all',
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
