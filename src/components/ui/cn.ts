export type ClassValue = string | number | false | null | undefined;

/**
 * Tiny classname combiner — filters out falsy values so conditional Tailwind
 * classes read cleanly: `cn('base', isActive && 'active')`. Kept dependency-free
 * to respect the fixed tech stack.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
