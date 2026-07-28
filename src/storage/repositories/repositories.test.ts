import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { notesRepository } from './notes.repository';
import { remindersRepository } from './reminders.repository';

async function resetDb(): Promise<void> {
  await Promise.all([
    db.chats.clear(),
    db.notes.clear(),
    db.todos.clear(),
    db.reminders.clear(),
  ]);
}

beforeEach(resetDb);

describe('BaseRepository (via NotesRepository)', () => {
  const note = {
    id: 'note-1',
    chatId: 'chat-A',
    content: 'hello',
    createdAt: 1,
    updatedAt: 1,
  };

  it('puts and reads back an entity', async () => {
    const put = await notesRepository.put(note);
    expect(put.ok).toBe(true);

    const found = await notesRepository.getById('note-1');
    expect(found.ok && found.value?.content).toBe('hello');
  });

  it('rejects invalid entities at the validation boundary', async () => {
    const bad = await notesRepository.put({ ...note, id: '' });
    expect(bad.ok).toBe(false);

    const all = await notesRepository.getAll();
    expect(all.ok && all.value.length).toBe(0);
  });

  it('updates via shallow merge', async () => {
    await notesRepository.put(note);
    const updated = await notesRepository.update('note-1', { content: 'world', updatedAt: 2 });
    expect(updated.ok && updated.value.content).toBe('world');
    expect(updated.ok && updated.value.createdAt).toBe(1);
  });

  it('returns an error when updating a missing entity', async () => {
    const res = await notesRepository.update('missing', { content: 'x' });
    expect(res.ok).toBe(false);
  });

  it('deletes an entity', async () => {
    await notesRepository.put(note);
    await notesRepository.delete('note-1');
    const found = await notesRepository.getById('note-1');
    expect(found.ok && found.value).toBeUndefined();
  });
});

describe('ChatScopedRepository', () => {
  it('isolates rows by chatId', async () => {
    await notesRepository.put({ id: 'n1', chatId: 'A', content: 'a', createdAt: 1, updatedAt: 1 });
    await notesRepository.put({ id: 'n2', chatId: 'B', content: 'b', createdAt: 1, updatedAt: 1 });

    const forA = await notesRepository.getByChatId('A');
    expect(forA.ok && forA.value.map((n) => n.id)).toEqual(['n1']);
  });

  it('deletes all rows for a chat', async () => {
    await notesRepository.put({ id: 'n1', chatId: 'A', content: 'a', createdAt: 1, updatedAt: 1 });
    await notesRepository.put({ id: 'n2', chatId: 'A', content: 'b', createdAt: 1, updatedAt: 1 });
    const count = await notesRepository.deleteByChatId('A');
    expect(count.ok && count.value).toBe(2);
  });
});

describe('RemindersRepository.getDue', () => {
  it('returns only past, incomplete reminders', async () => {
    await remindersRepository.put({
      id: 'r-due', chatId: 'A', title: 'due', datetime: 100, completed: false, createdAt: 0,
    });
    await remindersRepository.put({
      id: 'r-future', chatId: 'A', title: 'future', datetime: 5000, completed: false, createdAt: 0,
    });
    await remindersRepository.put({
      id: 'r-done', chatId: 'A', title: 'done', datetime: 50, completed: true, createdAt: 0,
    });

    const due = await remindersRepository.getDue(1000);
    expect(due.ok && due.value.map((r) => r.id)).toEqual(['r-due']);
  });
});
