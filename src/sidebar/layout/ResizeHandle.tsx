import { useSidebarResize } from '@/hooks/useSidebarResize';

/**
 * Thin draggable strip on the sidebar's left edge. Presented as a separator to
 * assistive tech; visually a subtle grip that highlights on hover.
 */
export function ResizeHandle(): JSX.Element {
  const { onPointerDown } = useSidebarResize();

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      onPointerDown={onPointerDown}
      className="group absolute left-0 top-0 z-10 flex h-full w-1.5 -translate-x-1/2 cursor-col-resize items-center justify-center"
    >
      <span className="h-10 w-1 rounded-full bg-transparent transition-colors group-hover:bg-brand/60" />
    </div>
  );
}
