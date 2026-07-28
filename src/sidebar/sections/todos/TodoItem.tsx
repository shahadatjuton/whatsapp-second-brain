import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/components/ui/cn';
import { PRIORITIES } from '@/types/enums';
import type { Todo } from '@/types/models';
import { todosService } from '@/services/todos.service';
import { PRIORITY_META } from './priority';

const todoFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string(),
  priority: z.enum(PRIORITIES),
});
type TodoFormValues = z.infer<typeof todoFormSchema>;

interface TodoItemProps {
  todo: Todo;
}

/** A single todo row: completion toggle, priority, expandable RHF+Zod editor. */
export function TodoItem({ todo }: TodoItemProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = PRIORITY_META[todo.priority];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
    },
  });

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const onSubmit = handleSubmit(async (values) => {
    await todosService.update(todo.id, values);
    setIsEditing(false);
  });

  const startEditing = (): void => {
    reset({ title: todo.title, description: todo.description, priority: todo.priority });
    setIsEditing(true);
    setIsExpanded(true);
  };

  if (isEditing) {
    return (
      <li className="rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <div>
            <Input placeholder="Task title" aria-label="Task title" {...register('title')} />
            {errors.title ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.title.message}</p>
            ) : null}
          </div>
          <Textarea
            placeholder="Add details (optional)"
            aria-label="Task description"
            rows={2}
            className="rounded-card bg-surface-muted p-2 dark:bg-surface-dark"
            {...register('description')}
          />
          <select
            aria-label="Priority"
            className="h-9 cursor-pointer rounded-card bg-surface-muted px-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:bg-surface-dark dark:text-slate-200"
            {...register('priority')}
          >
            {[...PRIORITIES].reverse().map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-card border border-black/5 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
      <div className="flex items-start gap-2.5">
        <div className="pt-0.5">
          <Checkbox
            checked={todo.completed}
            onChange={(checked) => void todosService.toggle(todo.id, checked)}
            label={todo.completed ? 'Mark as not done' : 'Mark as done'}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'whitespace-pre-wrap break-words text-sm',
              todo.completed
                ? 'text-slate-400 line-through'
                : 'text-slate-800 dark:text-slate-100',
            )}
          >
            {todo.title}
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <Badge className={meta.badgeClass}>
              <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} aria-hidden />
              {meta.label}
            </Badge>
            {todo.description ? (
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="inline-flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-expanded={isExpanded}
              >
                Details
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : null}
          </div>

          {isExpanded && todo.description ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {todo.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <IconButton label="Edit task" onClick={startEditing}>
            <Pencil size={15} aria-hidden />
          </IconButton>
          {confirmingDelete ? (
            <>
              <IconButton
                label="Confirm delete"
                onClick={() => void todosService.remove(todo.id)}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <Check size={15} aria-hidden />
              </IconButton>
              <IconButton label="Cancel delete" onClick={() => setConfirmingDelete(false)}>
                <X size={15} aria-hidden />
              </IconButton>
            </>
          ) : (
            <IconButton label="Delete task" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={15} aria-hidden />
            </IconButton>
          )}
        </div>
      </div>
    </li>
  );
}
