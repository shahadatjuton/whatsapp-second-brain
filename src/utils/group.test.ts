import { describe, expect, it } from 'vitest';
import { groupByChat } from './group';

interface Row {
  id: string;
  chatId: string;
}

describe('groupByChat', () => {
  const chatNames = { A: 'Alice', B: 'Bob' };

  it('groups items by chat in first-seen order', () => {
    const rows: Row[] = [
      { id: '1', chatId: 'A' },
      { id: '2', chatId: 'B' },
      { id: '3', chatId: 'A' },
    ];
    const groups = groupByChat(rows, chatNames);
    expect(groups.map((g) => g.chatId)).toEqual(['A', 'B']);
    expect(groups[0]?.items.map((r) => r.id)).toEqual(['1', '3']);
    expect(groups[0]?.chatName).toBe('Alice');
  });

  it('falls back to "Unknown chat" for missing names', () => {
    const groups = groupByChat([{ id: '1', chatId: 'ghost' }], chatNames);
    expect(groups[0]?.chatName).toBe('Unknown chat');
  });

  it('returns an empty array for no items', () => {
    expect(groupByChat([], chatNames)).toEqual([]);
  });
});
