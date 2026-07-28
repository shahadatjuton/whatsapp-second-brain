import { MessageCircle, MessageCircleOff } from 'lucide-react';
import { useActiveChat } from '@/hooks/useActiveChat';

/**
 * Shows which conversation the sidebar's data is currently scoped to. When no
 * chat is open, prompts the user to open one.
 */
export function ActiveChatBar(): JSX.Element {
  const chat = useActiveChat();

  return (
    <div className="flex items-center gap-2 border-b border-black/5 bg-surface-muted px-4 py-2 dark:border-white/10 dark:bg-surface-dark-muted">
      {chat ? (
        <MessageCircle className="h-4 w-4 shrink-0 text-brand" aria-hidden />
      ) : (
        <MessageCircleOff className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      )}
      <span
        className="truncate text-xs font-medium text-slate-600 dark:text-slate-300"
        title={chat?.chatName}
      >
        {chat ? chat.chatName : 'Open a chat to get started'}
      </span>
    </div>
  );
}
