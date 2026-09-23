import * as React from 'react';

export type CardSize = 'sm' | 'md' | 'lg';
export type CardAccent = 'primary' | 'success' | 'warning' | 'danger' | 'brand';
export type MetricDirection = 'up' | 'down' | 'flat';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Header title. Omit (with actions) to render no header at all. */
  title?: React.ReactNode;
  /** Secondary line under the title */
  subtitle?: React.ReactNode;
  /** Right-aligned header controls — icon buttons, badges, menus */
  actions?: React.ReactNode;
  /** Footer content, usually buttons. Renders a bordered muted bar. */
  footer?: React.ReactNode;
  /** Padding scale. Default 'md'. */
  size?: CardSize;
  /** Hairline of clinical meaning along the top edge */
  accent?: CardAccent;
  /** Render as a <button> with hover/active/focus states */
  interactive?: boolean;
  /** Selected state — primary border ring */
  selected?: boolean;
  /** Drop the header/footer divider lines */
  flush?: boolean;
  /** Sets interactive automatically */
  onClick?: () => void;
  children?: React.ReactNode;
}

export interface MetricCardProps extends Omit<CardProps, 'title' | 'children'> {
  /** Uppercase label above the number */
  label: React.ReactNode;
  /** The number itself — rendered in display type, tabular figures */
  value: React.ReactNode;
  /** Change indicator, e.g. "12% vs last week" */
  delta?: React.ReactNode;
  /** Colors + arrow for the delta. Default 'flat'. */
  direction?: MetricDirection;
}

export declare function Card(props: CardProps): React.ReactElement;
export declare function MetricCard(props: MetricCardProps): React.ReactElement;
