import { useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { Priority } from '@/types/enums';
import { todosService } from '@/services/todos.service';
import { PRIORITY_OPTIONS } from './priority';

interface TodoComposerProps {
  chatId: string;
}

/**
 * Quick-add composer. Enter creates the task; Shift+Enter inserts a newline
 * (PRD keyboard UX). Priority persists between adds for fast entry.
 */
export function TodoComposer({ chatId }: TodoComposerProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const submit = async (): Promise<void> => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle('');
    await todosService.create(chatId, { title: trimmed, priority });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
      <Textarea
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task…"
        rows={1}
        aria-label="New task"
      />
      <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-2.5 dark:border-white/10">
        <Select
          value={priority}
          onChange={setPriority}
          options={PRIORITY_OPTIONS}
          aria-label="Task priority"
        />
        <Button size="sm" onClick={() => void submit()} disabled={!title.trim()}>
          <Plus size={15} aria-hidden />
          Add task
        </Button>
      </div>
    </div>
  );
}
