import type { Note } from '@/types/models';
import { db } from '../db';
import { noteSchema } from '../schemas';
import { ChatScopedRepository } from './chat-scoped.repository';

/** Persistence for per-chat markdown notes. */
export class NotesRepository extends ChatScopedRepository<Note> {
  public constructor() {
    super(db.notes, noteSchema);
  }
}

export const notesRepository = new NotesRepository();
