/**
 * @file useSmartBack.js
 * @description Smart back navigation hook with route hierarchy and browser history state verification.
 * Route hierarchy aur browser history state ki tasdeeq ke sath smart back navigation hook.
 */

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Root routes where back navigation should not pop browser history to prevent
 * unexpectedly exiting the application or returning to authenticated auth pages.
 *
 * Bunyadi (root) routes jahan back navigation browser history ko pop nahi karegi
 * taake user ghalati se app se bahir na nikal jaye ya login page par wapis na chala jaye.
 *
 * @type {string[]}
 */
export const ROOT_ROUTES = ['/'];

/**
 * Route hierarchy configuration mapping child route patterns to parent routes.
 * Route hierarchy configuration jo child route patterns ko unkay parent routes se jorhti hai.
 *
 * @type {Array<{ pattern: RegExp, getParent: (match: RegExpMatchArray, pathname: string) => string }>}
 */
export const ROUTE_HIERARCHY = [
  // Dashboard page -> Login page
  // Dashboard safah -> Login safah
  {
    pattern: /^\/dashboard\/?$/,
    getParent: () => '/login',
  },
  // Workspace Sharing page -> Workspace Overview page
  // Workspace Sharing safah -> Workspace Overview safah
  {
    pattern: /^\/workspaces\/([^/]+)\/sharing\/?$/,
    getParent: (match) => `/workspaces/${match[1]}`,
  },
  // Workspace Overview page -> Workspace List page
  // Workspace Overview safah -> Workspaces ki fehrist
  {
    pattern: /^\/workspaces\/[^/]+\/?$/,
    getParent: () => '/workspaces',
  },
  // Workspace List page -> Dashboard
  // Workspaces fehrist safah -> Dashboard
  {
    pattern: /^\/workspaces\/?$/,
    getParent: () => '/dashboard',
  },
  // Document Editor -> Dashboard
  // Document Editor safah -> Dashboard
  {
    pattern: /^\/editor(\/[^/]+)?\/?$/,
    getParent: () => '/dashboard',
  },
  // File Manager page -> Dashboard
  // File Manager safah -> Dashboard
  {
    pattern: /^\/files\/?$/,
    getParent: () => '/dashboard',
  },
  // Settings page -> Dashboard
  // Settings safah -> Dashboard
  {
    pattern: /^\/settings\/?$/,
    getParent: () => '/dashboard',
  },
];

/**
 * Resolves the canonical hierarchical parent route for a given pathname.
 * Diye gaye pathname ke liye hierarchal parent route talash karta hai.
 *
 * @param {string} pathname - Current URL pathname / Mojooda URL pathname.
 * @returns {string|null} Canonical parent route or null / Walid route agar match ho, ya null.
 */
export function getHierarchicalFallback(pathname) {
  if (!pathname) return null;
  for (const entry of ROUTE_HIERARCHY) {
    const match = pathname.match(entry.pattern);
    if (match) {
      return entry.getParent(match, pathname);
    }
  }
  return null;
}

/**
 * Custom hook providing smart navigation with history awareness and hierarchical fallbacks.
 * Checks window.history.state?.idx > 0 to determine whether internal history exists.
 * If no internal history exists or the user is on root routes, safely navigates to a canonical fallback route (e.g. /dashboard).
 *
 * Yeh custom hook smart navigation faraham karta hai jo browser history aur route hierarchy ko check karta hai.
 * Yeh window.history.state?.idx > 0 ki janch karta hai taake pata chal sakay ke internal history mojood hai ya nahi.
 * Agar history mojood na ho ya user root route par ho to mehfooz tareeqay se canonical fallback route (maslan /dashboard) par bhej deta hai.
 *
 * @param {string} [defaultFallback='/dashboard'] - Canonical fallback route / Default fallback route.
 * @returns {((overrideFallback?: string) => void) & { goBack: (overrideFallback?: string) => void, canGoBack: boolean, fallbackRoute: string }}
 */
export function useSmartBack(defaultFallback = '/dashboard') {
  const navigate = useNavigate();
  const location = useLocation();

  const hierarchicalFallback = getHierarchicalFallback(location.pathname);
  const canonicalFallback = hierarchicalFallback || defaultFallback;

  const isRootRoute = ROOT_ROUTES.includes(location.pathname);
  const hasInternalHistory =
    typeof window !== 'undefined' &&
    typeof window.history?.state?.idx === 'number' &&
    window.history.state.idx > 0;

  const goBack = useCallback(
    (overrideFallback) => {
      let targetFallback = overrideFallback || canonicalFallback;
      // Prevent open redirect vulnerabilities: enforce relative application paths
      if (typeof targetFallback !== 'string' || !targetFallback.startsWith('/') || targetFallback.startsWith('//')) {
        targetFallback = canonicalFallback;
      }

      // If currently on a root route, popping history might leave the application or return to auth pages.
      // Safely redirect to canonical fallback instead.
      if (isRootRoute) {
        navigate(targetFallback, { replace: true });
        return;
      }

      // If internal history exists in this session, safely go back in history.
      if (hasInternalHistory) {
        navigate(-1);
        return;
      }

      // No internal history exists; navigate to fallback route.
      navigate(targetFallback);
    },
    [navigate, canonicalFallback, isRootRoute, hasInternalHistory]
  );

  // Support both direct function call `const goBack = useSmartBack()` and destructuring `const { goBack } = useSmartBack()`.
  return Object.assign(goBack, {
    goBack,
    canGoBack: hasInternalHistory && !isRootRoute,
    fallbackRoute: canonicalFallback,
  });
}

export default useSmartBack;
