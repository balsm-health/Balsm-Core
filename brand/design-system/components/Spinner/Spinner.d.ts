import * as React from 'react';

export type SpinnerVariant = 'primary' | 'accent' | 'success' | 'violet' | 'ink';

export interface SpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Diameter in px. Default 28. */
  size?: number;
  /** Ring stroke width in px. Defaults to ~size/9. */
  thickness?: number;
  variant?: SpinnerVariant;
  /** Optional caption rendered beneath the ring. */
  label?: React.ReactNode;
}

export declare function Spinner(props: SpinnerProps): React.ReactElement;

export interface PetalSpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 'sm' (28) · 'md' (48) · 'lg' (72) · or a px number. */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Optional caption rendered beneath the mark. */
  label?: React.ReactNode;
}

/** The Balsm mark, slowly rotating — brand / full-screen loading. */
export declare function PetalSpinner(props: PetalSpinnerProps): React.ReactElement;
