export interface ChatGroup<T> {
  chatId: string;
  chatName: string;
  items: T[];
}

/**
 * Group chat-scoped records by their chat, resolving display names and
 * preserving first-seen chat order. Used by the "all data" browser so the user
 * can see which conversation each note/todo/reminder belongs to.
 */
export function groupByChat<T extends { chatId: string }>(
  items: T[],
  chatNames: Record<string, string>,
): ChatGroup<T>[] {
  const order: string[] = [];
  const byChat = new Map<string, T[]>();

  for (const item of items) {
    const existing = byChat.get(item.chatId);
    if (existing) {
      existing.push(item);
    } else {
      byChat.set(item.chatId, [item]);
      order.push(item.chatId);
    }
  }

  return order.map((chatId) => ({
    chatId,
    chatName: chatNames[chatId] ?? 'Unknown chat',
    items: byChat.get(chatId) ?? [],
  }));
}
