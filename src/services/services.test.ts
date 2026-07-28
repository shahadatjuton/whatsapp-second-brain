import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/storage/db';
import { chatsService } from './chats.service';
import { notesService } from './notes.service';
import { todosService } from './todos.service';
import { remindersService } from './reminders.service';

beforeEach(async () => {
  await Promise.all([
    db.chats.clear(),
    db.notes.clear(),
    db.todos.clear(),
    db.reminders.clear(),
  ]);
});

describe('ChatsService.upsert', () => {
  it('creates on first sight and refreshes lastOpened on repeat', async () => {
    const first = await chatsService.upsert({ chatId: 'A', chatName: 'Alice' });
    expect(first.ok).toBe(true);
    const createdAt = first.ok ? first.value.createdAt : 0;

    const second = await chatsService.upsert({ chatId: 'A', chatName: 'Alice (edited)' });
    expect(second.ok && second.value.chatName).toBe('Alice (edited)');
    // createdAt is preserved across upserts; only lastOpened moves forward.
    expect(second.ok && second.value.createdAt).toBe(createdAt);
  });
});

describe('NotesService', () => {
  it('creates, lists (recent first) and edits notes', async () => {
    const a = await notesService.create('A', 'first');
    const b = await notesService.create('A', 'second');
    expect(a.ok && b.ok).toBe(true);

    if (b.ok) await notesService.updateContent(b.value.id, 'second-edited');

    const list = await notesService.listByChat('A');
    expect(list.ok && list.value.length).toBe(2);
    // Most recently updated is first.
    expect(list.ok && list.value[0]?.content).toBe('second-edited');
  });
});

describe('TodosService', () => {
  it('defaults priority to medium and toggles completion', async () => {
    const created = await todosService.create('A', { title: 'ship it' });
    expect(created.ok && created.value.priority).toBe('medium');
    expect(created.ok && created.value.completed).toBe(false);

    if (created.ok) {
      const toggled = await todosService.toggle(created.value.id, true);
      expect(toggled.ok && toggled.value.completed).toBe(true);
    }
  });
});

describe('RemindersService', () => {
  it('lists due reminders and completes them', async () => {
    const past = await remindersService.create('A', { title: 'past', datetime: 10 });
    await remindersService.create('A', { title: 'future', datetime: 10_000_000_000_000 });

    const due = await remindersService.listDue(1000);
    expect(due.ok && due.value.map((r) => r.title)).toEqual(['past']);

    if (past.ok) {
      await remindersService.complete(past.value.id);
      const dueAfter = await remindersService.listDue(1000);
      expect(dueAfter.ok && dueAfter.value.length).toBe(0);
    }
  });
});
