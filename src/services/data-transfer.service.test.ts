import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/storage/db';
import { deleteAllData, exportAllData, importData } from './data-transfer.service';

beforeEach(async () => {
  await Promise.all([db.chats.clear(), db.notes.clear(), db.todos.clear(), db.reminders.clear()]);
});

const validNote = {
  id: 'n1',
  chatId: 'A',
  content: 'hello',
  createdAt: 1,
  updatedAt: 2,
};

describe('exportAllData', () => {
  it('produces a versioned bundle of every table', async () => {
    await db.notes.put(validNote);
    const result = await exportAllData();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.app).toBe('whatsapp-second-brain');
      expect(result.value.data.notes).toHaveLength(1);
      expect(result.value.data.todos).toEqual([]);
    }
  });
});

describe('importData', () => {
  it('rejects non-JSON input', async () => {
    const result = await importData('not json {');
    expect(result.ok).toBe(false);
  });

  it('rejects an unrecognized shape', async () => {
    const result = await importData(JSON.stringify({ nope: true }));
    expect(result.ok).toBe(false);
  });

  it('imports valid records and skips malformed ones', async () => {
    const bundle = {
      data: {
        notes: [validNote, { id: '', chatId: 'A' /* invalid */ }],
        todos: [],
        chats: [],
        reminders: [],
      },
    };
    const result = await importData(JSON.stringify(bundle));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.notes).toBe(1);
      expect(result.value.skipped).toBe(1);
    }
    expect(await db.notes.count()).toBe(1);
  });

  it('round-trips an exported bundle', async () => {
    await db.notes.put(validNote);
    const exported = await exportAllData();
    await db.notes.clear();
    expect(await db.notes.count()).toBe(0);

    if (exported.ok) {
      const result = await importData(JSON.stringify(exported.value));
      expect(result.ok && result.value.notes).toBe(1);
    }
    expect(await db.notes.count()).toBe(1);
  });
});

describe('deleteAllData', () => {
  it('clears every table', async () => {
    await db.notes.put(validNote);
    await db.todos.put({
      id: 't1',
      chatId: 'A',
      title: 'x',
      description: '',
      priority: 'low',
      completed: false,
      createdAt: 1,
      updatedAt: 1,
    });
    const result = await deleteAllData();
    expect(result.ok).toBe(true);
    expect(await db.notes.count()).toBe(0);
    expect(await db.todos.count()).toBe(0);
  });
});
