import * as React from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalTone = 'danger' | 'warning' | 'info' | 'success';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders nothing when false */
  open: boolean;
  /** Called by Escape, the × button, and a scrim click */
  onClose?: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Severity glyph above the title — pair with tone */
  icon?: React.ReactNode;
  /** Tints the icon bubble. Default 'info'. */
  tone?: ModalTone;
  /** sm 380 · md 460 · lg 640 · xl 860 (px max-width) */
  size?: ModalSize;
  /** Footer content, usually buttons */
  footer?: React.ReactNode;
  /** Split the footer — destructive action left, confirm right */
  footerBetween?: boolean;
  /** Set false for flows that must be completed. Default true. */
  closeOnScrim?: boolean;
  /** Hide the × button. Default true (shown). */
  showClose?: boolean;
  /** id of an external element labelling the dialog */
  labelledBy?: string;
  children?: React.ReactNode;
}

export declare function Modal(props: ModalProps): React.ReactElement | null;
