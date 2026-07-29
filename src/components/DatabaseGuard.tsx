import { useState, type ReactNode } from 'react';
import { DatabaseZap } from 'lucide-react';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Spinner } from './ui/Spinner';
import { useDatabaseStatus } from '@/hooks/useDatabaseStatus';

/**
 * Gate the sidebar content behind an IndexedDB availability check. If storage
 * can't be opened, show a graceful, retryable message instead of a crash
 * (PRD "Error Handling: never crash").
 */
export function DatabaseGuard({ children }: { children: ReactNode }): JSX.Element {
  const [nonce, setNonce] = useState(0);
  const status = useDatabaseStatus(nonce);

  if (status === 'checking') {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Checking storage" />
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <EmptyState
        icon={DatabaseZap}
        title="Storage unavailable"
        description="This extension needs your browser's local storage (IndexedDB), which appears to be disabled — for example in some private windows."
        action={
          <Button size="sm" variant="secondary" onClick={() => setNonce((value) => value + 1)}>
            Try again
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
