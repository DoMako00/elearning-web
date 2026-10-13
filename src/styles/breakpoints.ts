/**
 * GreenLearn LMS — Canonical Breakpoint System
 *
 * Single source of truth for responsive thresholds across JS and CSS:
 * - Mobile:               < 768px       (phone viewports, bottom navigation bar)
 * - iPad / Tablet:        768px–1399px  (iPad Mini, iPad Air, iPad Pro portrait & landscape)
 * - Desktop Zero-Scroll:  >= 1400px     (strict viewport-locked layout: 1920x1080, 1920x822, etc.)
 */

export const BREAKPOINTS = {
  /** Maximum width for mobile devices (< 768px) */
  MOBILE_MAX: 767,
  /** Minimum width for tablets and iPads (768px) */
  TABLET_MIN: 768,
  /** Maximum width for tablets and iPads (1399px) */
  TABLET_MAX: 1399,
  /** Minimum width for zero-scroll desktop layouts (1400px) */
  DESKTOP_MIN: 1400,
} as const;

/** Media query strings for window.matchMedia */
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.MOBILE_MAX}px)`,
  tablet: `(min-width: ${BREAKPOINTS.TABLET_MIN}px) and (max-width: ${BREAKPOINTS.TABLET_MAX}px)`,
  tabletAndBelow: `(max-width: ${BREAKPOINTS.TABLET_MAX}px)`,
  desktop: `(min-width: ${BREAKPOINTS.DESKTOP_MIN}px)`,
} as const;
