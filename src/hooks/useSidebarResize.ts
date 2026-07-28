import { useCallback, useRef } from 'react';
import { useUIStore } from '@/state/ui.store';

interface ResizeHandlers {
  onPointerDown: (event: React.PointerEvent) => void;
}

/**
 * Drag-to-resize behaviour for the sidebar's left edge. The panel is anchored to
 * the right of the viewport, so the width is `viewportWidth - pointerX`. Bounds
 * are enforced by the store's `clampSidebarWidth`.
 */
export function useSidebarResize(): ResizeHandlers {
  const setSidebarWidth = useUIStore((state) => state.setSidebarWidth);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      draggingRef.current = true;
      document.body.style.userSelect = 'none';

      const handleMove = (moveEvent: PointerEvent): void => {
        if (!draggingRef.current) return;
        setSidebarWidth(window.innerWidth - moveEvent.clientX);
      };

      const handleUp = (): void => {
        draggingRef.current = false;
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [setSidebarWidth],
  );

  return { onPointerDown };
}
