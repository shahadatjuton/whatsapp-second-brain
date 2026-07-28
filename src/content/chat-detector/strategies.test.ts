import { describe, expect, it } from 'vitest';
import { deriveDisplayName, parseJidFromDataId } from './strategies';

describe('parseJidFromDataId', () => {
  it('extracts an individual chat JID', () => {
    expect(parseJidFromDataId('false_919876543210@c.us_3EB0C767D82B0F1D2A34')).toBe(
      '919876543210@c.us',
    );
  });

  it('extracts a group chat JID', () => {
    expect(parseJidFromDataId('true_120363012345678901@g.us_3EB0ABCDEF')).toBe(
      '120363012345678901@g.us',
    );
  });

  it('returns null when no JID-like segment is present', () => {
    expect(parseJidFromDataId('some-random-id')).toBeNull();
    expect(parseJidFromDataId('')).toBeNull();
  });

  it('rejects segments with an unknown domain', () => {
    expect(parseJidFromDataId('false_someone@example.com_123')).toBeNull();
  });
});

describe('deriveDisplayName', () => {
  it('formats an individual JID as a phone number', () => {
    expect(deriveDisplayName('919876543210@c.us')).toBe('+919876543210');
  });

  it('labels group JIDs generically', () => {
    expect(deriveDisplayName('120363012345678901@g.us')).toBe('Group chat');
  });

  it('unwraps a name-prefixed fallback id', () => {
    expect(deriveDisplayName('name:Alice Smith')).toBe('Alice Smith');
  });
});
