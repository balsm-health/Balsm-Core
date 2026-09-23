import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Text beside the box */
  label?: React.ReactNode;
  /** Smaller helper line under the label */
  hint?: React.ReactNode;
  /** Mixed state — for a "select all" over a partial selection */
  indeterminate?: boolean;
  /** Red border; pair with a form-level error message */
  error?: boolean;
  /** 'sm' = 16px box, 'md' = 18px. Default 'md'. */
  size?: 'sm' | 'md';
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  size?: 'sm' | 'md';
}

export interface CheckGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lay out horizontally instead of stacked */
  row?: boolean;
  children: React.ReactNode;
}

export declare function Checkbox(props: CheckboxProps): React.ReactElement;
export declare function Radio(props: RadioProps): React.ReactElement;
export declare function CheckGroup(props: CheckGroupProps): React.ReactElement;
