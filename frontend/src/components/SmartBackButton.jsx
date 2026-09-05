import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSmartBack } from '../app/useSmartBack.js';

/**
 * SmartBackButton Component
 *
 * English:
 * An intelligent back button that checks browser navigation history and route hierarchy
 * before navigating. If the user opened the page directly or history stack is empty, it safely
 * falls back to a defined fallback route (e.g. /dashboard or /workspaces) to prevent leaving the application.
 *
 * Roman Urdu:
 * Ye aik smart back navigation button hai jo browser history stack aur route hierarchy check karta hai.
 * Agar user direct kisi link par aya ho ya previous history na ho, to ye application se bahar janey ke bajaye
 * diye gaye fallback route (jaise ke /dashboard ya /workspaces) par bhej deta hai.
 *
 * @param {Object} props
 * @param {string} [props.fallbackPath='/dashboard'] - Safe fallback route path if no browser history exists.
 * @param {string} [props.title='Go Back'] - Tooltip text shown on hover.
 * @param {string} [props.ariaLabel='Go Back'] - Accessible label for screen readers.
 * @param {string} [props.className=''] - Additional custom CSS utility classes.
 * @param {() => void} [props.onClick] - Optional custom click handler invoked prior to navigation.
 * @param {React.ReactNode} [props.children] - Optional custom icon or text content.
 * @returns {JSX.Element}
 */
export function SmartBackButton({
  fallbackPath = '/dashboard',
  title = 'Go Back',
  ariaLabel = 'Go Back',
  className = '',
  onClick,
  children,
  ...props
}) {
  const goBack = useSmartBack(fallbackPath);

  const handleBack = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (e?.defaultPrevented) return;

    goBack(fallbackPath);
  };

  const defaultClasses =
    'inline-flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer';

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className ? `${defaultClasses} ${className}` : defaultClasses}
      title={title}
      aria-label={ariaLabel}
      {...props}
    >
      {children || <ArrowLeft size={18} />}
    </button>
  );
}

export default SmartBackButton;
