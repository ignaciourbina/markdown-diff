import { describe, expect, it } from 'vitest';
import { diffTokens, tokenize } from '../tokens';

describe('token diff', () => {
  it('tokenize preserves whitespace', () => {
    const result = tokenize('Hello  world!\nNew line.');
    expect(result[0]).toBe('Hello');
    expect(result[1]).toBe('  ');
    expect(result.some((t) => t === '\n')).toBe(true);
  });

  it('identifies insertions and deletions', () => {
    const [before, after] = diffTokens(
      'Here is a nice story about a little fox. One day ...',
      'Hear this nice story about a cute fox. One morning ...',
    );
    expect(before).toContainEqual(['Here', 'delete']);
    expect(after).toContainEqual(['Hear', 'insert']);
    expect(before).toContainEqual(['story', 'equal']);
    expect(after).toContainEqual(['story', 'equal']);
  });

  it('empty strings give empty segments', () => {
    const [before, after] = diffTokens('', '');
    expect(before).toEqual([]);
    expect(after).toEqual([]);
  });

  it('identical strings are all equal', () => {
    const text = 'Hello world, this is a test.';
    const [before, after] = diffTokens(text, text);
    expect(before.length).toBeGreaterThan(0);
    expect(before.every(([, tag]) => tag === 'equal')).toBe(true);
    expect(after.every(([, tag]) => tag === 'equal')).toBe(true);
  });
});
