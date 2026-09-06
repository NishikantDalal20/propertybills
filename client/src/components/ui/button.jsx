import React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  default: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]',
  destructive: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-[0.98]',
  outline: 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.98]',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200/80 active:scale-[0.98]',
  ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  link: 'text-blue-600 underline-offset-4 hover:underline',
  success: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98]',
};

const buttonSizes = {
  default: 'h-10 px-4 py-2 text-sm rounded-xl',
  sm: 'h-8 px-3 text-xs rounded-lg',
  lg: 'h-12 px-6 text-base rounded-xl',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center',
};

export const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  disabled = false,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        buttonVariants[variant] || buttonVariants.default,
        buttonSizes[size] || buttonSizes.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
