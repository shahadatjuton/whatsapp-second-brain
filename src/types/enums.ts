/** Todo priority levels, ordered low → high for sorting. */
export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Numeric weight for sorting todos by priority (high first). */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** UI theme. */
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Sidebar sections. */
export const SECTIONS = ['notes', 'todos', 'reminders', 'settings'] as const;
export type Section = (typeof SECTIONS)[number];
