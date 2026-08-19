import { describe, expect, it } from 'vitest';
import { buildDiffEntries, classifyTag, tagFormatOnly } from '../diff';
import { createNormalizedDocument } from '../compare';

const doc = (name: string, text: string) => createNormalizedDocument(name, text);

describe('diff entries', () => {
  it('classifies modifications and finds heading context', () => {
    const entries = tagFormatOnly(
      buildDiffEntries(doc('a.md', '# Title\nLine 1\nLine 2'), doc('b.md', '# Title\nLine 1\nLine 2 updated')),
    );
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) if (e.heading) expect(e.heading).toBe('Title');
    expect(entries[0].diffType).toBe('modification');
    expect(entries[0].inlineDiff).not.toBeNull();
  });

  it('identifies additions', () => {
    const entries = tagFormatOnly(
      buildDiffEntries(doc('a.md', '# Title\nLine 1'), doc('b.md', '# Title\nLine 1\nLine 2')),
    );
    expect(entries.some((e) => e.diffType === 'addition')).toBe(true);
  });

  it('detects format-only whitespace changes', () => {
    const entries = tagFormatOnly(
      buildDiffEntries(doc('a.md', 'Clause\n- Item 1\n- Item  2'), doc('b.md', 'Clause\n- Item 1\n- Item 2')),
    );
    const formatOnly = entries.filter((e) => e.diffType === 'format_only');
    expect(formatOnly.length).toBeGreaterThan(0);
    expect(formatOnly[0].lineNumber).toBe(3);
  });

  it('classifyTag throws on unknown tags', () => {
    expect(() => classifyTag('bogus' as never)).toThrow(/Unknown diff tag: bogus/);
  });

  it('empty documents produce no entries', () => {
    expect(buildDiffEntries(doc('a.md', ''), doc('b.md', ''))).toEqual([]);
  });

  it('does not crash on HTML script tags', () => {
    const entries = tagFormatOnly(
      buildDiffEntries(
        doc('a.md', "# Title\n<script>alert('xss')</script>"),
        doc('b.md', "# Title\n<div onclick='hack()'>safe</div>"),
      ),
    );
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) expect(typeof e.id).toBe('string');
  });
});
