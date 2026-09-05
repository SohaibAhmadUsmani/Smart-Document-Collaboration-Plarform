import React, { forwardRef, memo } from 'react';

const VARIANT_CLASSES = {
  primary: 'bg-accent text-white hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent',
  dark: 'bg-ink-900 text-white hover:bg-black focus-visible:ring-2 focus-visible:ring-ink-900',
  secondary: 'bg-surface text-ink-700 border border-border hover:bg-canvas focus-visible:ring-2 focus-visible:ring-border',
  ghost: 'bg-transparent text-accent hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent',
  danger: 'bg-transparent text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500',
  'danger-filled': 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button = memo(
  forwardRef(
    (
      {
        type = 'button',
        variant = 'secondary',
        size = 'md',
        className = '',
        disabled = false,
        isLoading = false,
        children,
        ...props
      },
      ref
    ) => {
      const isDisabled = disabled || isLoading;

      return (
        <button
          ref={ref}
          type={type}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-busy={isLoading}
          className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.secondary} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
          {...props}
        >
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {children}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

