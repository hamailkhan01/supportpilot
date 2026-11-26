"use client";

import { useCallback, useEffect, useState } from "react";
import type { KbDocument, Lead, Settings } from "./types";
import { DEFAULT_SETTINGS, SAMPLE_DOCS } from "./sampleData";

// The knowledge base lives in the browser (localStorage), so the app needs no
// database and deploys anywhere. The server stays stateless.

const KEYS = {
  docs: "supportpilot.docs.v1",
  settings: "supportpilot.settings.v1",
  leads: "supportpilot.leads.v1",
} as const;

const EVENT = "supportpilot:store";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable: keep working in memory
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setValue(read(key, fallback));
    setLoaded(true);
    const sync = (e: Event) => {
      const changed = e instanceof StorageEvent ? e.key : (e as CustomEvent<string>).detail;
      if (changed === key) setValue(read(key, fallback));
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // fallback is a constant per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(read(key, fallback)) : next;
      setValue(resolved);
      write(key, resolved);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, update, loaded] as const;
}

export const useDocs = () => useStored<KbDocument[]>(KEYS.docs, SAMPLE_DOCS);
export const useSettings = () => useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
export const useLeads = () => useStored<Lead[]>(KEYS.leads, []);

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
