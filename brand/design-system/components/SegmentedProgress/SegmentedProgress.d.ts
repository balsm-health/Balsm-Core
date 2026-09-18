import * as React from 'react';

export type MeterColor = 'aqua' | 'blue' | 'mint' | 'violet' | 'emerald' | 'sun' | 'danger' | 'ink';

export interface MeterSegment {
  label: React.ReactNode;
  value: number;
  /** Named brand-hue/semantic color. */
  color?: MeterColor;
  /** Raw CSS color override (wins over `color`). */
  hex?: string;
}

export interface SegmentedProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  segments: MeterSegment[];
  /** Cap value; defaults to the sum of segment values. */
  total?: number;
  title?: React.ReactNode;
  /** Show sum / total on the right of the header. */
  showTotal?: boolean;
  showLegend?: boolean;
  /** Show each segment's value in the legend. */
  showValues?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Render segments as separated pills instead of a continuous bar. */
  gap?: boolean;
  /** Format numbers in the total + legend. */
  format?: (value: number) => React.ReactNode;
  /** Override the header total text entirely. */
  totalLabel?: React.ReactNode;
}

export declare function SegmentedProgress(props: SegmentedProgressProps): React.ReactElement;
