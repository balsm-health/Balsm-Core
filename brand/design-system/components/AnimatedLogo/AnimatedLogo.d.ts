import * as React from 'react';

export type LogoIdle = 'breathe' | 'rotate' | 'none';

/** Reveal (entrance) styles. Petal-staggered: bloom, cascade, pop, wave,
 *  unwind. Whole-mark: fade, spin-in, iris. Creative: liquid, heartbeat,
 *  orbit, fold, develop, magnetic, draw. */
export type LogoVariant =
  | 'bloom'    // signature clockwise unfurl + untwist from the hub
  | 'cascade'  // calm sequential grow, no rotation
  | 'pop'      // near-simultaneous scale-in with overshoot
  | 'wave'     // a pulse ripples figure to figure
  | 'unwind'   // figures spiral open from a tight twist
  | 'fade'     // minimal soft fade + lift (whole mark)
  | 'spin-in'  // the mark rotates into place like a pinwheel
  | 'iris'     // a circular reveal opens from the hub
  | 'liquid'    // balm drops fall in and settle with a squash
  | 'heartbeat' // a cardiac lub-dub brings the whole mark to life
  | 'orbit'     // figures swirl in from a wide orbit
  | 'fold'      // figures unfold open like paper
  | 'develop'   // surfaces from grayscale into full color, figure by figure
  | 'magnetic'  // figures fly in from their own side and snap home
  | 'draw';     // each figure draws its outline, then fills

export interface AnimatedLogoProps {
  /** Rendered size in px (number) or any CSS length (string). Square. */
  size?: number | string;
  /** Reveal (entrance) style played on mount / replay. Default 'bloom'. */
  variant?: LogoVariant;
  /** Play the reveal on mount. Set false for a static mark. */
  autoplay?: boolean;
  /** Idle behaviour after the bloom settles.
   *  'breathe' = soft scale pulse · 'rotate' = slow spin (loader) · 'none' */
  idle?: LogoIdle;
  /** Speed multiplier for the whole sequence (2 = twice as fast). */
  speed?: number;
  /** Render every figure in one color (monochrome mark) instead of brand colors. */
  color?: string;
  /** Soft radial halo that blooms with the mark — for dark hero backgrounds. */
  glow?: boolean;
  /** Change this value (number/string/bool) to replay the bloom from the start. */
  replay?: unknown;
  /** Accessible label / <title>. Pass '' to omit. Default 'Balsm'. */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The Balsm mark, animated. Five figures reveal from the shared hub with
 * the chosen `variant`, then settle into a calm idle. Honors
 * prefers-reduced-motion (renders the finished mark, no motion).
 */
export declare function AnimatedLogo(props: AnimatedLogoProps): React.ReactElement;
