import type { Priority } from './enums';

/**
 * Domain models. These mirror the Dexie tables exactly.
 * All timestamps are epoch milliseconds (numbers) for cheap indexing/sorting;
 * formatting for display is done with dayjs at the view layer.
 */

export interface Chat {
  /** Stable identifier derived from WhatsApp's chat (JID when available). */
  chatId: string;
  chatName: string;
  lastOpened: number;
  createdAt: number;
}

export interface Note {
  id: string;
  chatId: string;
  /** Markdown content. */
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  chatId: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  chatId: string;
  title: string;
  /** Fire time, epoch ms. */
  datetime: number;
  completed: boolean;
  createdAt: number;
}

/** Normalized context emitted by the ChatDetector when the active chat changes. */
export interface ChatContext {
  chatId: string;
  chatName: string;
}
