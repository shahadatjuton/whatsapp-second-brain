// Generate a backup JSON you can load via Settings → Import to load-test the
// extension (100, 1000, 10000 items…). Usage: node scripts/gen-test-data.mjs 1000
import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const count = Math.max(1, Number(process.argv[2] || 1000));
const now = Date.now();
const CHAT_COUNT = 12;

const chats = Array.from({ length: CHAT_COUNT }, (_, i) => ({
  chatId: `1000000000${i}@c.us`,
  chatName: `Test Contact ${i + 1}`,
  lastOpened: now - i * 1000,
  createdAt: now - i * 100000,
}));

const chatId = (i) => chats[i % CHAT_COUNT].chatId;
const priorities = ['low', 'medium', 'high'];

const notes = Array.from({ length: count }, (_, i) => ({
  id: randomUUID(),
  chatId: chatId(i),
  content: `Test note #${i + 1}\n\n- item a\n- item b\n\n**bold**, _italic_ and \`code\` and [link](https://example.com)`,
  createdAt: now - i * 1000,
  updatedAt: now - i * 500,
}));

const todos = Array.from({ length: Math.round(count / 4) }, (_, i) => ({
  id: randomUUID(),
  chatId: chatId(i),
  title: `Task ${i + 1} — do the thing`,
  description: i % 3 === 0 ? 'Some details about this task.' : '',
  priority: priorities[i % 3],
  completed: i % 5 === 0,
  createdAt: now - i * 1000,
  updatedAt: now - i * 1000,
}));

const reminders = Array.from({ length: Math.round(count / 10) }, (_, i) => ({
  id: randomUUID(),
  chatId: chatId(i),
  title: `Reminder ${i + 1}`,
  datetime: now + (i + 1) * 3_600_000,
  completed: false,
  createdAt: now,
}));

const bundle = {
  app: 'whatsapp-second-brain',
  version: '1.0.0',
  exportedAt: now,
  data: { chats, notes, todos, reminders },
};

const file = `test-data-${count}.json`;
writeFileSync(file, JSON.stringify(bundle, null, 2));
console.log(
  `Wrote ${file}: ${chats.length} chats, ${notes.length} notes, ${todos.length} todos, ${reminders.length} reminders`,
);
