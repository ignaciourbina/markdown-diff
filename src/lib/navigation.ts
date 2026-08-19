/** Diff navigation — port of app/core/navigation.py. */

import type { DiffEntry } from './schemas';

export interface NavigationIndex {
  order: string[];
  positions: Map<string, number>;
}

export function buildNavigationIndex(entries: Iterable<DiffEntry>): NavigationIndex {
  const order: string[] = [];
  const positions = new Map<string, number>();
  let position = 0;
  for (const entry of entries) {
    order.push(entry.id);
    positions.set(entry.id, position);
    position += 1;
  }
  return { order, positions };
}

export function getNext(entryId: string, index: NavigationIndex): string | null {
  const position = index.positions.get(entryId);
  if (position === undefined) return null;
  return position + 1 < index.order.length ? index.order[position + 1] : null;
}

export function getPrevious(entryId: string, index: NavigationIndex): string | null {
  const position = index.positions.get(entryId);
  if (position === undefined || position === 0) return null;
  return index.order[position - 1];
}
