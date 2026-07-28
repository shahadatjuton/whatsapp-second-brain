/**
 * A minimal Result type for explicit, non-throwing error handling at the
 * storage/service boundary. Keeps IndexedDB failures graceful instead of
 * crashing the UI (see PRD "Error Handling: Never crash").
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Wrap a promise, capturing rejections as a typed Result instead of throwing. */
export async function tryCatch<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return ok(await promise);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
