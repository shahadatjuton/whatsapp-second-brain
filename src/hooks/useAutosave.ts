import { useEffect, useRef } from 'react';

/**
 * Debounced autosave. Calls `onSave` `delay` ms after `value` stops changing —
 * never on mount, and never when the value matches what was last saved. This
 * powers the "no save button" note editor (PRD: "Autosave every second").
 *
 * `onSave` should be memoised by the caller so it doesn't reset the timer.
 */
export function useAutosave<T>(value: T, onSave: (value: T) => void, delay = 1000): void {
  const lastSaved = useRef<T>(value);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      lastSaved.current = value;
      return;
    }
    if (value === lastSaved.current) return;

    const timer = setTimeout(() => {
      lastSaved.current = value;
      onSave(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, onSave]);
}
