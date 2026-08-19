import { describe, expect, it } from 'vitest';
import { compareDocuments, createNormalizedDocument } from '../compare';

const doc = createNormalizedDocument;

describe('compareDocuments', () => {
  it('returns a consistent summary', () => {
    const result = compareDocuments(
      doc('a.md', '# Title\nLine 1\nLine 2'),
      doc('b.md', '# Title\nLine 1 updated\nLine 3'),
    );
    expect(result.diffEntries.length).toBeGreaterThan(0);
    expect(result.diffSummary.totalDifferences).toBe(result.diffEntries.length);
    expect(result.diffSummary.modifications + result.diffSummary.formatOnly).toBeGreaterThanOrEqual(1);
    expect(result.diffSummary.durationMs).not.toBeNull();
    expect(result.unifiedDiff).toBeTruthy();
    expect(result.documentA.stepsApplied.length).toBeGreaterThan(0);
  });

  it('respects context_lines', () => {
    const linesA = ['# Title', ...Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`)];
    const linesB = [...linesA];
    linesB[5] = 'Line 5 changed';
    const a = doc('a.md', linesA.join('\n'));
    const b = doc('b.md', linesB.join('\n'));
    const ctx0 = compareDocuments(a, b, undefined, 0);
    const ctx5 = compareDocuments(a, b, undefined, 5);
    expect(ctx5.unifiedDiff.length).toBeGreaterThan(ctx0.unifiedDiff.length);
  });

  it('counts additions', () => {
    const result = compareDocuments(doc('a.md', '# Title\nLine 1'), doc('b.md', '# Title\nLine 1\nLine 2'));
    expect(result.diffSummary.additions).toBe(1);
    expect(result.diffEntries.some((e) => e.diffType === 'addition')).toBe(true);
  });

  it('identical documents give zero differences', () => {
    const content = '# Title\nLine 1\nLine 2';
    const result = compareDocuments(doc('a.md', content), doc('b.md', content));
    expect(result.diffSummary.totalDifferences).toBe(0);
    expect(result.diffEntries).toEqual([]);
  });

  it('empty documents do not crash', () => {
    const result = compareDocuments(doc('a.md', ''), doc('b.md', ''));
    expect(result.diffSummary.totalDifferences).toBe(0);
    expect(result.documentA.normalizedText).toBe('');
  });
});
