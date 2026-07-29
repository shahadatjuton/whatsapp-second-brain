// Provide a real, in-memory IndexedDB implementation so Dexie works under Node.
import 'fake-indexeddb/auto';
// Register jest-dom matchers (toBeInTheDocument, toHaveAttribute, …) for the
// component tests. Importing only registers matchers — no DOM access — so this
// is safe under the default Node environment too.
import '@testing-library/jest-dom/vitest';
