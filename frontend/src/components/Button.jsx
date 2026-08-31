import { forwardRef } from 'react';
const VARIANT_CLASSES = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    dark: 'bg-ink-900 text-white hover:bg-black',
    secondary: 'bg-surface text-ink-700 border border-border hover:bg-canvas',
    ghost: 'bg-transparent text-accent hover:bg-accent-soft',
    danger: 'bg-transparent text-red-600 hover:bg-red-50',
    'danger-filled': 'bg-red-600 text-white hover:bg-red-700',
};
const SIZE_CLASSES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
};
export const Button = forwardRef(({ variant = 'secondary', size = 'md', className = '', ...props }, ref) => (<button ref={ref} className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`} {...props}/>));
Button.displayName = 'Button';
