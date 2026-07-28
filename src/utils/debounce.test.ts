import { describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  it('invokes once after the delay for a burst of calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('passes the latest arguments through', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce<[number]>(fn, 50);

    debounced(1);
    debounced(2);
    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledWith(2);
    vi.useRealTimers();
  });

  it('cancel prevents a pending invocation', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
