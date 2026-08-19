/** Diff computation — port of app/core/diff.py. */

import { SequenceMatcher } from './sequencematcher';
import type { OpcodeTag } from './sequencematcher';
import { sha1Hex } from './sha1';
import { splitlines } from './pystr';
import type { DiffEntry, DiffSummary, DiffType, NormalizedDocument } from './schemas';

const TAG_CLASSIFICATION: Record<string, DiffType> = {
  insert: 'addition',
  delete: 'deletion',
  replace: 'modification',
};

const FORMAT_SANITIZE_PATTERN = /[\W_]+/gu;

export function classifyTag(tag: OpcodeTag): DiffType {
  const t = TAG_CLASSIFICATION[tag];
  if (!t) throw new Error(`Unknown diff tag: ${tag}`);
  return t;
}

/** Port of difflib.unified_diff (headers, @@ hunks, no trailing \n handling needed post-normalization). */
export function unifiedDiff(docA: NormalizedDocument, docB: NormalizedDocument, n = 3): string {
  const a = splitlines(docA.normalizedText);
  const b = splitlines(docB.normalizedText);
  const matcher = new SequenceMatcher(a, b);
  const out: string[] = [];
  let started = false;
  for (const group of matcher.getGroupedOpcodes(n)) {
    if (!started) {
      started = true;
      out.push(`--- ${docA.name}`);
      out.push(`+++ ${docB.name}`);
    }
    const first = group[0];
    const last = group[group.length - 1];
    const range = (start: number, stop: number): string => {
      const length = stop - start;
      if (length === 1) return `${start + 1}`;
      return `${length ? start + 1 : start},${length}`;
    };
    out.push(`@@ -${range(first[1], last[2])} +${range(first[3], last[4])} @@`);
    for (const [tag, i1, i2, j1, j2] of group) {
      if (tag === 'equal') {
        for (const line of a.slice(i1, i2)) out.push(` ${line}`);
        continue;
      }
      if (tag === 'replace' || tag === 'delete') {
        for (const line of a.slice(i1, i2)) out.push(`-${line}`);
      }
      if (tag === 'replace' || tag === 'insert') {
        for (const line of b.slice(j1, j2)) out.push(`+${line}`);
      }
    }
  }
  return out.join('\n');
}

export function buildDiffEntries(docA: NormalizedDocument, docB: NormalizedDocument): DiffEntry[] {
  const linesA = splitlines(docA.normalizedText);
  const linesB = splitlines(docB.normalizedText);
  const matcher = new SequenceMatcher(linesA, linesB);
  const entries: DiffEntry[] = [];
  for (const [tag, i1, i2, j1, j2] of matcher.getOpcodes()) {
    if (tag === 'equal') continue;
    const beforeSlice = linesA.slice(i1, i2);
    const afterSlice = linesB.slice(j1, j2);
    const diffType = classifyTag(tag);
    const beforeLines = beforeSlice.join('\n');
    const afterLines = afterSlice.join('\n');
    const id = hashEntry(beforeLines, afterLines, diffType, i1, j1);
    const headingSource = diffType !== 'deletion' ? linesB : linesA;
    const headingIndex = diffType !== 'deletion' ? j1 : Math.max(i1 - 1, 0);
    entries.push({
      id,
      diffType,
      heading: extractHeadingContext(headingSource, headingIndex),
      lineNumber: (diffType !== 'deletion' ? j1 : i1) + 1,
      contentBefore: beforeLines,
      contentAfter: afterLines,
      inlineDiff: diffType === 'modification' ? inlineDiff(beforeSlice, afterSlice) : null,
    });
  }
  return entries;
}

export function summarize(entries: readonly DiffEntry[]): DiffSummary {
  const count = (t: DiffType) => entries.filter((e) => e.diffType === t).length;
  return {
    totalDifferences: entries.length,
    additions: count('addition'),
    deletions: count('deletion'),
    modifications: count('modification'),
    formatOnly: count('format_only'),
    generatedAt: new Date(),
    durationMs: null,
  };
}

export function tagFormatOnly(entries: readonly DiffEntry[]): DiffEntry[] {
  return entries.map((entry) =>
    entry.diffType === 'modification' && isFormatOnly(entry)
      ? { ...entry, diffType: 'format_only' as DiffType }
      : entry,
  );
}

function hashEntry(before: string, after: string, diffType: DiffType, i1: number, j1: number): string {
  return sha1Hex(`${diffType}${i1}${j1}${before}${after}`).slice(0, 12);
}

function extractHeadingContext(lines: readonly string[], index: number): string | null {
  for (let i = Math.min(index, lines.length - 1); i >= 0; i--) {
    if (lines[i].startsWith('#')) return lines[i].replace(/^[# ]+/, '').trim();
  }
  return null;
}

/** Simplified ndiff: per-line -/+ markers (the Python differ's ?-hint lines are UI-only there and unused here). */
function inlineDiff(beforeLines: readonly string[], afterLines: readonly string[]): string {
  const matcher = new SequenceMatcher(beforeLines, afterLines);
  const out: string[] = [];
  for (const [tag, i1, i2, j1, j2] of matcher.getOpcodes()) {
    if (tag === 'equal') {
      for (const line of beforeLines.slice(i1, i2)) out.push(`  ${line}`);
    } else if (tag === 'delete' || tag === 'replace') {
      for (const line of beforeLines.slice(i1, i2)) out.push(`- ${line}`);
    }
    if (tag === 'insert' || tag === 'replace') {
      for (const line of afterLines.slice(j1, j2)) out.push(`+ ${line}`);
    }
  }
  return out.join('\n');
}

function isFormatOnly(entry: DiffEntry): boolean {
  const before = sanitize(entry.contentBefore);
  const after = sanitize(entry.contentAfter);
  return Boolean(before || after) && before === after;
}

function sanitize(text: string): string {
  return text.replace(FORMAT_SANITIZE_PATTERN, '').toLowerCase();
}
