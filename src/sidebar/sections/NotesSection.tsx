import { useState } from 'react';
import { AlertTriangle, Plus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Spinner } from '@/components/ui/Spinner';
import { useActiveChat } from '@/hooks/useActiveChat';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotes } from '@/hooks/useNotes';
import { notesService } from '@/services/notes.service';
import { NoteCard } from './notes/NoteCard';

/**
 * Notes section: per-chat markdown notes with autosave and instant search.
 * Handles the four required states — no chat, loading, error, empty — plus the
 * "no search matches" case.
 */
export function NotesSection(): JSX.Element {
  const chat = useActiveChat();
  const chatId = chat?.chatId ?? null;
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const result = useNotes(chatId);

  if (!chatId) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Open a chat to get started"
        description="Notes are saved privately per conversation."
      />
    );
  }

  if (result === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading notes" />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load notes"
        description="Your browser storage may be unavailable. Your data is safe — try again."
      />
    );
  }

  const notes = result.value;
  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const filtered = normalizedQuery
    ? notes.filter((note) => note.content.toLowerCase().includes(normalizedQuery))
    : notes;

  const handleCreate = async (): Promise<void> => {
    const created = await notesService.create(chatId, '');
    if (created.ok) setFocusNoteId(created.value.id);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search notes…"
          aria-label="Search notes"
          className="flex-1"
        />
        <Button size="sm" onClick={() => void handleCreate()}>
          <Plus size={16} aria-hidden />
          New
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Start writing your private notes."
          description="Add your first note for this chat — it autosaves as you type."
          action={
            <Button size="sm" variant="secondary" onClick={() => void handleCreate()}>
              <Plus size={16} aria-hidden />
              New note
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400">No notes match “{debouncedQuery}”.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} autoFocus={note.id === focusNoteId} />
          ))}
        </ul>
      )}
    </div>
  );
}
