"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "typedeck:";

/**
 * localStorage-backed state. Reads happen after mount so server and first
 * client render agree, avoiding a hydration mismatch.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Corrupt or unavailable storage: keep the default.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota or private-mode failures are not worth interrupting the user for.
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}

/** A persisted set of font ids with a toggle helper. */
export function usePersistentSet(key: string) {
  const [items, setItems] = usePersistentState<string[]>(key, []);
  const set = new Set(items);

  const toggle = useCallback(
    (id: string) => {
      setItems((current) =>
        current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      );
    },
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  return { set, toggle, clear, count: items.length };
}
