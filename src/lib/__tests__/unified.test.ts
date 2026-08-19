import { describe, expect, it } from 'vitest';
import { unifiedDiff } from '../diff';
import { createNormalizedDocument } from '../compare';

describe('unifiedDiff (difflib.unified_diff parity)', () => {
  it('matches Python output for a simple modification', () => {
    const a = createNormalizedDocument('a.md', 'one\ntwo\nthree');
    const b = createNormalizedDocument('b.md', 'one\ntwo!\nthree');
    // Verified against: python -c "import difflib; print('\n'.join(
    //   difflib.unified_diff(['one','two','three'], ['one','two!','three'],
    //                        fromfile='a.md', tofile='b.md', lineterm='')))"
    expect(unifiedDiff(a, b)).toBe(
      ['--- a.md', '+++ b.md', '@@ -1,3 +1,3 @@', ' one', '-two', '+two!', ' three'].join('\n'),
    );
  });

  it('is empty for identical documents', () => {
    const a = createNormalizedDocument('a.md', 'same\ntext');
    const b = createNormalizedDocument('b.md', 'same\ntext');
    expect(unifiedDiff(a, b)).toBe('');
  });

  it('emits hunk headers with single-line ranges in short form', () => {
    const a = createNormalizedDocument('a.md', 'only');
    const b = createNormalizedDocument('b.md', 'changed');
    expect(unifiedDiff(a, b)).toBe(
      ['--- a.md', '+++ b.md', '@@ -1 +1 @@', '-only', '+changed'].join('\n'),
    );
  });
});
