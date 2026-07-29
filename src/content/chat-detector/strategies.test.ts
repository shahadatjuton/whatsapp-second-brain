import { describe, expect, it } from 'vitest';
import type { ChatContext } from '@/types/models';
import { decideChatChange, deriveDisplayName, parseJidFromDataId } from './strategies';

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

  it('extracts newer JID domains (lid, newsletter)', () => {
    expect(parseJidFromDataId('false_12345678@lid_3EB0')).toBe('12345678@lid');
    expect(parseJidFromDataId('false_120363000@newsletter_ABC')).toBe('120363000@newsletter');
  });

  it('returns null when no JID-like segment is present', () => {
    expect(parseJidFromDataId('some-random-id')).toBeNull();
    expect(parseJidFromDataId('')).toBeNull();
  });

  it('rejects email-like strings (must start with a digit)', () => {
    expect(parseJidFromDataId('false_someone@example.com_123')).toBeNull();
    expect(parseJidFromDataId('reply_user@gmail.com_x')).toBeNull();
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

describe('decideChatChange', () => {
  const chatA: ChatContext = { chatId: 'a@c.us', chatName: 'Alice' };
  const chatB: ChatContext = { chatId: 'b@c.us', chatName: 'Bob' };

  it('emits when a chat is first detected', () => {
    expect(decideChatChange({ conversationOpen: true, context: chatA, lastChatId: null })).toEqual({
      nextChatId: 'a@c.us',
      emit: chatA,
    });
  });

  it('does NOT clear the chat on a transient resolution miss (the reported bug)', () => {
    // Conversation is still open, but selectors returned nothing this tick.
    expect(
      decideChatChange({ conversationOpen: true, context: null, lastChatId: 'a@c.us' }),
    ).toBeNull();
  });

  it('is a no-op when the same chat resolves again', () => {
    expect(
      decideChatChange({ conversationOpen: true, context: chatA, lastChatId: 'a@c.us' }),
    ).toBeNull();
  });

  it('emits the new chat when switching conversations', () => {
    expect(
      decideChatChange({ conversationOpen: true, context: chatB, lastChatId: 'a@c.us' }),
    ).toEqual({ nextChatId: 'b@c.us', emit: chatB });
  });

  it('clears to null only when the conversation pane is gone', () => {
    expect(
      decideChatChange({ conversationOpen: false, context: null, lastChatId: 'a@c.us' }),
    ).toEqual({ nextChatId: null, emit: null });
  });

  it('stays null when no conversation is open and none was active', () => {
    expect(
      decideChatChange({ conversationOpen: false, context: null, lastChatId: null }),
    ).toBeNull();
  });
});
