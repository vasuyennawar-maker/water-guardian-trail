import { useCallback, useEffect, useState } from "react";

/** Small async state helper so every data view can express loading/error/retry. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  // Any write to the shared report store refreshes every data view, so a new
  // citizen report shows up in the verification queue and authority list too.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener("dwg:reports", onChange);
    return () => window.removeEventListener("dwg:reports", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fn()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return { data, loading, error, retry, offline };
}
