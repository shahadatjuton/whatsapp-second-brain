import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Eye, Pencil, Trash2, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { Textarea } from '@/components/ui/Textarea';
import { useAutosave } from '@/hooks/useAutosave';
import { notesService } from '@/services/notes.service';
import type { Note } from '@/types/models';
import { fromNow } from '@/utils/date';
import { renderMarkdown } from '@/utils/markdown';

interface NoteCardProps {
  note: Note;
  autoFocus?: boolean;
}

/**
 * A single note: an autosaving markdown editor with a preview toggle. There is
 * no save button — edits persist 1s after typing stops (and immediately on blur).
 */
export function NoteCard({ note, autoFocus = false }: NoteCardProps): JSX.Element {
  const [content, setContent] = useState(note.content);
  const [isPreview, setIsPreview] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-sync only when a different note is rendered in this slot.
  useEffect(() => {
    setContent(note.content);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    (value: string) => {
      void notesService.updateContent(note.id, value);
    },
    [note.id],
  );
  useAutosave(content, save, 1000);

  // Auto-grow the textarea to fit its content (dynamic dimension → inline style).
  useEffect(() => {
    const el = textareaRef.current;
    if (el && !isPreview) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [content, isPreview]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Reset the delete confirmation if left untouched.
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const handleBlur = (): void => {
    if (content !== note.content) save(content);
  };

  const handleDelete = (): void => {
    void notesService.remove(note.id);
  };

  return (
    <li className="rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
      {isPreview ? (
        <div className="min-h-[3rem] space-y-2 text-sm text-slate-800 dark:text-slate-100">
          {content.trim() ? (
            renderMarkdown(content)
          ) : (
            <p className="text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onBlur={handleBlur}
          placeholder="Write a note… Markdown supported."
          rows={2}
          aria-label="Note content"
        />
      )}

      <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/10">
        <span className="text-[11px] text-slate-400">Edited {fromNow(note.updatedAt)}</span>

        <div className="flex items-center gap-1">
          <IconButton
            label={isPreview ? 'Edit note' : 'Preview note'}
            onClick={() => setIsPreview((value) => !value)}
          >
            {isPreview ? <Pencil size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          </IconButton>

          {confirmingDelete ? (
            <>
              <IconButton
                label="Confirm delete"
                onClick={handleDelete}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <Check size={15} aria-hidden />
              </IconButton>
              <IconButton label="Cancel delete" onClick={() => setConfirmingDelete(false)}>
                <X size={15} aria-hidden />
              </IconButton>
            </>
          ) : (
            <IconButton label="Delete note" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={15} aria-hidden />
            </IconButton>
          )}
        </div>
      </div>
    </li>
  );
}
