/**
 * Tiny namespaced logger. Centralizing logging keeps `no-console` violations out
 * of feature code and gives us one place to disable output in production.
 */
const PREFIX = '[WA Second Brain]';

export const logger = {
  info(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]): void {
    console.error(PREFIX, ...args);
  },
};
