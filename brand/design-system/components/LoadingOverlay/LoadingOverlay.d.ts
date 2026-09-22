import * as React from 'react';

export interface LoadingOverlayProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Mounted only when true. */
  open?: boolean;
  /** cream = warm surface · scrim = translucent ink · brand = watercolor. */
  variant?: 'cream' | 'scrim' | 'brand';
  message?: React.ReactNode;
  submessage?: React.ReactNode;
  /** 0–100 → renders a determinate progress bar under the message. */
  progress?: number | null;
  /** Renders an indeterminate bar instead. */
  indeterminate?: boolean;
  /** Loader style. */
  spinner?: 'mark' | 'ring';
  /** Cover a positioned parent (absolute) instead of the viewport (fixed). */
  contained?: boolean;
  /** Background image URL for variant="brand" (the watercolor pattern). */
  backgroundImage?: string;
}

export declare function LoadingOverlay(props: LoadingOverlayProps): React.ReactElement | null;
