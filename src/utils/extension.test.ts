import { afterEach, describe, expect, it, vi } from 'vitest';
import { isExtensionContextValid } from './extension';

describe('isExtensionContextValid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when chrome is undefined', () => {
    expect(isExtensionContextValid()).toBe(false);
  });

  it('is true when chrome.runtime.id is present', () => {
    vi.stubGlobal('chrome', { runtime: { id: 'abc123' } });
    expect(isExtensionContextValid()).toBe(true);
  });

  it('is false when the context is invalidated (no runtime id)', () => {
    vi.stubGlobal('chrome', { runtime: {} });
    expect(isExtensionContextValid()).toBe(false);
  });

  it('is false when accessing chrome.runtime throws', () => {
    vi.stubGlobal('chrome', {
      get runtime(): never {
        throw new Error('Extension context invalidated');
      },
    });
    expect(isExtensionContextValid()).toBe(false);
  });
});
