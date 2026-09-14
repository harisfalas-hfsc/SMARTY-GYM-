import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Straightforward data loading against the backend.
 *
 * Requests are deduplicated while one is already in flight for the same key,
 * so two components asking for the same thing at the same moment cause one
 * network call. Nothing is stored on the device.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Short-lived in-memory results, so leaving a page and coming straight back
 * paints instantly instead of showing a spinner again. Cleared on reload.
 */
const FRESH_MS = 60_000;
const results = new Map<string, { at: number; value: unknown }>();

export function loadRemote<T>(
  key: string,
  loader: () => Promise<T>,
  _userId?: string | null,
): Promise<T> {
  const cached = results.get(key);
  if (cached && Date.now() - cached.at < FRESH_MS) return Promise.resolve(cached.value as T);
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const request = loader()
    .then((value) => {
      results.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

/** Drops cached results so the next read hits the backend again. */
export function invalidateRemote(prefix?: string) {
  if (!prefix) return results.clear();
  for (const key of [...results.keys()]) if (key.startsWith(prefix)) results.delete(key);
}

type State<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
};

/** Loads data for a key and re-runs on demand. */
export function useRemoteData<T>(
  key: string | null,
  loader: () => Promise<T>,
  options: { enabled?: boolean } = {},
): State<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled || !key) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const fresh = await loaderRef.current();
        if (!active) return;
        setData(fresh);
        setError(null);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [key, enabled, tick]);

  return { data, loading, error, refresh };
}
