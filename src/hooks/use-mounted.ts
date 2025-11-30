"use client";

import { useSyncExternalStore } from "react";

// A simple store that tracks client-side mounting
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook that returns true when the component is mounted on the client.
 * Uses useSyncExternalStore to avoid hydration mismatches without
 * triggering the set-state-in-effect lint rule.
 */
export function useMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
