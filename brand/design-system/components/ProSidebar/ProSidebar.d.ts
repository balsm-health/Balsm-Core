import * as React from 'react';

export interface ProSidebarNavItem {
  /** Stable id; compared against `active`. */
  id: string;
  label: React.ReactNode;
  /** Lucide icon name (kebab or Pascal) or any React node. */
  icon?: string | React.ReactNode;
  /** Optional trailing count / badge (e.g. "47", "12 ↓", "3"). */
  count?: string | number;
  /** Overrides the sidebar's onNavigate for this item. */
  onClick?: (id: string) => void;
}

export interface ProSidebarGroup {
  /** Uppercase section label (e.g. "Pharmacy", "Operations", "System"). */
  label: React.ReactNode;
  items: ProSidebarNavItem[];
}

export interface ProSidebarIdentity {
  initials: string;
  /** Workspace/entity name, or person name for the account row. */
  name: React.ReactNode;
  /** Branch line for the workspace row. */
  branch?: React.ReactNode;
  /** Role line for the account row. */
  role?: React.ReactNode;
  /** Avatar background color (a petal hue). */
  color?: string;
  onClick?: () => void;
}

export interface ProSidebarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  dir?: 'ltr' | 'rtl';
  brand?: string;
  brandTld?: string;
  /** Custom logo URL; omit to use the inline Balsm mark. */
  logoSrc?: string | null;
  /** Workspace / entity switcher at the top. Omit to hide. */
  workspace?: ProSidebarIdentity | null;
  /** Grouped navigation. Each module passes its own. */
  groups?: ProSidebarGroup[];
  /** Active nav item id. */
  active?: string | null;
  /** Fired when a nav item without its own onClick is selected. */
  onNavigate?: (id: string) => void;
  /** Account / profile switcher in the footer. Omit to hide. */
  account?: ProSidebarIdentity | null;
  /** Sidebar width in px. Default 240. */
  width?: number;
}

/**
 * Shared left-navigation chrome for every Balsm-Pro module
 * (Pharmacy POS, Inventory, Clinic, Roles, Workspace, Reports…).
 * Configure per module via `groups` + `active`; brand, workspace
 * switcher, and account footer stay consistent across modules.
 */
export declare function ProSidebar(props: ProSidebarProps): React.ReactElement;
