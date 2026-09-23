import * as React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarTone = 'aqua' | 'emerald' | 'blue' | 'mint' | 'violet' | 'brand';
export type AvatarStatus = 'online' | 'offline' | 'syncing';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Full name — drives initials, tooltip, and the derived tone */
  name?: string;
  /** Override the derived initials */
  initials?: string;
  /** Photo URL. Replaces initials when present. */
  src?: string;
  /** Image alt text. Defaults to name. */
  alt?: string;
  /** Default 'md' (36px). xs 22 · sm 28 · lg 46 · xl 64. */
  size?: AvatarSize;
  /** Override the name-derived tone */
  tone?: AvatarTone;
  /** Rounded square instead of a circle — for orgs, not people */
  square?: boolean;
  /** Corner dot: presence, or offline-sync state */
  status?: AvatarStatus;
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Names, or full Avatar prop objects */
  people: Array<string | (AvatarProps & { id?: string })>;
  /** How many to show before collapsing into "+N". Default 4. */
  max?: number;
  size?: AvatarSize;
  /** Heavier overlap */
  tight?: boolean;
}

/** Deterministic tone for a name — same person, same color, everywhere */
export declare function toneFor(name: string): AvatarTone;
/** "Mona Hassan" → "MH" */
export declare function initialsFor(name: string): string;
export declare function Avatar(props: AvatarProps): React.ReactElement;
export declare function AvatarGroup(props: AvatarGroupProps): React.ReactElement;
