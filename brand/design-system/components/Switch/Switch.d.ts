import * as React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Text beside the track */
  label?: React.ReactNode;
  /** Helper line under the label */
  hint?: React.ReactNode;
  /** 'sm' = 34×20, 'md' = 40×23. Default 'md'. */
  size?: 'sm' | 'md';
  /** 'success' turns the on-state mint instead of blue */
  tone?: 'primary' | 'success';
  /** Settings-row layout: label leads, switch pinned to the end */
  between?: boolean;
}

export declare function Switch(props: SwitchProps): React.ReactElement;
