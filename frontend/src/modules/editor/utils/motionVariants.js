/**
 * @file motionVariants.js
 * @description Framer Motion transition tokens, spring physics curves, and animation variants.
 * Powers micro-interactions for popovers, slash command menus, comment cards, and toolbars.
 * @module frontend/src/modules/editor/utils/motionVariants
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file UI animations ke liye Framer Motion variants aur spring physics configuration
 * define karti hai. Popovers, Slash Command menu, comment cards, aur toolbars ko smooth
 * 60fps micro-interactions faraham karti hai.
 */

export const EASE_SNAPPY = [0.16, 1, 0.3, 1];
export const EASE_ENTRANCE = [0.05, 0.7, 0.1, 1];
export const EASE_EXIT = [0.3, 0, 0.8, 0.15];

/**
 * Spring physics parameters tailored for interactive UI widgets.
 *
 * [ROMAN URDU]:
 * Mukhtalif UI components ke liye customized spring stiffness, damping, aur mass tokens.
 */
export const springTokens = {
  snappy: { type: 'spring', stiffness: 450, damping: 30, mass: 0.8 },
  popover: { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 },
  sheet: { type: 'spring', stiffness: 280, damping: 24, mass: 1.0 },
  cursor: { type: 'spring', stiffness: 420, damping: 32, mass: 0.5 },
  avatarStack: { type: 'spring', stiffness: 350, damping: 22, mass: 0.8 },
};

// 1. Popovers, Toolbars & Floating Menus
export const popoverVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -6, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.18, ease: EASE_SNAPPY },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    filter: 'blur(2px)',
    transition: { duration: 0.12, ease: EASE_EXIT },
  },
};

// 2. Command Palette (CMD+K)
export const commandPaletteVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.9 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -10,
    transition: { duration: 0.12, ease: EASE_EXIT },
  },
};

// 3. Staggered Container & Item Cascade
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: EASE_ENTRANCE },
  },
};

// 4. Comment Card List & Resolution Dismissal
export const commentCardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 24 },
  },
  resolved: {
    opacity: 0,
    x: 28,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden',
    transition: {
      opacity: { duration: 0.14, ease: EASE_EXIT },
      height: { duration: 0.2, delay: 0.06, ease: [0.32, 0, 0.67, 0] },
      marginBottom: { duration: 0.2, delay: 0.06 },
    },
  },
};

// 5. Accordion Reply Thread
export const accordionThreadVariants = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.24, ease: EASE_ENTRANCE },
      opacity: { duration: 0.18, delay: 0.06 },
    },
  },
};

// 6. Task Checkbox SVG Strikethrough & Path Draw
export const checkboxPathVariants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.18, ease: EASE_SNAPPY },
  },
};
