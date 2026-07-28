import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Section, Theme } from '@/types/enums';
import { chromeStorage } from './chrome-storage';

/** Sidebar width bounds (px) — PRD: min 300, max 500, default 380. */
export const SIDEBAR_MIN_WIDTH = 300;
export const SIDEBAR_MAX_WIDTH = 500;
export const SIDEBAR_DEFAULT_WIDTH = 380;

export function clampSidebarWidth(width: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

interface UIState {
  activeSection: Section;
  theme: Theme;
  sidebarWidth: number;
  /** Whether the sidebar is collapsed to its launcher pill. */
  collapsed: boolean;

  setActiveSection: (section: Section) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarWidth: (width: number) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

/**
 * Global UI state for the sidebar. Only presentation preferences live here —
 * domain data stays in IndexedDB and is read through hooks. Theme and width are
 * persisted; `collapsed` intentionally resets to `true` each load so the panel
 * never covers WhatsApp unexpectedly on page open.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeSection: 'notes',
      theme: getInitialTheme(),
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      collapsed: true,

      setActiveSection: (activeSection) => set({ activeSection }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setSidebarWidth: (width) => set({ sidebarWidth: clampSidebarWidth(width) }),
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: 'wa-second-brain:ui',
      storage: createJSONStorage(() => chromeStorage),
      // Persist durable preferences only.
      partialize: (state) => ({
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        activeSection: state.activeSection,
      }),
    },
  ),
);
