import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bell, CheckSquare, StickyNote, type LucideIcon } from 'lucide-react';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/components/ui/cn';
import { useAllData } from '@/hooks/useAllData';
import { useDebounce } from '@/hooks/useDebounce';
import { notesService } from '@/services/notes.service';
import { remindersService } from '@/services/reminders.service';
import { todosService } from '@/services/todos.service';
import type { Note, Reminder, Todo } from '@/types/models';
import { fromNow } from '@/utils/date';
import { groupByChat, type ChatGroup } from '@/utils/group';
import { PRIORITY_META } from '../todos/priority';

export type DataTab = 'notes' | 'todos' | 'reminders';

interface AllDataBrowserProps {
  open: boolean;
  initialTab: DataTab;
  onClose: () => void;
}

const TABS: ReadonlyArray<{ id: DataTab; label: string; icon: LucideIcon }> = [
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'todos', label: 'Todos', icon: CheckSquare },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

/** One card representing a stored item, with a chat-scoped delete. */
function ItemRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }): JSX.Element {
  return (
    <li className="cv-list-item flex items-start justify-between gap-2 rounded-card border border-black/5 bg-white p-2.5 shadow-soft dark:border-white/10 dark:bg-surface-dark-muted">
      <div className="min-w-0 flex-1">{children}</div>
      <DeleteButton onDelete={onDelete} />
    </li>
  );
}

function renderNote(note: Note): JSX.Element {
  const text = note.content.trim();
  return (
    <>
      <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-100">
        {text || <span className="text-slate-400">Empty note</span>}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">Edited {fromNow(note.updatedAt)}</p>
    </>
  );
}

function renderTodo(todo: Todo): JSX.Element {
  const meta = PRIORITY_META[todo.priority];
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dotClass)} aria-hidden />
      <p
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          todo.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100',
        )}
      >
        {todo.title}
      </p>
    </div>
  );
}

/** Does an item match the search term (searched fields vary by type). */
function matchesQuery(item: Note | Todo | Reminder, tab: DataTab, needle: string): boolean {
  if (tab === 'notes') return (item as Note).content.toLowerCase().includes(needle);
  if (tab === 'todos') {
    const todo = item as Todo;
    return `${todo.title} ${todo.description}`.toLowerCase().includes(needle);
  }
  return (item as Reminder).title.toLowerCase().includes(needle);
}

function renderReminder(reminder: Reminder): JSX.Element {
  const isOverdue = !reminder.completed && reminder.datetime <= Date.now();
  return (
    <>
      <p
        className={cn(
          'truncate text-sm',
          reminder.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100',
        )}
      >
        {reminder.title}
      </p>
      <p className={cn('mt-1 text-[11px]', isOverdue ? 'text-amber-600' : 'text-slate-400')}>
        {isOverdue ? 'Overdue · ' : ''}
        {fromNow(reminder.datetime)}
      </p>
    </>
  );
}

/** Full-panel overlay listing every item across chats, grouped by conversation. */
export function AllDataBrowser({ open, initialTab, onClose }: AllDataBrowserProps): JSX.Element {
  const [tab, setTab] = useState<DataTab>(initialTab);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const data = useAllData();

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setQuery('');
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const rawItems: (Note | Todo | Reminder)[] = data
    ? tab === 'notes'
      ? data.notes
      : tab === 'todos'
        ? data.todos
        : data.reminders
    : [];

  const needle = debouncedQuery.trim().toLowerCase();
  const filtered = needle ? rawItems.filter((item) => matchesQuery(item, tab, needle)) : rawItems;
  const groups: ChatGroup<Note | Todo | Reminder>[] = data
    ? groupByChat(filtered, data.chatNames)
    : [];

  const totalCount = filtered.length;
  const hasAny = rawItems.length > 0;

  const removeItem = (id: string): void => {
    if (tab === 'notes') void notesService.remove(id);
    else if (tab === 'todos') void todosService.remove(id);
    else void remindersService.remove(id);
  };

  const renderItem = (item: Note | Todo | Reminder): JSX.Element => {
    if (tab === 'notes') return renderNote(item as Note);
    if (tab === 'todos') return renderTodo(item as Todo);
    return renderReminder(item as Reminder);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 400, damping: 38 }}
          className="fixed inset-0 z-[2147483001] flex flex-col bg-surface-light dark:bg-surface-dark"
        >
          <header className="flex items-center gap-2 border-b border-black/5 px-3 py-2.5 dark:border-white/10">
            <IconButton label="Back to settings" onClick={onClose}>
              <ArrowLeft size={18} aria-hidden />
            </IconButton>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              All data{' '}
              <span className="font-normal text-slate-400">
                ({totalCount} across {groups.length} chat{groups.length === 1 ? '' : 's'})
              </span>
            </h2>
          </header>

          <nav className="grid grid-cols-3 border-b border-black/5 dark:border-white/10">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                  tab === id
                    ? 'text-brand-fg dark:text-brand'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                )}
              >
                <Icon size={15} aria-hidden />
                {label}
              </button>
            ))}
          </nav>

          {hasAny ? (
            <div className="border-b border-black/5 px-3 py-2 dark:border-white/10">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={`Search all ${tab}…`}
                aria-label={`Search ${tab}`}
              />
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-3">
            {!hasAny ? (
              <EmptyState
                icon={TABS.find((t) => t.id === tab)?.icon ?? StickyNote}
                title={`No ${tab} yet`}
                description="Items you create in any chat will appear here."
              />
            ) : totalCount === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No {tab} match “{debouncedQuery}”.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <section key={group.chatId}>
                    <h3 className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      <span className="truncate">{group.chatName}</span>
                      <span className="font-normal normal-case">· {group.items.length}</span>
                    </h3>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <ItemRow key={item.id} onDelete={() => removeItem(item.id)}>
                          {renderItem(item)}
                        </ItemRow>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
