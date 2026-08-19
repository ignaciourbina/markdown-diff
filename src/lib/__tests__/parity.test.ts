/**
 * Cross-engine parity: the fixtures were produced by the original Python
 * implementation (compare-versions, app/core/compare.py). This test locks
 * the TypeScript port to that reference output — entry ids included, since
 * both engines hash sha1 over the same fields.
 *
 * Regenerate python_out.json from the Python repo if the engine is ever
 * intentionally changed.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compareDocuments, createNormalizedDocument } from '../compare';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (name: string) => readFileSync(join(fixtures, name), 'utf8');

interface PythonOut {
  entries: Array<{
    id: string; type: string; line: number;
    heading: string | null; before: string; after: string;
  }>;
  summary: { total: number; add: number; del: number; mod: number; fmt: number };
  unified: string;
  norm_a: string;
}

describe('parity with the Python engine', () => {
  const py: PythonOut = JSON.parse(read('python_out.json'));
  const result = compareDocuments(
    createNormalizedDocument('a.md', read('doc_a.md')),
    createNormalizedDocument('b.md', read('doc_b.md')),
  );

  it('reproduces the normalized text', () => {
    expect(result.documentA.normalizedText).toBe(py.norm_a);
  });

  it('reproduces the unified diff byte for byte', () => {
    expect(result.unifiedDiff).toBe(py.unified);
  });

  it('reproduces the summary counts', () => {
    expect({
      total: result.diffSummary.totalDifferences,
      add: result.diffSummary.additions,
      del: result.diffSummary.deletions,
      mod: result.diffSummary.modifications,
      fmt: result.diffSummary.formatOnly,
    }).toEqual(py.summary);
  });

  it('reproduces every diff entry, ids included', () => {
    expect(result.diffEntries.length).toBe(py.entries.length);
    result.diffEntries.forEach((e, i) => {
      const p = py.entries[i];
      expect({
        id: e.id, type: e.diffType, line: e.lineNumber,
        heading: e.heading, before: e.contentBefore, after: e.contentAfter,
      }).toEqual(p);
    });
  });
});
