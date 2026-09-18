import * as React from 'react';

export type ProgressVariant =
  | 'primary' | 'accent' | 'success' | 'warning'
  | 'danger' | 'violet' | 'expiring' | 'brand';

export type ProgressSize = 'sm' | 'md' | 'lg';

/** Offline-default sync states. `syncing` adds the moving stripe. */
export type ProgressState = 'syncing' | 'paused' | 'queued';

export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 0–100. Omit (or null) for an indeterminate loading bar. */
  value?: number | null;
  /** Semantic fill color. `brand` uses the full brand gradient. */
  variant?: ProgressVariant;
  /** Track + fill height. sm = 5px, md = 8px, lg = 12px. */
  size?: ProgressSize;
  /** Caption above the track. */
  label?: React.ReactNode;
  /** Show the % value on the right of the header row. */
  showValue?: boolean;
  /** Force the indeterminate animation even when a value is set. */
  indeterminate?: boolean;
  /** Moving diagonal stripe — reads as "actively syncing". */
  striped?: boolean;
  /** Sync-flow convenience: syncing (striped) · paused (amber) · queued (muted). */
  state?: ProgressState;
  /** Format the displayed value. Default `${Math.round(v)}%`. */
  format?: (value: number) => string;
}

export declare function Progress(props: ProgressProps): React.ReactElement;

export interface ProgressRingProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 0–100. */
  value?: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke width in px. */
  thickness?: number;
  variant?: ProgressVariant;
  /** Render the % in the center. */
  showValue?: boolean;
  format?: (value: number) => string;
  label?: string;
}

export declare function ProgressRing(props: ProgressRingProps): React.ReactElement;
