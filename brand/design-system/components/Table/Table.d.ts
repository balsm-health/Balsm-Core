import * as React from 'react';

export type TableDensity = 'dense' | 'md' | 'roomy';
export type ColumnPriority = 'high' | 'med' | 'low';

export interface TableColumn<T = any> {
  /** Row property to read, and the column's identity for sorting */
  key: string;
  /** Header text */
  label: React.ReactNode;
  /** Custom cell renderer — receives the whole row */
  render?: (row: T, index: number) => React.ReactNode;
  /**
   * Drop order as the container narrows: 'low' leaves below 640px,
   * 'med' below 460px. Dropped values restate under the first cell.
   * Default 'high' (never dropped).
   */
  priority?: ColumnPriority;
  /** End-align + tabular figures */
  numeric?: boolean;
  /** Mono type — batch codes, IDs, barcodes */
  mono?: boolean;
  /** Show a sort control in the header (requires onSort) */
  sortable?: boolean;
  width?: string | number;
  className?: string;
}

export interface TableProps<T = any> extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'onSelect'> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Row property name, or a function, giving a stable key */
  rowKey?: string | ((row: T, index: number) => string | number);
  /** Row height. Default 'md'. */
  density?: TableDensity;
  zebra?: boolean;
  /** Row hover tint. Default true. */
  hover?: boolean;
  /** Header sticks while the body scrolls */
  sticky?: boolean;
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  onRowClick?: (row: T, index: number) => void;
  /** Keys of highlighted rows */
  selectedKeys?: Array<string | number> | null;
  /** Shown in place of the body when rows is empty */
  empty?: React.ReactNode;
  caption?: React.ReactNode;
}

export declare function Table<T = any>(props: TableProps<T>): React.ReactElement;
