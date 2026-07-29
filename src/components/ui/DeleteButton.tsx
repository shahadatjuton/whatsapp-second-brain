import { useEffect, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DeleteButtonProps {
  onDelete: () => void;
  label?: string;
  size?: number;
}

/**
 * Two-step delete affordance: the trash icon reveals confirm/cancel, which auto-
 * resets after a few seconds. Centralizes the pattern used across cards.
 */
export function DeleteButton({
  onDelete,
  label = 'Delete',
  size = 15,
}: DeleteButtonProps): JSX.Element {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <IconButton
          label={`Confirm ${label.toLowerCase()}`}
          onClick={() => {
            setConfirming(false);
            onDelete();
          }}
          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
        >
          <Check size={size} aria-hidden />
        </IconButton>
        <IconButton label="Cancel" onClick={() => setConfirming(false)}>
          <X size={size} aria-hidden />
        </IconButton>
      </span>
    );
  }

  return (
    <IconButton label={label} onClick={() => setConfirming(true)}>
      <Trash2 size={size} aria-hidden />
    </IconButton>
  );
}
