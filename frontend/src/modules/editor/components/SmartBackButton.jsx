/**
 * @file SmartBackButton.jsx
 * @description Resilient back navigation button with route hierarchy and history verification.
 * Ensures the user is safely redirected to a fallback path (e.g., /workspaces or /dashboard)
 * if browser history entry does not exist (direct URL visits, bookmark, or refreshed tab).
 * @module frontend/src/modules/editor/components/SmartBackButton
 *
 * [ROMAN URDU]:
 * Yeh component intelligent back button navigation provide karta hai.
 * Browser history aur route hierarchy check karke `navigate(-1)` karta hai agar history mojood ho.
 * Agar user ne direct link open ki ho ya refresh kiya ho, toh history na hone par
 * blank screen ya app se bahar nikalne ke bajaye specify kiye gaye `fallbackPath` par
 * safe redirect karta hai.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSmartBack } from '../../../app/useSmartBack.js';

/**
 * SmartBackButton Component
 *
 * @param {Object} props
 * @param {string} [props.fallbackPath='/workspaces'] - Route to navigate to if no prior history entry exists
 * @param {string} [props.className] - CSS classes for the button
 * @param {string} [props.title='Go Back'] - Tooltip and accessible label
 * @param {React.ComponentType} [props.icon=ArrowLeft] - Icon component to render
 * @param {string} [props.iconClass='w-4 h-4'] - CSS class for the icon
 * @param {React.ReactNode} [props.children] - Optional custom children
 * @param {Function} [props.onClick] - Optional additional click handler
 * @returns {React.JSX.Element}
 */
export function SmartBackButton({
  fallbackPath = '/workspaces',
  className = 'p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors',
  title = 'Go Back',
  icon: Icon = ArrowLeft,
  iconClass = 'w-4 h-4',
  children,
  onClick,
  ...rest
}) {
  const goBack = useSmartBack(fallbackPath);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (e?.defaultPrevented) return;
    goBack(fallbackPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      title={title}
      aria-label={title}
      {...rest}
    >
      {children || (Icon ? <Icon className={iconClass} /> : null)}
    </button>
  );
}

export default SmartBackButton;
