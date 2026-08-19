import { describe, expect, it } from 'vitest';
import { buildNavigationIndex, getNext, getPrevious } from '../navigation';
import type { DiffEntry } from '../schemas';

const makeEntry = (id: string): DiffEntry => ({
  id,
  diffType: 'modification',
  heading: null,
  lineNumber: 1,
  contentBefore: '',
  contentAfter: '',
  inlineDiff: null,
});

describe('navigation index', () => {
  it('produces correct order and positions', () => {
    const index = buildNavigationIndex([makeEntry('D1'), makeEntry('D2'), makeEntry('D3')]);
    expect(index.order).toEqual(['D1', 'D2', 'D3']);
    expect(Object.fromEntries(index.positions)).toEqual({ D1: 0, D2: 1, D3: 2 });
  });

  it('handles empty entries', () => {
    const index = buildNavigationIndex([]);
    expect(index.order).toEqual([]);
  });

  it('walks next and previous with boundaries', () => {
    const index = buildNavigationIndex([makeEntry('D1'), makeEntry('D2')]);
    expect(getNext('D1', index)).toBe('D2');
    expect(getNext('D2', index)).toBeNull();
    expect(getPrevious('D2', index)).toBe('D1');
    expect(getPrevious('D1', index)).toBeNull();
    expect(getNext('missing', index)).toBeNull();
    expect(getPrevious('missing', index)).toBeNull();
  });
});
