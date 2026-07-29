import { useEffect, useState } from 'react';
import { isDatabaseAvailable } from '@/storage/db';

export type DatabaseStatus = 'checking' | 'ready' | 'unavailable';

/**
 * Probe whether IndexedDB can be opened. Pass a changing `nonce` to re-check
 * (e.g. from a Retry button). Lets the UI degrade gracefully instead of
 * crashing when storage is disabled (some private windows, locked-down browsers).
 */
export function useDatabaseStatus(nonce = 0): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>('checking');

  useEffect(() => {
    let active = true;
    setStatus('checking');
    void isDatabaseAvailable().then((result) => {
      if (active) setStatus(result.ok ? 'ready' : 'unavailable');
    });
    return () => {
      active = false;
    };
  }, [nonce]);

  return status;
}
